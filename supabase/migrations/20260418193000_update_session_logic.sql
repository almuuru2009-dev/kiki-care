
-- Add updated_at to treatment_plans
ALTER TABLE public.treatment_plans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_treatment_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_treatment_plans_timestamp
BEFORE UPDATE ON public.treatment_plans
FOR EACH ROW
EXECUTE FUNCTION update_treatment_plans_updated_at();

-- Add is_update to sessions
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS is_update BOOLEAN DEFAULT false;
