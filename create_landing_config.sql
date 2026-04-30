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
DROP POLICY IF EXISTS "Allow public read access" ON landing_config;
CREATE POLICY "Allow public read access" ON landing_config
    FOR SELECT USING (true);

-- Allow admins to update/insert
DROP POLICY IF EXISTS "Allow admin full access" ON landing_config;
CREATE POLICY "Allow admin full access" ON landing_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Insert official BGN data
TRUNCATE landing_config;
INSERT INTO landing_config (section_name, key, value) VALUES
('Hero', 'hero_title', 'Misi Badan Gizi Nasional (BGN) untuk Menuju Indonesia Emas'),
('Hero', 'hero_subtitle', 'Program komprehensif yang dirancang untuk memastikan setiap individu mendapatkan asupan gizi optimal, mendukung tercapainya Indonesia Emas melalui generasi yang sehat dan berkualitas.'),
('Vision', 'vision_text', 'Membangun Bangsa yang Lebih Sehat'),
('Mission', 'mission_1', 'Meningkatkan kesadaran perilaku makan makanan sehat dan pola hidup sehat melalui edukasi serta pemberdayaan masyarakat.'),
('Mission', 'mission_2', 'Membangun sistem ketahanan gizi nasional yang tangguh dan responsif terhadap perubahan sosial, ekonomi, dan lingkungan.'),
('Mission', 'mission_3', 'Mewujudkan tata kelola gizi yang adil dan transparan dengan melibatkan partisipasi aktif seluruh pemangku kepentingan.'),
('Program', 'mbg_title', 'Makan Bergizi Gratis (MBG)'),
('Program', 'mbg_desc', 'Program unggulan untuk memastikan asupan nutrisi optimal bagi seluruh rakyat Indonesia.'),
('Sasaran', 'sasaran_students', 'Siswa Sekolah (PAUD - SMA)'),
('Sasaran', 'sasaran_children', 'Anak-anak & Balita'),
('Sasaran', 'sasaran_mothers', 'Ibu Hamil & Menyusui'),
('Contact', 'footer_text', '© 2024 Badan Gizi Nasional. Jl. Kebon Sirih No.1, Jakarta Pusat.'),
('Contact', 'email', 'halo@bgn.go.id'),
('Contact', 'whatsapp', '0811-1000-8008');
