
-- Protocols table
CREATE TABLE public.protocols (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT,
  is_community BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can manage own protocols" ON public.protocols FOR ALL
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

CREATE POLICY "Community protocols are viewable" ON public.protocols FOR SELECT
  USING (is_community = true);

-- Protocol exercises junction table
CREATE TABLE public.protocol_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  protocol_id UUID NOT NULL REFERENCES public.protocols(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.protocol_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage protocol exercises via protocol ownership" ON public.protocol_exercises FOR ALL
  USING (EXISTS (SELECT 1 FROM public.protocols WHERE protocols.id = protocol_exercises.protocol_id AND protocols.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.protocols WHERE protocols.id = protocol_exercises.protocol_id AND protocols.created_by = auth.uid()));

CREATE POLICY "Community protocol exercises are viewable" ON public.protocol_exercises FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.protocols WHERE protocols.id = protocol_exercises.protocol_id AND protocols.is_community = true));

-- Enable realtime on messages for instant messaging
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
