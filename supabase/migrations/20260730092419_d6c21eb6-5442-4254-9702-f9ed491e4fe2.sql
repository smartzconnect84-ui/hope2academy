-- 1. Prevent privilege escalation via profiles.linked_children (and other privileged fields)
CREATE OR REPLACE FUNCTION public.guard_profile_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_staff(auth.uid()) THEN
    RETURN NEW;
  END IF;
  NEW.linked_children  := OLD.linked_children;
  NEW.grade            := OLD.grade;
  NEW.class_name       := OLD.class_name;
  NEW.department       := OLD.department;
  NEW.subjects         := OLD.subjects;
  NEW.graduation_year  := OLD.graduation_year;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.guard_profile_privileged_fields() FROM anon, authenticated, public;

DROP TRIGGER IF EXISTS guard_profile_privileged_fields_trg ON public.profiles;
CREATE TRIGGER guard_profile_privileged_fields_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileged_fields();

-- 2. Replace always-true INSERT policies with validated ones
DROP POLICY IF EXISTS "Anyone can apply" ON public.admissions;
CREATE POLICY "Anyone can apply" ON public.admissions
FOR INSERT TO anon, authenticated
WITH CHECK (
  length(btrim(applicant_name)) BETWEEN 2 AND 120
  AND (status IS NULL OR status = 'new')
  AND (notes IS NULL OR length(notes) <= 2000)
);

DROP POLICY IF EXISTS "Anyone donate" ON public.donations;
CREATE POLICY "Anyone donate" ON public.donations
FOR INSERT TO anon, authenticated
WITH CHECK (
  length(btrim(donor_name)) BETWEEN 2 AND 120
  AND amount_usd > 0 AND amount_usd <= 1000000
  AND amount_lrd >= 0 AND amount_lrd <= 1000000000
  AND (message IS NULL OR length(message) <= 2000)
  AND (donation_date IS NULL OR donation_date <= (now()::date + 1))
);

-- 3. Trigger-only SECURITY DEFINER functions must not be callable by API roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM anon, authenticated, public;