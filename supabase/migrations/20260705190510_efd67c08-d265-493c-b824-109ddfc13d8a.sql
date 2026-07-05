
-- =========================================================
-- HOPE2 ACADEMY — full schema
-- =========================================================

-- Shared trigger for updated_at (touch_updated_at already exists)

-- Helper: check if user is teacher/staff/admin
CREATE OR REPLACE FUNCTION public.is_teacher_or_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('superadmin','admin','teacher'));
$$;

-- Helper: check if a parent is linked to a child profile
CREATE OR REPLACE FUNCTION public.is_parent_of(_parent uuid, _child uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _parent AND _child = ANY(linked_children)
  );
$$;

-- ---------------------------------------------------------
-- ACADEMICS
-- ---------------------------------------------------------

CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  level text,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  teacher_name text,
  room text,
  capacity int DEFAULT 30,
  student_count int DEFAULT 0,
  schedule text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT ALL ON public.classes TO service_role;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Any auth can view classes" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff manage classes" ON public.classes FOR ALL TO authenticated
  USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE TRIGGER classes_touch BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  class_name text,
  subject text,
  due_date date,
  status text DEFAULT 'Open',
  submissions int DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments TO authenticated;
GRANT ALL ON public.assignments TO service_role;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view assignments" ON public.assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers manage assignments" ON public.assignments FOR ALL TO authenticated
  USING (is_teacher_or_staff(auth.uid())) WITH CHECK (is_teacher_or_staff(auth.uid()));
CREATE TRIGGER assignments_touch BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  subject text NOT NULL,
  class_name text,
  term text,
  score numeric,
  letter_grade text,
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.grades TO authenticated;
GRANT ALL ON public.grades TO service_role;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students see own grades" ON public.grades FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Parents see child grades" ON public.grades FOR SELECT TO authenticated USING (is_parent_of(auth.uid(), student_id));
CREATE POLICY "Teachers view all grades" ON public.grades FOR SELECT TO authenticated USING (is_teacher_or_staff(auth.uid()));
CREATE POLICY "Teachers manage grades" ON public.grades FOR INSERT TO authenticated WITH CHECK (is_teacher_or_staff(auth.uid()));
CREATE POLICY "Teachers update grades" ON public.grades FOR UPDATE TO authenticated USING (is_teacher_or_staff(auth.uid()));
CREATE POLICY "Staff delete grades" ON public.grades FOR DELETE TO authenticated USING (is_staff(auth.uid()));
CREATE TRIGGER grades_touch BEFORE UPDATE ON public.grades FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_date date NOT NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  class_name text,
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_name text,
  status text DEFAULT 'present', -- present/absent/late
  present int,
  absent int,
  late int,
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students see own attendance" ON public.attendance FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Parents see child attendance" ON public.attendance FOR SELECT TO authenticated USING (is_parent_of(auth.uid(), student_id));
CREATE POLICY "Teachers manage attendance" ON public.attendance FOR ALL TO authenticated
  USING (is_teacher_or_staff(auth.uid())) WITH CHECK (is_teacher_or_staff(auth.uid()));
CREATE TRIGGER attendance_touch BEFORE UPDATE ON public.attendance FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.timetable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day text NOT NULL,
  start_time text NOT NULL,
  end_time text,
  subject text,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  class_name text,
  teacher_name text,
  room text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timetable TO authenticated;
GRANT ALL ON public.timetable TO service_role;
ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view timetable" ON public.timetable FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff manage timetable" ON public.timetable FOR ALL TO authenticated
  USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE TRIGGER timetable_touch BEFORE UPDATE ON public.timetable FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  class_name text,
  term text,
  exam_date date,
  room text,
  status text DEFAULT 'Scheduled',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exams TO authenticated;
GRANT ALL ON public.exams TO service_role;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view exams" ON public.exams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers manage exams" ON public.exams FOR ALL TO authenticated
  USING (is_teacher_or_staff(auth.uid())) WITH CHECK (is_teacher_or_staff(auth.uid()));
CREATE TRIGGER exams_touch BEFORE UPDATE ON public.exams FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.lesson_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject text,
  class_name text,
  week text,
  objectives text,
  status text DEFAULT 'Draft',
  teacher_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_plans TO authenticated;
