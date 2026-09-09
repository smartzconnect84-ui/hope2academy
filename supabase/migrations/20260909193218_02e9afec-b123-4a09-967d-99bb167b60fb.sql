
DROP VIEW IF EXISTS public.staff_directory;

CREATE TABLE public.staff_salaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL UNIQUE REFERENCES public.staff(id) ON DELETE CASCADE,
  salary_usd numeric,
  salary_lrd numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_salaries TO authenticated;
GRANT ALL ON public.staff_salaries TO service_role;

ALTER TABLE public.staff_salaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin view salaries" ON public.staff_salaries
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmin manage salaries" ON public.staff_salaries
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'))
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE TRIGGER staff_salaries_touch BEFORE UPDATE ON public.staff_salaries
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.staff_salaries (staff_id, salary_usd, salary_lrd)
SELECT id, salary_usd, salary_lrd FROM public.staff
WHERE salary_usd IS NOT NULL OR salary_lrd IS NOT NULL
ON CONFLICT (staff_id) DO NOTHING;

ALTER TABLE public.staff DROP COLUMN salary_usd;
ALTER TABLE public.staff DROP COLUMN salary_lrd;

DROP POLICY IF EXISTS "Superadmin view staff payroll" ON public.staff;
DROP POLICY IF EXISTS "Superadmin manage staff payroll" ON public.staff;

CREATE POLICY "Staff view staff" ON public.staff
FOR SELECT TO authenticated
USING (public.is_staff(auth.uid()) OR public.is_teacher_or_staff(auth.uid()));

CREATE POLICY "Staff manage staff" ON public.staff
FOR ALL TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));
