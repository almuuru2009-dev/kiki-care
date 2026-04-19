-- Add comprehensive fields to exercises table
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS simple_name text;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS gmfcs text;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS age_range text;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS clinical_objective text;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS indications text;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS contraindications text;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS evidence text;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS instructions text;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS difficulty text;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS good_signs text;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS stop_signs text;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS caregiver_precautions text;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS variants text;

-- Add comprehensive fields to community_exercises table (syncing with exercises)
ALTER TABLE public.community_exercises ADD COLUMN IF NOT EXISTS clinical_objective text;
ALTER TABLE public.community_exercises ADD COLUMN IF NOT EXISTS indications text;
ALTER TABLE public.community_exercises ADD COLUMN IF NOT EXISTS contraindications text;
ALTER TABLE public.community_exercises ADD COLUMN IF NOT EXISTS difficulty text;
ALTER TABLE public.community_exercises ADD COLUMN IF NOT EXISTS good_signs text;
ALTER TABLE public.community_exercises ADD COLUMN IF NOT EXISTS stop_signs text;
ALTER TABLE public.community_exercises ADD COLUMN IF NOT EXISTS caregiver_precautions text;
ALTER TABLE public.community_exercises ADD COLUMN IF NOT EXISTS variants text;

-- Update existing column in exercises for better consistency
ALTER TABLE public.exercises RENAME COLUMN category TO clinical_objective_old; -- Optional, keeping it for now
ALTER TABLE public.exercises RENAME COLUMN target_area TO area_old; -- Optional
