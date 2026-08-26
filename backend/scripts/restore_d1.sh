#!/usr/bin/env bash
set -euo pipefail
[ "$#" -ge 2 ] || { echo "Usage: $0 <target-db-name> <backup.sql>"; exit 2; }
DB_NAME="$1"; BACKUP="$2"; test -f "$BACKUP"
[ ! -f "$BACKUP.sha256" ] || sha256sum -c "$BACKUP.sha256"
echo "Restore into a NEW/empty D1 database for a recovery drill unless an approved incident procedure says otherwise."
npx wrangler d1 execute "$DB_NAME" --remote --file "$BACKUP"
