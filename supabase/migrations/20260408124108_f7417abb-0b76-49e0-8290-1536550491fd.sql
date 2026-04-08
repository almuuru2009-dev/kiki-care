
-- Add DELETE policy on profiles for account deletion
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- Add community exercises INSERT policy for sharing
CREATE POLICY "Authenticated users can share to community" ON public.community_exercises FOR INSERT TO authenticated WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_receiver_read ON public.messages(receiver_id, read);
CREATE INDEX IF NOT EXISTS idx_sessions_caregiver ON public.sessions(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_child ON public.treatment_plans(child_id);
CREATE INDEX IF NOT EXISTS idx_therapist_links_therapist ON public.therapist_caregiver_links(therapist_id, status);
CREATE INDEX IF NOT EXISTS idx_therapist_links_email ON public.therapist_caregiver_links(caregiver_email, status);

-- Add DELETE policy on therapist_caregiver_links for account cleanup
CREATE POLICY "Users can delete own links" ON public.therapist_caregiver_links FOR DELETE TO authenticated USING (therapist_id = auth.uid() OR caregiver_id = auth.uid());

-- Add DELETE policy on children for account cleanup
CREATE POLICY "Caregivers can delete own children" ON public.children FOR DELETE TO authenticated USING (caregiver_id = auth.uid());

-- Add DELETE policy on sessions
CREATE POLICY "Caregivers can delete own sessions" ON public.sessions FOR DELETE TO authenticated USING (caregiver_id = auth.uid());

-- Add DELETE policy on notifications
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Add DELETE policies on medals, user_points, user_settings, saved_exercises, feedback for cleanup
CREATE POLICY "Users can delete own medals" ON public.medals FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own points" ON public.user_points FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own settings" ON public.user_settings FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own saved_exercises" ON public.saved_exercises FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own feedback" ON public.feedback FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Add DELETE policy on exercises
CREATE POLICY "Creators can delete exercises" ON public.exercises FOR DELETE TO authenticated USING (created_by = auth.uid());
