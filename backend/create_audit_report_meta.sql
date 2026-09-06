-- Add metadata columns for the official LHA-style audit report (BPKP/APIP format).
ALTER TABLE audit_reports
    ADD COLUMN IF NOT EXISTS report_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS report_url TEXT,
    ADD COLUMN IF NOT EXISTS report_status VARCHAR(20) DEFAULT 'none',  -- none | draft | final | void
    ADD COLUMN IF NOT EXISTS report_date DATE,
    ADD COLUMN IF NOT EXISTS approved_by_user_id UUID,
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS summary TEXT;

-- Optional FK back to profiles for the approver.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'audit_reports_approved_by_user_id_fkey'
    ) THEN
        ALTER TABLE audit_reports
            ADD CONSTRAINT audit_reports_approved_by_user_id_fkey
            FOREIGN KEY (approved_by_user_id) REFERENCES profiles(id);
    END IF;
END $$;

-- Apply to existing rows: mark them as never having an official report sensible default.
UPDATE audit_reports SET report_status = 'none' WHERE report_status IS NULL OR report_status = '';