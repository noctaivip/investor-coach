PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sso_settings (
  org_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'oidc' CHECK(provider IN ('oidc')),
  issuer TEXT NOT NULL,
  client_id TEXT NOT NULL,
  email_domain TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  FOREIGN KEY(org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY(updated_by) REFERENCES users(id) ON DELETE RESTRICT
);
