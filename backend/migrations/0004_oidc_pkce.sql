PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS oidc_auth_requests (
  state_hash TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  code_verifier TEXT NOT NULL,
  nonce TEXT NOT NULL,
  return_url TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(org_id) REFERENCES organizations(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_oidc_auth_expiry ON oidc_auth_requests(expires_at);

CREATE TABLE IF NOT EXISTS sso_login_codes (
  code_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sso_login_codes_expiry ON sso_login_codes(expires_at);
