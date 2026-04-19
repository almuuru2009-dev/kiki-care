-- Migration to add missing columns to exercises table
ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS simple_name TEXT,
  ADD COLUMN IF NOT EXISTS objective TEXT,
  ADD COLUMN IF NOT EXISTS gmfcs TEXT,
  ADD COLUMN IF NOT EXISTS age_range TEXT,
  ADD COLUMN IF NOT EXISTS indications TEXT,
  ADD COLUMN IF NOT EXISTS contraindications TEXT,
  ADD COLUMN IF NOT EXISTS evidence_level TEXT,
  ADD COLUMN IF NOT EXISTS difficulty TEXT,
  ADD COLUMN IF NOT EXISTS instructions TEXT,
  ADD COLUMN IF NOT EXISTS signs_going_well TEXT,
  ADD COLUMN IF NOT EXISTS when_to_stop TEXT;
