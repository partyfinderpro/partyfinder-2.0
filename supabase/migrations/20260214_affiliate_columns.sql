
-- 20260214_affiliate_columns.sql

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_resources' AND column_name = 'affiliate_program') THEN
        ALTER TABLE project_resources ADD COLUMN affiliate_program TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_resources' AND column_name = 'commission_rate') THEN
        ALTER TABLE project_resources ADD COLUMN commission_rate DECIMAL; -- stored as percentage e.g. 50.0 or 0.5 depending on convention, usually user says '50%' so we store 50
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_resources' AND column_name = 'payout_type') THEN
        ALTER TABLE project_resources ADD COLUMN payout_type TEXT; -- 'CPA', 'RevShare', etc.
    END IF;
END $$;
