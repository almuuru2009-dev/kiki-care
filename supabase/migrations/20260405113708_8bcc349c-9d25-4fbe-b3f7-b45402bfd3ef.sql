
-- Add indexes for performance on existing tables
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_child ON public.sessions(child_id);
CREATE INDEX IF NOT EXISTS idx_sessions_caregiver ON public.sessions(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_sessions_completed ON public.sessions(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_child ON public.treatment_plans(child_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_therapist ON public.treatment_plans(therapist_id);
CREATE INDEX IF NOT EXISTS idx_therapist_caregiver_links_therapist ON public.therapist_caregiver_links(therapist_id);
CREATE INDEX IF NOT EXISTS idx_therapist_caregiver_links_caregiver ON public.therapist_caregiver_links(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_therapist_caregiver_links_email ON public.therapist_caregiver_links(caregiver_email);
CREATE INDEX IF NOT EXISTS idx_children_caregiver ON public.children(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_exercises_created_by ON public.exercises(created_by);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);

-- User settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  daily_reminder BOOLEAN NOT NULL DEFAULT true,
  therapist_messages BOOLEAN NOT NULL DEFAULT true,
  weekly_reports BOOLEAN NOT NULL DEFAULT false,
  sound_effects BOOLEAN NOT NULL DEFAULT true,
  language TEXT NOT NULL DEFAULT 'es',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings"
  ON public.user_settings FOR ALL TO authenticated
  USING (user_id = auth.uid());
