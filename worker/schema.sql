-- Users table (registered via Clerk)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,           -- Clerk user ID (sub from JWT)
  username TEXT NOT NULL UNIQUE, -- Unique username for sharing
  email TEXT NOT NULL UNIQUE,    -- Registered email
  full_name TEXT DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Leads table (now with user_id for ownership)
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,         -- Owner of the lead (Clerk user ID)
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
  synced INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_synced ON leads(synced);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);

-- Lead shares table (for sharing leads between users)
CREATE TABLE IF NOT EXISTS lead_shares (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,              -- The lead being shared
  shared_by_user_id TEXT NOT NULL,    -- Who shared it
  shared_with_user_id TEXT NOT NULL,  -- Who it's shared with
  shared_at TEXT NOT NULL,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (shared_by_user_id) REFERENCES users(id),
  FOREIGN KEY (shared_with_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_lead_shares_lead ON lead_shares(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_shares_shared_with ON lead_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_lead_shares_shared_by ON lead_shares(shared_by_user_id);
-- Prevent duplicate shares
CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_shares_unique ON lead_shares(lead_id, shared_with_user_id);
