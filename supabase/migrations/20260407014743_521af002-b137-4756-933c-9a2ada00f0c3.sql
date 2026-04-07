
-- Add favorites table for saved exercises
CREATE TABLE IF NOT EXISTS public.saved_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, exercise_id)
);

ALTER TABLE public.saved_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved exercises" ON public.saved_exercises
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Add community_exercises table with pre-loaded data
CREATE TABLE IF NOT EXISTS public.community_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinical_name text NOT NULL,
  simple_name text,
  gmfcs text,
  category text,
  area text,
  age_range text,
  evidence text DEFAULT 'Práctica común',
  adherence integer DEFAULT 50,
  icon text DEFAULT '🏋️',
  validated boolean DEFAULT false,
  rating numeric(2,1) DEFAULT 3.5,
  reviews integer DEFAULT 0,
  author_name text NOT NULL,
  author_city text,
  description text,
  instructions text,
  sets integer DEFAULT 3,
  reps text DEFAULT '10 repeticiones',
  duration integer DEFAULT 5,
  video_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view community exercises" ON public.community_exercises
  FOR SELECT TO authenticated USING (true);

-- Add points/rewards system tables
CREATE TABLE IF NOT EXISTS public.user_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  points integer NOT NULL DEFAULT 0,
  year integer NOT NULL,
  month integer NOT NULL,
  sessions_completed integer NOT NULL DEFAULT 0,
  sessions_required integer NOT NULL DEFAULT 10,
  star_earned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, year, month)
);

ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own points" ON public.user_points
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.medals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  medal_type text NOT NULL,
  title text NOT NULL,
  description text,
  points_awarded integer NOT NULL DEFAULT 0,
  earned_at timestamptz NOT NULL DEFAULT now(),
  year integer NOT NULL
);

ALTER TABLE public.medals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own medals" ON public.medals
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Add onboarding_completed to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Add DELETE policy for messages (for patient deletion cascade)
CREATE POLICY "Participants can delete own messages" ON public.messages
  FOR DELETE TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Add video_url to exercises table
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS video_url text;

-- Create storage bucket for exercise videos
INSERT INTO storage.buckets (id, name, public, file_size_limit) 
VALUES ('exercise-videos', 'exercise-videos', true, 209715200)
ON CONFLICT (id) DO NOTHING;

-- RLS for exercise videos bucket
CREATE POLICY "Authenticated users can upload videos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'exercise-videos');

CREATE POLICY "Anyone can view exercise videos" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'exercise-videos');

CREATE POLICY "Users can delete own uploads" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'exercise-videos' AND (storage.foldername(name))[1] = auth.uid()::text);
