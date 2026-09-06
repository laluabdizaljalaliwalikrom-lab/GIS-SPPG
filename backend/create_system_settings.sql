-- Create system_settings table (internal system configuration, admin-only)
-- Used to store secrets like GEMINI_API_KEY that are configurable via the Settings UI.
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    is_secret BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS (do NOT allow public read like landing_config)
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Admin-only read
DROP POLICY IF EXISTS "Admin can read system_settings" ON system_settings;
CREATE POLICY "Admin can read system_settings" ON system_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Admin-only write
DROP POLICY IF EXISTS "Admin can write system_settings" ON system_settings;
CREATE POLICY "Admin can write system_settings" ON system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Seed the Gemini API key setting (empty initially, configured via Settings UI)
INSERT INTO system_settings (key, value, is_secret)
VALUES ('gemini_api_key', NULL, TRUE)
ON CONFLICT (key) DO NOTHING;