GRANT ALL ON public.lesson_plans TO service_role;
ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers view lesson plans" ON public.lesson_plans FOR SELECT TO authenticated USING (is_teacher_or_staff(auth.uid()));
CREATE POLICY "Teachers manage lesson plans" ON public.lesson_plans FOR ALL TO authenticated
  USING (is_teacher_or_staff(auth.uid())) WITH CHECK (is_teacher_or_staff(auth.uid()));
CREATE TRIGGER lp_touch BEFORE UPDATE ON public.lesson_plans FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text,
  size text,
  file_url text,
  visibility text DEFAULT 'staff',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resources TO authenticated;
GRANT ALL ON public.resources TO service_role;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view resources" ON public.resources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff manage resources" ON public.resources FOR ALL TO authenticated
  USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE TRIGGER res_touch BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.library_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text,
  isbn text,
  copies_total int DEFAULT 1,
  copies_available int DEFAULT 1,
  category text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_books TO authenticated;
GRANT ALL ON public.library_books TO service_role;
ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view library" ON public.library_books FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff manage library" ON public.library_books FOR ALL TO authenticated
  USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE TRIGGER lib_touch BEFORE UPDATE ON public.library_books FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------
-- PEOPLE & ADMISSIONS
-- ---------------------------------------------------------

CREATE TABLE public.staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  role text,
  department text,
  phone text,
  email text,
  salary_usd numeric,
  salary_lrd numeric,
  status text DEFAULT 'Active',
  hire_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff TO authenticated;
GRANT ALL ON public.staff TO service_role;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff view staff" ON public.staff FOR SELECT TO authenticated USING (is_staff(auth.uid()));
CREATE POLICY "Staff manage staff" ON public.staff FOR ALL TO authenticated
  USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE TRIGGER staff_touch BEFORE UPDATE ON public.staff FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.admissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_name text NOT NULL,
  grade text,
  guardian_name text,
  guardian_phone text,
  guardian_email text,
  address text,
  date_of_birth date,
  submitted_at date DEFAULT CURRENT_DATE,
  status text DEFAULT 'Pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admissions TO authenticated;
GRANT INSERT ON public.admissions TO anon;
GRANT ALL ON public.admissions TO service_role;
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can apply" ON public.admissions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Staff view admissions" ON public.admissions FOR SELECT TO authenticated USING (is_staff(auth.uid()));
CREATE POLICY "Staff update admissions" ON public.admissions FOR UPDATE TO authenticated USING (is_staff(auth.uid()));
CREATE POLICY "Staff delete admissions" ON public.admissions FOR DELETE TO authenticated USING (is_staff(auth.uid()));
CREATE TRIGGER adm_touch BEFORE UPDATE ON public.admissions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.behavior_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  class_name text,
  record_type text, -- Commendation / Warning / Incident
  description text,
  reporter text,
  incident_date date DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.behavior_records TO authenticated;
GRANT ALL ON public.behavior_records TO service_role;
ALTER TABLE public.behavior_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students see own behavior" ON public.behavior_records FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Parents see child behavior" ON public.behavior_records FOR SELECT TO authenticated USING (is_parent_of(auth.uid(), student_id));
CREATE POLICY "Teachers manage behavior" ON public.behavior_records FOR ALL TO authenticated
  USING (is_teacher_or_staff(auth.uid())) WITH CHECK (is_teacher_or_staff(auth.uid()));
CREATE TRIGGER beh_touch BEFORE UPDATE ON public.behavior_records FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.clinic_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  visit_date date DEFAULT CURRENT_DATE,
  reason text,
  action_taken text,
  nurse text,
  status text DEFAULT 'Treated',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinic_visits TO authenticated;
GRANT ALL ON public.clinic_visits TO service_role;
ALTER TABLE public.clinic_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parents see child clinic" ON public.clinic_visits FOR SELECT TO authenticated USING (is_parent_of(auth.uid(), student_id));
CREATE POLICY "Staff manage clinic" ON public.clinic_visits FOR ALL TO authenticated
  USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE TRIGGER cl_touch BEFORE UPDATE ON public.clinic_visits FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------
-- FINANCE
-- ---------------------------------------------------------

CREATE TABLE public.fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  item text NOT NULL,
  amount_usd numeric NOT NULL DEFAULT 0,
  amount_lrd numeric NOT NULL DEFAULT 0,
  due_date date,
  paid_date date,
  status text DEFAULT 'Outstanding',
  method text,
  reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fees TO authenticated;
