
DROP POLICY IF EXISTS "Auth view resources" ON public.resources;
CREATE POLICY "View resources by visibility" ON public.resources
  FOR SELECT TO authenticated
  USING (visibility = 'public' OR is_staff(auth.uid()));
