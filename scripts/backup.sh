#!/usr/bin/env bash
# Runs on the server, nightly from cron. Dumps the database, keeps two
# weeks of dumps here, and copies each one to an R2 bucket so a lost
# disk does not lose the game. Restore with `pg_restore` (docs/deploy/server.md).
set -euo pipefail

cd "$(dirname "$0")/.."

# Cron starts with almost no environment, so the bucket and the R2 token come from .env
set -a
. ./.env
set +a

# Keeps the dumps in backups/ beside the checkout, which git ignores
dir="backups"
file="overwander-$(date -u +%Y%m%d-%H%M).dump"
mkdir -p "$dir"

docker compose exec -T db pg_dump -U postgres -d overwander --format=custom > "$dir/$file"
find "$dir" -name 'overwander-*.dump' -mtime +14 -delete

if [ -n "${BACKUP_BUCKET:-}" ]; then
  pnpm dlx wrangler@4 r2 object put "$BACKUP_BUCKET/$file" --file "$dir/$file" --remote
  echo "Backed up $file to $BACKUP_BUCKET"
else
  echo "BACKUP_BUCKET is not set, so $file stays on this machine only" >&2
fi
