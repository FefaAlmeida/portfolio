#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
DEPLOY_TARGET="${PORTFOLIO_SSH:-root@62.72.9.20}"
TAG="${1:-manual-$(date -u +%Y%m%d-%H%M%S)}"
[[ "$TAG" =~ ^[a-zA-Z0-9][a-zA-Z0-9_.-]*$ ]] || exit 1
umask 077
TMP_DEPLOY="$(mktemp -d)"
trap 'rm -rf "$TMP_DEPLOY"' EXIT
docker build --target production -f backend/Dockerfile -t "portfolio-api:$TAG" .
docker build --target production -f frontend/Dockerfile -t "portfolio-web:$TAG" .
# Fixed MinIO source version, independent from application tags.
MINIO_TAG=7aac2a2c5b7c882e68c1ce017d8256be2feea27f
docker build -f deploy/minio.Dockerfile -t "portfolio-minio:$MINIO_TAG" .
docker save "portfolio-api:$TAG" "portfolio-web:$TAG" "portfolio-minio:$MINIO_TAG" | gzip > "$TMP_DEPLOY/images.tar.gz"
ssh "$DEPLOY_TARGET" 'mkdir -p /opt/portfolio; chmod 700 /opt/portfolio'
scp "$TMP_DEPLOY/images.tar.gz" "$DEPLOY_TARGET:/opt/portfolio/images.tar.gz"
scp deploy/compose.yml "$DEPLOY_TARGET:/opt/portfolio/compose.yml"
scp scripts/deploy.sh "$DEPLOY_TARGET:/opt/portfolio/deploy.sh"
ssh "$DEPLOY_TARGET" "docker load -i /opt/portfolio/images.tar.gz >/dev/null && rm /opt/portfolio/images.tar.gz && sh /opt/portfolio/deploy.sh '$TAG'"
