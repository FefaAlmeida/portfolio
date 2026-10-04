#!/bin/sh
# Install this script and deploy/Caddyfile.example in /opt/portfolio before use.
# Run only after reviewing the private preview: sh cutover.sh
set -eu
cd /opt/portfolio
test -f Caddyfile.public || { echo 'Missing /opt/portfolio/Caddyfile.public'; exit 1; }
grep -q '^import /opt/portfolio-demo/Caddyfile$' /etc/caddy/Caddyfile || {
  echo 'Expected demo import not found; inspect the current Caddy configuration.'; exit 1;
}
docker compose exec -T api node --input-type=module -e '
const response=await fetch("http://localhost:3001/api/i18n/ready");
const state=await response.json();
if(!response.ok || !state.ready) { console.error("Complete public translations before cutover",state); process.exit(1); }
'
docker compose exec -T api npm run backup
umask 077
CUTOVER_BACKUP="cutover-$(date -u +%Y%m%d-%H%M%S)"
mkdir "$CUTOVER_BACKUP"
cp .env "$CUTOVER_BACKUP/env"
cp /etc/caddy/Caddyfile "$CUTOVER_BACKUP/Caddyfile"
rollback() {
  echo 'Cutover failed; restoring origin and Caddy configuration.'
  cp "$CUTOVER_BACKUP/env" .env
  cp "$CUTOVER_BACKUP/Caddyfile" /etc/caddy/Caddyfile
  docker compose up -d --wait --wait-timeout 180 api web
  caddy reload --config /etc/caddy/Caddyfile
}
trap 'rollback' EXIT
sed -i 's|^PUBLIC_URL=.*|PUBLIC_URL=https://fernandagabriela.com|;s|^ADMIN_URL=.*|ADMIN_URL=https://admin.fernandagabriela.com|' .env
if ! grep -q '^ADMIN_URL=' .env; then echo 'ADMIN_URL=https://admin.fernandagabriela.com' >> .env; fi
docker compose up -d --wait --wait-timeout 180 api web
cp Caddyfile.public /etc/caddy/portfolio-public.Caddyfile
chmod 644 /etc/caddy/portfolio-public.Caddyfile
sed -i 's|^import /opt/portfolio-demo/Caddyfile$|import /etc/caddy/portfolio-public.Caddyfile|' /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile
caddy reload --config /etc/caddy/Caddyfile
# Check the main origin and both languages through HTTPS.
for SUFFIX in / /en /api/health; do
  curl --fail --silent --show-error "https://fernandagabriela.com$SUFFIX" >/dev/null
done
curl --fail --silent --show-error --retry 12 --retry-delay 3 --retry-all-errors --max-time 10 https://admin.fernandagabriela.com/ >/dev/null
trap - EXIT
printf 'Next.js is live. Previous configuration: /opt/portfolio/%s\n' "$CUTOVER_BACKUP"
