-- Create commodity_items table (master data komoditas yang dilacak)
CREATE TABLE IF NOT EXISTS commodity_items (
    id SERIAL PRIMARY KEY,
    nama VARCHAR UNIQUE NOT NULL,
    kategori VARCHAR,
    satuan_default VARCHAR NOT NULL,
    deskripsi TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modify market_prices: drop UNIQUE constraint on item_name (already removed in model)
-- Add new columns for survey tracking
ALTER TABLE market_prices ADD COLUMN IF NOT EXISTS supplier_name VARCHAR;
ALTER TABLE market_prices ADD COLUMN IF NOT EXISTS survey_session_id VARCHAR;
ALTER TABLE market_prices ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE market_prices ADD COLUMN IF NOT EXISTS commodity_item_id INTEGER REFERENCES commodity_items(id);

CREATE INDEX IF NOT EXISTS idx_market_prices_survey_session ON market_prices(survey_session_id);
CREATE INDEX IF NOT EXISTS idx_market_prices_price_date ON market_prices(price_date);
CREATE INDEX IF NOT EXISTS idx_commodity_items_kategori ON commodity_items(kategori);

-- Create audit_reports table
CREATE TABLE IF NOT EXISTS audit_reports (
    id SERIAL PRIMARY KEY,
    doc_url VARCHAR,
    total_items INTEGER DEFAULT 0,
    total_potential_loss NUMERIC(15, 2) DEFAULT 0.0,
    status VARCHAR DEFAULT 'NORMAL' CHECK (status IN ('NORMAL', 'WARNING', 'DANGER')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit_items table
CREATE TABLE IF NOT EXISTS audit_items (
    id SERIAL PRIMARY KEY,
    audit_report_id INTEGER REFERENCES audit_reports(id) ON DELETE CASCADE,
    item_name VARCHAR NOT NULL,
    qty NUMERIC(12, 4) DEFAULT 1.0,
    price_per_unit NUMERIC(15, 2) NOT NULL,
    market_price NUMERIC(15, 2) NOT NULL,
    potential_loss NUMERIC(15, 2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed initial commodity items
INSERT INTO commodity_items (nama, kategori, satuan_default) VALUES
('Beras', 'Beras', 'kg'),
('Daging Ayam', 'Lauk', 'kg'),
('Telur Ayam', 'Lauk', 'kg'),
('Minyak Goreng', 'Minyak', 'liter'),
('Susu UHT 200ml', 'Susu', 'pcs'),
('Daging Sapi', 'Lauk', 'kg'),
('Bawang Merah', 'Bumbu', 'kg'),
('Bawang Putih', 'Bumbu', 'kg'),
('Sayur Wortel', 'Sayur', 'kg'),
('Sayur Bayam', 'Sayur', 'ikat'),
('Gas LPG 12kg', 'Gas', 'tabung'),
('Gula Pasir', 'Bumbu', 'kg'),
('Tepung Terigu', 'Bumbu', 'kg'),
('Ikan Segar', 'Lauk', 'kg'),
('Kacang Kedelai', 'Bumbu', 'kg'),
('Cabai Merah', 'Bumbu', 'kg'),
('Cabai Rawit', 'Bumbu', 'kg'),
('Kentang', 'Sayur', 'kg'),
('Tahu', 'Lauk', 'kg'),
('Tempe', 'Lauk', 'kg'),
('Air Mineral Galon', 'Air', 'galon'),
('Kecap Manis', 'Bumbu', 'pcs'),
('Saos Sambal', 'Bumbu', 'pcs'),
('Mie Instan', 'Bumbu', 'pcs'),
('Ikan Asin', 'Lauk', 'kg')
ON CONFLICT (nama) DO NOTHING;

-- Seed initial market prices for nutrition items (with UNIQUE constraint removed, uses item_name+shop_name+price_date as logical key)
INSERT INTO market_prices (item_name, region_id, reference_price, unit, commodity_item_id) VALUES
('Beras', 'KAB-BANYUMAS', 14000.00, 'kg', (SELECT id FROM commodity_items WHERE nama = 'Beras')),
('Daging Ayam', 'KAB-BANYUMAS', 38000.00, 'kg', (SELECT id FROM commodity_items WHERE nama = 'Daging Ayam')),
('Telur Ayam', 'KAB-BANYUMAS', 28000.00, 'kg', (SELECT id FROM commodity_items WHERE nama = 'Telur Ayam')),
('Minyak Goreng', 'KAB-BANYUMAS', 16000.00, 'liter', (SELECT id FROM commodity_items WHERE nama = 'Minyak Goreng')),
('Susu UHT 200ml', 'KAB-BANYUMAS', 5000.00, 'pcs', (SELECT id FROM commodity_items WHERE nama = 'Susu UHT 200ml')),
('Daging Sapi', 'KAB-BANYUMAS', 120000.00, 'kg', (SELECT id FROM commodity_items WHERE nama = 'Daging Sapi')),
('Bawang Merah', 'KAB-BANYUMAS', 35000.00, 'kg', (SELECT id FROM commodity_items WHERE nama = 'Bawang Merah')),
('Bawang Putih', 'KAB-BANYUMAS', 40000.00, 'kg', (SELECT id FROM commodity_items WHERE nama = 'Bawang Putih')),
('Sayur Wortel', 'KAB-BANYUMAS', 12000.00, 'kg', (SELECT id FROM commodity_items WHERE nama = 'Sayur Wortel')),
('Sayur Bayam', 'KAB-BANYUMAS', 3000.00, 'ikat', (SELECT id FROM commodity_items WHERE nama = 'Sayur Bayam')),
('Gas LPG 12kg', 'KAB-BANYUMAS', 210000.00, 'tabung', (SELECT id FROM commodity_items WHERE nama = 'Gas LPG 12kg'));
