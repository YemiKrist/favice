-- ============================================================
-- Favice — Supabase Schema
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- ─── Profiles ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          TEXT UNIQUE NOT NULL,        -- NextAuth session.user.id
  company_name     TEXT,
  company_address  TEXT,
  company_email    TEXT,
  company_phone    TEXT,
  logo_url         TEXT,
  signature_url    TEXT,
  signatory_name   TEXT,
  signatory_designation TEXT,
  bank_account_number TEXT,
  bank_name        TEXT,
  account_name     TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Invoices ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          TEXT NOT NULL,
  invoice_number   TEXT NOT NULL,
  invoice_date     DATE NOT NULL,
  due_date         DATE,
  client_name      TEXT NOT NULL,
  client_address   TEXT,
  client_email     TEXT,
  subtotal         DECIMAL(14, 2) DEFAULT 0,
  vat_enabled      BOOLEAN DEFAULT FALSE,
  vat_percentage   DECIMAL(5, 2) DEFAULT 7.5,
  vat_amount       DECIMAL(14, 2) DEFAULT 0,
  wht_enabled      BOOLEAN DEFAULT FALSE,
  wht_percentage   DECIMAL(5, 2) DEFAULT 5,
  wht_amount       DECIMAL(14, 2) DEFAULT 0,
  total            DECIMAL(14, 2) DEFAULT 0,
  bank_name        TEXT,
  account_name     TEXT,
  account_number   TEXT,
  notes            TEXT,
  status           TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Invoice Line Items ───────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id   UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description  TEXT NOT NULL DEFAULT '',
  quantity     DECIMAL(10, 2) NOT NULL DEFAULT 1,
  rate         DECIMAL(14, 2) NOT NULL DEFAULT 0,
  amount       DECIMAL(14, 2) GENERATED ALWAYS AS (quantity * rate) STORED,
  sort_order   INTEGER DEFAULT 0
);

-- ─── Indexes ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status  ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_line_items_invoice ON invoice_line_items(invoice_id);

-- ─── Updated_at trigger ───────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Row Level Security ───────────────────────────────────
-- NOTE: The app uses the Supabase service role key server-side,
-- which bypasses RLS. These policies protect against direct
-- client-side access.

ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices            ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items  ENABLE ROW LEVEL SECURITY;

-- Profiles: only the owning user can see/modify their row
CREATE POLICY "profiles: owner access" ON profiles
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- Invoices: only the owning user
CREATE POLICY "invoices: owner access" ON invoices
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- Line items: accessible if the parent invoice belongs to the user
CREATE POLICY "line_items: owner access" ON invoice_line_items
  USING (invoice_id IN (
    SELECT id FROM invoices WHERE user_id = auth.uid()::text
  ));

-- ─── Storage buckets ──────────────────────────────────────
-- Run in Supabase Dashboard → Storage → New bucket:
--   Bucket name: company-assets
--   Public: true
--
-- Or via SQL (requires pg_storage extension):
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('company-assets', 'company-assets', true)
-- ON CONFLICT DO NOTHING;
