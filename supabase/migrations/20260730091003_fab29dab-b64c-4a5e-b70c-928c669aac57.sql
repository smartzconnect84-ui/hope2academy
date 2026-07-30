ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;
DROP POLICY IF EXISTS "Public view settings" ON public.site_settings;
CREATE POLICY "Public view public settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (is_public = true);
CREATE POLICY "Staff view all settings" ON public.site_settings FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));