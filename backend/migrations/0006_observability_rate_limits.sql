PRAGMA foreign_keys = ON;


CREATE TABLE IF NOT EXISTS rate_limits (
  id TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  subject_hash TEXT NOT NULL,
  bucket INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_updated ON rate_limits(updated_at);