GRANT ALL ON public.fees TO service_role;
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students see own fees" ON public.fees FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Parents see child fees" ON public.fees FOR SELECT TO authenticated USING (is_parent_of(auth.uid(), student_id));
CREATE POLICY "Staff manage fees" ON public.fees FOR ALL TO authenticated
  USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE TRIGGER fees_touch BEFORE UPDATE ON public.fees FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_name text NOT NULL,
  donor_email text,
  amount_usd numeric NOT NULL DEFAULT 0,
  amount_lrd numeric NOT NULL DEFAULT 0,
  fund text,
  method text,
  reference text,
  donation_date date DEFAULT CURRENT_DATE,
  anonymous boolean DEFAULT false,
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.donations TO authenticated;
GRANT INSERT ON public.donations TO anon;
GRANT ALL ON public.donations TO service_role;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone donate" ON public.donations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Staff view donations" ON public.donations FOR SELECT TO authenticated USING (is_staff(auth.uid()));
CREATE POLICY "Staff update donations" ON public.donations FOR UPDATE TO authenticated USING (is_staff(auth.uid()));
CREATE POLICY "Staff delete donations" ON public.donations FOR DELETE TO authenticated USING (is_staff(auth.uid()));
CREATE TRIGGER don_touch BEFORE UPDATE ON public.donations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.scholarships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  sponsor text,
  amount_usd numeric DEFAULT 0,
  amount_lrd numeric DEFAULT 0,
  term text,
  status text DEFAULT 'Active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scholarships TO authenticated;
GRANT ALL ON public.scholarships TO service_role;
ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students see own scholarship" ON public.scholarships FOR SELECT TO authenticated USING (auth.uid() = student_id);
CREATE POLICY "Parents see child scholarship" ON public.scholarships FOR SELECT TO authenticated USING (is_parent_of(auth.uid(), student_id));
CREATE POLICY "Staff manage scholarships" ON public.scholarships FOR ALL TO authenticated
  USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE TRIGGER sch_touch BEFORE UPDATE ON public.scholarships FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.transport_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route text NOT NULL,
  driver text,
  vehicle text,
  departure text,
  riders int DEFAULT 0,
  fee_usd numeric DEFAULT 0,
  fee_lrd numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transport_routes TO authenticated;
GRANT ALL ON public.transport_routes TO service_role;
ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view transport" ON public.transport_routes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff manage transport" ON public.transport_routes FOR ALL TO authenticated
  USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE TRIGGER tr_touch BEFORE UPDATE ON public.transport_routes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item text NOT NULL,
  category text,
  quantity int DEFAULT 0,
  location text,
  condition text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory TO authenticated;
GRANT ALL ON public.inventory TO service_role;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff view inventory" ON public.inventory FOR SELECT TO authenticated USING (is_staff(auth.uid()));
CREATE POLICY "Staff manage inventory" ON public.inventory FOR ALL TO authenticated
  USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE TRIGGER inv_touch BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  lead text,
  staff_count int DEFAULT 0,
  description text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.departments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view depts" ON public.departments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff manage depts" ON public.departments FOR ALL TO authenticated
  USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE TRIGGER dep_touch BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------
-- COMMUNICATION
-- ---------------------------------------------------------

CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text,
  audience text DEFAULT 'All', -- All / Students / Parents / Staff / Teachers / Alumni
  publish_date date DEFAULT CURRENT_DATE,
  published boolean DEFAULT true,
  author uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view announcements" ON public.announcements FOR SELECT TO authenticated USING (published = true);
CREATE POLICY "Staff manage announcements" ON public.announcements FOR ALL TO authenticated
  USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE TRIGGER ann_touch BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name text,
  recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_name text,
  subject text,
  body text,
  unread boolean DEFAULT true,
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "See own messages" ON public.messages FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = recipient_id OR is_staff(auth.uid()));
CREATE POLICY "Send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Update own messages" ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Delete own messages" ON public.messages FOR DELETE TO authenticated USING (auth.uid() = sender_id OR is_staff(auth.uid()));
CREATE TRIGGER msg_touch BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  event_type text, -- Exam / Holiday / PTA / Sports / Other
  start_date date NOT NULL,
  end_date date,
  audience text DEFAULT 'All',
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_events TO authenticated;
GRANT ALL ON public.calendar_events TO service_role;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view calendar" ON public.calendar_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff manage calendar" ON public.calendar_events FOR ALL TO authenticated
  USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE TRIGGER cal_touch BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  event_date date,
  location text,
  description text,
  image_url text,
  public_event boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view events" ON public.events FOR SELECT TO anon, authenticated USING (public_event = true);
