-- Create landing_config table
CREATE TABLE IF NOT EXISTS landing_config (
    id SERIAL PRIMARY KEY,
    section_name TEXT NOT NULL,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE landing_config ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON landing_config
    FOR SELECT USING (true);

-- Allow admins to update/insert
CREATE POLICY "Allow admin full access" ON landing_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Insert initial data
INSERT INTO landing_config (section_name, key, value) VALUES
('Hero', 'hero_title', 'Sistem Informasi Pemetaan SPPG Digital'),
('Hero', 'hero_subtitle', 'Meningkatkan transparansi dan efisiensi distribusi unit gizi SPPG melalui teknologi geospasial.'),
('About', 'about_title', 'Misi Kami'),
('About', 'about_description', 'Menyediakan data pemetaan yang akurat untuk memastikan setiap kelompok penerima mendapatkan pelayanan gizi yang optimal.'),
('Contact', 'footer_text', '© 2024 GIS-SPPG. All rights reserved.');
