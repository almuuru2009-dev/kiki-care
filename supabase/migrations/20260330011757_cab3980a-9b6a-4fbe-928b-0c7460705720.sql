
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('kinesiologist', 'caregiver')),
  name TEXT NOT NULL DEFAULT '',
  email TEXT,
  specialty TEXT,
  institution TEXT,
  matricula TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Therapists can view profiles of linked caregivers
CREATE POLICY "Therapists can view linked caregiver profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

-- Children table (no cross-table RLS yet)
CREATE TABLE public.children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caregiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER,
  date_of_birth DATE,
  diagnosis TEXT,
  gmfcs INTEGER CHECK (gmfcs BETWEEN 1 AND 5),
  avatar_color TEXT DEFAULT '#7EEDC4',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Caregivers can manage own children" ON public.children
  FOR ALL TO authenticated USING (caregiver_id = auth.uid());

-- Therapist-Caregiver invitation/linking table
CREATE TABLE public.therapist_caregiver_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caregiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  caregiver_email TEXT NOT NULL,
  child_id UUID REFERENCES public.children(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'archived')),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.therapist_caregiver_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Therapists can view own links" ON public.therapist_caregiver_links
  FOR SELECT TO authenticated USING (therapist_id = auth.uid() OR caregiver_id = auth.uid());

CREATE POLICY "Therapists can create invitations" ON public.therapist_caregiver_links
  FOR INSERT TO authenticated WITH CHECK (therapist_id = auth.uid());

CREATE POLICY "Participants can update links" ON public.therapist_caregiver_links
  FOR UPDATE TO authenticated USING (therapist_id = auth.uid() OR caregiver_id = auth.uid());

-- NOW add cross-table RLS on children
CREATE POLICY "Linked therapists can view children" ON public.children
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.therapist_caregiver_links
      WHERE therapist_id = auth.uid()
        AND caregiver_id = public.children.caregiver_id
        AND status = 'active'
    )
  );

-- Feedback table
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'comment' CHECK (type IN ('comment', 'suggestion', 'bug')),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback" ON public.feedback
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own feedback" ON public.feedback
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'caregiver'),
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
