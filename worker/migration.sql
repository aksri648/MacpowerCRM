-- Migration: Add multi-user support to existing database
-- Run this against your existing D1 database to add user isolation and sharing

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Add user_id column to existing leads table
ALTER TABLE leads ADD COLUMN user_id TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);

-- 3. Create lead_shares table
CREATE TABLE IF NOT EXISTS lead_shares (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  shared_by_user_id TEXT NOT NULL,
  shared_with_user_id TEXT NOT NULL,
  shared_at TEXT NOT NULL,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (shared_by_user_id) REFERENCES users(id),
  FOREIGN KEY (shared_with_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_lead_shares_lead ON lead_shares(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_shares_shared_with ON lead_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_lead_shares_shared_by ON lead_shares(shared_by_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_shares_unique ON lead_shares(lead_id, shared_with_user_id);
