-- Step 1: Add user_id column to leads
ALTER TABLE leads ADD COLUMN user_id TEXT NOT NULL DEFAULT '';
