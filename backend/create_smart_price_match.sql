-- Smart price-reference matching: per-date (nota date) + per-unit awareness.
ALTER TABLE audit_reports
    ADD COLUMN IF NOT EXISTS nota_date DATE;

ALTER TABLE audit_items
    ADD COLUMN IF NOT EXISTS unit VARCHAR(50) NOT NULL DEFAULT 'kg',
    ADD COLUMN IF NOT EXISTS matched_market_price_id INTEGER,
    ADD COLUMN IF NOT EXISTS reference_date DATE,
    ADD COLUMN IF NOT EXISTS unit_converted BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS match_skipped_reason VARCHAR(50);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'audit_items_matched_market_price_id_fkey'
    ) THEN
        ALTER TABLE audit_items
            ADD CONSTRAINT audit_items_matched_market_price_id_fkey
            FOREIGN KEY (matched_market_price_id) REFERENCES market_prices(id);
    END IF;
END $$;