#!/usr/bin/env bash
set -euo pipefail
DB_NAME="${1:-investor-coach-production}"
OUT_DIR="${2:-./backups}"
mkdir -p "$OUT_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$OUT_DIR/${DB_NAME}-${STAMP}.sql"
npx wrangler d1 export "$DB_NAME" --remote --output "$OUT"
sha256sum "$OUT" > "$OUT.sha256"
echo "Backup: $OUT"
