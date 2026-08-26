PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  plan TEXT NOT NULL CHECK(plan IN ('7','30','365')),
  target_score INTEGER NOT NULL DEFAULT 80 CHECK(target_score BETWEEN 0 AND 100),
  due_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','completed','cancelled')),
  assigned_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY(org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(assigned_by) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id TEXT NOT NULL,
  actor_user_id TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  meta_json TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(org_id) REFERENCES organizations(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_assignments_org ON assignments(org_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user ON assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due ON assignments(org_id,status,due_at);
CREATE INDEX IF NOT EXISTS idx_audit_org_created ON audit_logs(org_id,created_at);
