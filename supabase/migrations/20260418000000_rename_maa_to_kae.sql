-- Renombre no destructivo de columnas MAA a KAE si existen en las tablas más probables (patients, alerts)
DO $$
BEGIN
    -- Revisar y renombrar en tabla 'patients' si existe
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='maa_score') THEN
        ALTER TABLE patients RENAME COLUMN maa_score TO kae_score;
    END IF;
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='patients' AND column_name='maa_level') THEN
        ALTER TABLE patients RENAME COLUMN maa_level TO kae_level;
    END IF;

    -- Revisar y renombrar en tabla 'alerts' si existe
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='alerts' AND column_name='maa_score') THEN
        ALTER TABLE alerts RENAME COLUMN maa_score TO kae_score;
    END IF;
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='alerts' AND column_name='maa_level') THEN
        ALTER TABLE alerts RENAME COLUMN maa_level TO kae_level;
    END IF;

    -- Revisar y renombrar en tabla 'therapist_caregiver_links' si existe
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='therapist_caregiver_links' AND column_name='maa_score') THEN
        ALTER TABLE therapist_caregiver_links RENAME COLUMN maa_score TO kae_score;
    END IF;
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='therapist_caregiver_links' AND column_name='maa_level') THEN
        ALTER TABLE therapist_caregiver_links RENAME COLUMN maa_level TO kae_level;
    END IF;
END $$;
