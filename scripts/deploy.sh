#!/bin/sh
# Runs on the VPS after images have been transferred with deploy-manual.sh.
set -eu
cd /opt/portfolio
TAG="${1:?image tag required}"
case "$TAG" in *[!a-zA-Z0-9_.-]*|'') echo 'Invalid image tag'; exit 1;; esac
umask 077
test -f .env || { echo 'Provision /opt/portfolio/.env and restore the initial snapshot first.'; exit 1; }
docker image inspect "portfolio-api:$TAG" "portfolio-web:$TAG" >/dev/null
PREVIOUS_TAG="$(sed -n 's/^IMAGE_TAG=//p' .env)"
if [ -n "$(docker compose ps --status running -q api)" ]; then
  docker compose exec -T api npm run backup
fi
cp .env .env.before-deploy
sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=$TAG/" .env
docker compose up -d --wait --wait-timeout 180 minio
docker compose stop api
# Never run migrations while the API holds the database lease.
docker compose run --rm --no-deps -T api npm run migrate </dev/null
if ! docker compose up -d --wait --wait-timeout 180 api web; then
  echo "Deploy failed; previous tag: $PREVIOUS_TAG. Configuration saved in .env.before-deploy."
  echo 'Check logs and schema compatibility before rollback. The database has not been restored.'
  exit 1
fi
printf 'Deployment healthy: %s\n' "$TAG"
