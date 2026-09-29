#!/usr/bin/env bash
set -euo pipefail
DESTINATION="${1:-./portfolio-backups}"
REMOTE="${PORTFOLIO_SSH:-root@62.72.9.20}"
mkdir -p "$DESTINATION"
chmod 700 "$DESTINATION"
ARCHIVE="$DESTINATION/portfolio-$(date -u +%Y%m%dT%H%M%SZ).tar.gz"
umask 077
# Run a verified snapshot first, then export only that immutable directory.
ssh "$REMOTE" 'cd /opt/portfolio && docker compose exec -T api npm run backup' >&2
ssh "$REMOTE" 'cd /opt/portfolio && docker compose exec -T api node --input-type=module -e '\''import {listBackups} from "./src/backup.js"; import {spawnSync} from "node:child_process"; const dir="/data/backups"; const name=(await listBackups(dir)).at(-1); if(!name)process.exit(1); const r=spawnSync("tar",["-czf","-","-C",dir,name],{stdio:"inherit"});process.exit(r.status??1);'\''' > "$ARCHIVE.part"
mv "$ARCHIVE.part" "$ARCHIVE"
printf 'Backup salvo: %s\n' "$ARCHIVE"
