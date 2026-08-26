# D1 Backup & Restore Runbook v9.2

Create a backup from `backend/`:

```bash
bash scripts/backup_d1.sh investor-coach-production ./backups
```

Restore drills should use a new temporary D1 database:

```bash
bash scripts/restore_d1.sh investor-coach-recovery-test ./backups/<backup>.sql
```

Verify organizations/users, assignments, learning state, SSO/SCIM metadata and audit history. Do not overwrite the primary database blindly during an incident. Production readiness also requires a named owner, approved retention, protected backup storage, a dated restore drill and approved RPO/RTO.
