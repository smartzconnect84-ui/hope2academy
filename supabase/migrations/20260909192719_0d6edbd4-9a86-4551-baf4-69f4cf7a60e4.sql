
DROP POLICY IF EXISTS "Staff view staff" ON public.staff;
DROP POLICY IF EXISTS "Staff manage staff" ON public.staff;

CREATE POLICY "Superadmin view staff payroll" ON public.staff
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmin manage staff payroll" ON public.staff
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'))
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE OR REPLACE VIEW public.staff_directory
WITH (security_invoker = off) AS
SELECT id, profile_id, name, role, department, phone, email, status, hire_date, created_at, updated_at
FROM public.staff;

REVOKE ALL ON public.staff_directory FROM PUBLIC, anon;
GRANT SELECT ON public.staff_directory TO authenticated;
