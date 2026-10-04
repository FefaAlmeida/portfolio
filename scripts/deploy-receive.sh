#!/bin/sh
# Installed once as /usr/local/sbin/portfolio-deploy-receive on the VPS.
# authorized_keys forces this entry point; the CI key cannot open a shell.
set -eu
umask 077
case "${SSH_ORIGINAL_COMMAND:-}" in
  'deploy '*) SHA="${SSH_ORIGINAL_COMMAND#deploy }" ;;
  *) echo 'Only deploy <commit SHA> is accepted.' >&2; exit 1 ;;
esac
case "$SHA" in *[!0-9a-f]*|'') echo 'Invalid commit SHA.' >&2; exit 1;; esac
test "${#SHA}" -eq 40 || { echo 'Expected a full commit SHA.' >&2; exit 1; }
mkdir -p /opt/portfolio/releases
RELEASE="$(mktemp -d "/opt/portfolio/releases/ci-$SHA.XXXXXX")"
trap 'rm -f "$RELEASE/images.tar.gz"' EXIT
# Download only files belonging to the exact tested commit. No runtime secrets
# are fetched from GitHub; /opt/portfolio/.env remains on the server.
BASE="https://raw.githubusercontent.com/FefaAlmeida/portfolio/$SHA"
curl -fsS --retry 3 --max-time 60 "$BASE/deploy/compose.yml" -o "$RELEASE/compose.yml"
curl -fsS --retry 3 --max-time 60 "$BASE/scripts/deploy.sh" -o "$RELEASE/deploy.sh"
cat > "$RELEASE/images.tar.gz"
gzip -t "$RELEASE/images.tar.gz"
sh "$RELEASE/deploy.sh" "ci-$SHA" "$RELEASE"
