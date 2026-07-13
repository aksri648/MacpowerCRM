CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL DEFAULT '',
  contact_person TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  area TEXT NOT NULL DEFAULT '',
  machine_model TEXT NOT NULL DEFAULT '',
  price INTEGER DEFAULT 0,
  latitude TEXT DEFAULT '',
  longitude TEXT DEFAULT '',
  location_address TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'New Lead',
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_synced ON leads(synced);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