CREATE POLICY "Staff manage events" ON public.events FOR ALL TO authenticated
  USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE TRIGGER ev_touch BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------
-- COMMUNITY
-- ---------------------------------------------------------

CREATE TABLE public.alumni_directory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  graduation_year int,
  role text,
  employer text,
  city text,
  country text,
  linkedin text,
  bio text,
  visible boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alumni_directory TO authenticated;
GRANT ALL ON public.alumni_directory TO service_role;
ALTER TABLE public.alumni_directory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view alumni" ON public.alumni_directory FOR SELECT TO authenticated USING (visible = true OR auth.uid() = profile_id OR is_staff(auth.uid()));
CREATE POLICY "Alumni edit own" ON public.alumni_directory FOR UPDATE TO authenticated USING (auth.uid() = profile_id OR is_staff(auth.uid()));
CREATE POLICY "Alumni insert own" ON public.alumni_directory FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id OR is_staff(auth.uid()));
CREATE POLICY "Staff delete alumni" ON public.alumni_directory FOR DELETE TO authenticated USING (is_staff(auth.uid()));
CREATE TRIGGER alum_touch BEFORE UPDATE ON public.alumni_directory FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company text,
  location text,
  description text,
  apply_url text,
  posted_date date DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.jobs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view jobs" ON public.jobs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff manage jobs" ON public.jobs FOR ALL TO authenticated
  USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE TRIGGER jobs_touch BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------
-- CMS
-- ---------------------------------------------------------

CREATE TABLE public.cms_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text DEFAULT 'Draft',
  seo_title text,
  seo_description text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cms_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_pages TO authenticated;
GRANT ALL ON public.cms_pages TO service_role;
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view published pages" ON public.cms_pages FOR SELECT TO anon, authenticated USING (status = 'Published' OR is_staff(auth.uid()));
CREATE POLICY "Staff manage pages" ON public.cms_pages FOR ALL TO authenticated
  USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE TRIGGER pg_touch BEFORE UPDATE ON public.cms_pages FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.cms_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  excerpt text,
  content text,
  author text,
  cover_image text,
  status text DEFAULT 'Draft',
  publish_date date,
  tags text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cms_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_posts TO authenticated;
GRANT ALL ON public.cms_posts TO service_role;
ALTER TABLE public.cms_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view published posts" ON public.cms_posts FOR SELECT TO anon, authenticated USING (status = 'Published' OR is_staff(auth.uid()));
CREATE POLICY "Staff manage posts" ON public.cms_posts FOR ALL TO authenticated
  USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE TRIGGER po_touch BEFORE UPDATE ON public.cms_posts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.cms_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  file_url text,
  mime_type text,
  size text,
  folder text,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cms_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_media TO authenticated;
GRANT ALL ON public.cms_media TO service_role;
ALTER TABLE public.cms_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view media" ON public.cms_media FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff manage media" ON public.cms_media FOR ALL TO authenticated
  USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE TRIGGER md_touch BEFORE UPDATE ON public.cms_media FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  heading text,
  caption text,
  cta_text text,
  cta_link text,
  sort_order int DEFAULT 0,
  enabled boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hero_slides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hero_slides TO authenticated;
GRANT ALL ON public.hero_slides TO service_role;
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view hero" ON public.hero_slides FOR SELECT TO anon, authenticated USING (enabled = true OR is_staff(auth.uid()));
CREATE POLICY "Staff manage hero" ON public.hero_slides FOR ALL TO authenticated
  USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE TRIGGER hero_touch BEFORE UPDATE ON public.hero_slides FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text,
  photo_url text,
  bio text,
  email text,
  linkedin text,
  sort_order int DEFAULT 0,
  enabled boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.team_members TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view team" ON public.team_members FOR SELECT TO anon, authenticated USING (enabled = true OR is_staff(auth.uid()));
CREATE POLICY "Staff manage team" ON public.team_members FOR ALL TO authenticated
  USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE TRIGGER team_touch BEFORE UPDATE ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb,
  category text,
  description text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Staff manage settings" ON public.site_settings FOR ALL TO authenticated
  USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
CREATE TRIGGER ss_touch BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ---------------------------------------------------------
-- SYSTEM
-- ---------------------------------------------------------

CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  action text NOT NULL,
  entity text,
  entity_id text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff view audit" ON public.audit_log FOR SELECT TO authenticated USING (is_staff(auth.uid()));
CREATE POLICY "Auth insert audit" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = actor_id);
