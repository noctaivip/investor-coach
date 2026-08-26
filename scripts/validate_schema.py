from pathlib import Path
import sqlite3
root=Path(__file__).resolve().parents[1]
schema=(root/'backend/schema.sql').read_text(encoding='utf-8')
db=sqlite3.connect(':memory:')
db.executescript(schema)
required={'organizations','users','sessions','learning_state','assignments','audit_logs','sso_settings','oidc_auth_requests','sso_login_codes','scim_tokens'}
found={r[0] for r in db.execute("select name from sqlite_master where type='table'")}
missing=required-found
if missing: raise SystemExit('Missing schema tables: '+', '.join(sorted(missing)))
print('OK: D1/SQLite schema parses and required enterprise tables exist.')
