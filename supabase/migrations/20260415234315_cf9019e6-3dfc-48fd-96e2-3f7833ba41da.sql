
-- Appointments table for kine agenda
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  therapist_id UUID NOT NULL,
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Therapist can manage own appointments
CREATE POLICY "Therapists can manage own appointments"
ON public.appointments FOR ALL
TO authenticated
USING (therapist_id = auth.uid())
WITH CHECK (therapist_id = auth.uid());

-- Caregivers can view appointments for their children
CREATE POLICY "Caregivers can view child appointments"
ON public.appointments FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.children
  WHERE children.id = appointments.child_id
  AND children.caregiver_id = auth.uid()
));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
