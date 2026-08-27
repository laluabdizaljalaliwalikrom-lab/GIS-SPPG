-- Create survey_sessions table to store metadata, documentation photos, and official signed documents
CREATE TABLE IF NOT EXISTS survey_sessions (
    id SERIAL PRIMARY KEY,
    survey_session_id VARCHAR UNIQUE NOT NULL,
    shop_name VARCHAR NOT NULL,
    region_id VARCHAR DEFAULT 'Sikur',
    survey_date DATE NOT NULL,
    surveyor_name VARCHAR,
    head_of_market_name VARCHAR,
    documentation_photos JSONB DEFAULT '[]'::jsonb,
    official_doc_url VARCHAR,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_survey_sessions_session_id ON survey_sessions(survey_session_id);
CREATE INDEX IF NOT EXISTS idx_survey_sessions_date ON survey_sessions(survey_date);

-- Add optional columns directly to market_prices if not already present
ALTER TABLE market_prices ADD COLUMN IF NOT EXISTS official_doc_url VARCHAR;
