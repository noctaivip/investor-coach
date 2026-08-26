PRAGMA foreign_keys = ON;
ALTER TABLE users ADD COLUMN active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1));

CREATE TABLE IF NOT EXISTS scim_tokens (
  token_hash TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  revoked_at TEXT,
  FOREIGN KEY(org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_scim_org_active ON scim_tokens(org_id,revoked_at);
