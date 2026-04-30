-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create sppg_units table
CREATE TABLE IF NOT EXISTS sppg_units (
    id SERIAL PRIMARY KEY,
    kode_sppg VARCHAR UNIQUE,
    nama VARCHAR,
    alamat_desa VARCHAR,
    geom GEOGRAPHY(POINT, 4326),
    status_operasional VARCHAR,
    tanggal_operasional DATE,
    nama_kepala VARCHAR,
    pengawas_keuangan VARCHAR,
    pengawas_gizi VARCHAR,
    pic_yayasan VARCHAR,
    nama_yayasan VARCHAR,
    kapasitas_produksi INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create kelompok_penerima table
CREATE TABLE IF NOT EXISTS kelompok_penerima (
    id SERIAL PRIMARY KEY,
    jenis_kelompok VARCHAR,
    kode_kelompok VARCHAR UNIQUE,
    nama VARCHAR,
    jenis_kepemilikan VARCHAR,
    alamat_lengkap VARCHAR,
    geom GEOGRAPHY(POINT, 4326),
    pj_nama VARCHAR,
    no_whatsapp VARCHAR,
    email VARCHAR,
    assigned_sppg_id INTEGER REFERENCES sppg_units(id) ON DELETE SET NULL,
    status VARCHAR DEFAULT 'pending_verification', -- pending_verification, verified, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create kelompok_detail table
CREATE TABLE IF NOT EXISTS kelompok_detail (
    id SERIAL PRIMARY KEY,
    kelompok_id INTEGER UNIQUE REFERENCES kelompok_penerima(id) ON DELETE CASCADE,
    porsi_kecil INTEGER,
    porsi_besar INTEGER,
    jumlah_guru INTEGER,
    jumlah_tendik INTEGER,
    jumlah_busui INTEGER,
    jumlah_bumil INTEGER,
    jumlah_balita_non_paud INTEGER,
    jumlah_kader INTEGER
);

-- --- AUTH & ROLES ---

-- Profiles table to store user roles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    role VARCHAR DEFAULT 'kecamatan_coordinator', -- admin, sppg_head, kecamatan_coordinator
    sppg_id INTEGER REFERENCES sppg_units(id) ON DELETE SET NULL, -- for sppg_head role
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'kecamatan_coordinator');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- --- AUDIT TRAIL ---

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users,
    action TEXT NOT NULL, -- e.g., 'CREATE', 'UPDATE', 'DELETE', 'ALLOCATE'
    target_table TEXT NOT NULL,
    target_id INTEGER,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to log administrative actions
CREATE OR REPLACE FUNCTION log_action(
    p_user_id UUID,
    p_action TEXT,
    p_table TEXT,
    p_id INTEGER,
    p_details TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO audit_logs (user_id, action, target_table, target_id, details)
    VALUES (p_user_id, p_action, p_table, p_id, p_details);
END;
$$ LANGUAGE plpgsql;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sppg_units_kode_sppg ON sppg_units(kode_sppg);
CREATE INDEX IF NOT EXISTS idx_kelompok_penerima_kode_kelompok ON kelompok_penerima(kode_kelompok);
CREATE INDEX IF NOT EXISTS idx_kelompok_penerima_status ON kelompok_penerima(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
