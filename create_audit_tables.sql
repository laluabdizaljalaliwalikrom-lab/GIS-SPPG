-- Create market_prices table
CREATE TABLE IF NOT EXISTS market_prices (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR UNIQUE NOT NULL,
    region_id VARCHAR,
    reference_price NUMERIC(15, 2) NOT NULL,
    unit VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Seed initial market prices for nutrition items
INSERT INTO market_prices (item_name, region_id, reference_price, unit) VALUES
('Beras', 'KAB-BANYUMAS', 14000.00, 'kg'),
('Daging Ayam', 'KAB-BANYUMAS', 38000.00, 'kg'),
('Telur Ayam', 'KAB-BANYUMAS', 28000.00, 'kg'),
('Minyak Goreng', 'KAB-BANYUMAS', 16000.00, 'liter'),
('Susu UHT 200ml', 'KAB-BANYUMAS', 5000.00, 'pcs'),
('Daging Sapi', 'KAB-BANYUMAS', 120000.00, 'kg'),
('Bawang Merah', 'KAB-BANYUMAS', 35000.00, 'kg'),
('Bawang Putih', 'KAB-BANYUMAS', 40000.00, 'kg'),
('Sayur Wortel', 'KAB-BANYUMAS', 12000.00, 'kg'),
('Sayur Bayam', 'KAB-BANYUMAS', 3000.00, 'ikat'),
('Gas LPG 12kg', 'KAB-BANYUMAS', 210000.00, 'tabung')
ON CONFLICT (item_name) DO UPDATE 
SET reference_price = EXCLUDED.reference_price, 
    unit = EXCLUDED.unit, 
    region_id = EXCLUDED.region_id;
