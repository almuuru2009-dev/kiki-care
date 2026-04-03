
-- Messages table for conversations between therapists and caregivers
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  link_id UUID REFERENCES public.therapist_caregiver_links(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON public.messages FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Receivers can mark as read"
  ON public.messages FOR UPDATE TO authenticated
  USING (receiver_id = auth.uid());

-- Sessions table for tracking completed exercise sessions
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  caregiver_id UUID NOT NULL,
  difficulty INTEGER,
  child_mood INTEGER,
  pain_reported BOOLEAN DEFAULT false,
  note TEXT,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Caregivers can manage own sessions"
  ON public.sessions FOR ALL TO authenticated
  USING (caregiver_id = auth.uid());

CREATE POLICY "Linked therapists can view sessions"
  ON public.sessions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM therapist_caregiver_links
    WHERE therapist_id = auth.uid()
      AND caregiver_id = sessions.caregiver_id
      AND status = 'active'
  ));

-- Exercises table for therapist-created exercises
CREATE TABLE public.exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  target_area TEXT,
  duration INTEGER DEFAULT 5,
  sets INTEGER DEFAULT 3,
  reps TEXT DEFAULT '10 repeticiones',
  thumbnail_color TEXT DEFAULT '#7EEDC4',
  is_community BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can manage own exercises"
  ON public.exercises FOR ALL TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Community exercises are viewable"
  ON public.exercises FOR SELECT TO authenticated
  USING (is_community = true);

-- Treatment plans linking exercises to children
CREATE TABLE public.treatment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  therapist_id UUID NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER[],
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Therapists can manage plans"
  ON public.treatment_plans FOR ALL TO authenticated
  USING (therapist_id = auth.uid());

CREATE POLICY "Caregivers can view their children plans"
  ON public.treatment_plans FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM children
    WHERE children.id = treatment_plans.child_id
      AND children.caregiver_id = auth.uid()
  ));

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
