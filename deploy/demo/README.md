# Deploy manual da demo V3

Site: https://fernandagabriela.com. `www` redireciona para o domínio principal.

A imagem contém a demo de `frontend/public/demos/landing-v3` e a imagem compartilhada do MatMov. O modal do Luminar usa a capa do card; o vídeo não é incluído na imagem. Não há Next.js, API, banco, MinIO ou credenciais nesta implantação.

Na VPS `root@62.72.9.20`, o projeto Compose `portfolio-demo` fica em `/opt/portfolio-demo`, com HTTP somente em `127.0.0.1:7152`. O Caddy do host importa `/opt/portfolio-demo/Caddyfile` e gerencia HTTPS automaticamente. Cloudflare usa registros DNS sem proxy: A da raiz para a VPS e CNAME de `www` para a raiz.

## Atualizar

Execute na raiz do repositório, em Bash. Requer Docker e acesso SSH já configurado. Não usa GitHub Actions nem registry. O build inclui os arquivos locais, mesmo sem commit.

```bash
set -euo pipefail
DEMO_TAG="demo-$(date -u +%Y%m%dT%H%M%SZ)"
docker build -f deploy/demo/Dockerfile -t "portfolio-demo:$DEMO_TAG" .
docker save "portfolio-demo:$DEMO_TAG" | gzip | ssh root@62.72.9.20 'gunzip | docker load'
scp deploy/demo/compose.yml root@62.72.9.20:/opt/portfolio-demo/compose.yml
ssh root@62.72.9.20 "sh -s -- '$DEMO_TAG'" <<'REMOTE'
set -eu
cd /opt/portfolio-demo
umask 077
cp .env .env.previous
printf 'IMAGE_TAG=%s\n' "$1" > .env
if ! docker compose up -d --wait --wait-timeout 90; then
  cp .env.previous .env
  docker compose up -d --wait --wait-timeout 90
  exit 1
fi
REMOTE
curl --fail --silent --show-error --output /dev/null https://fernandagabriela.com/
```

Valide a página, as imagens e os quatro modais em desktop e celular antes de publicar uma nova imagem. Mudanças no Caddy devem passar por `caddy validate` antes de `caddy reload`, preservando os demais domínios do host.

## Operação e rollback

```bash
ssh root@62.72.9.20 'cd /opt/portfolio-demo && docker compose ps && docker compose logs --tail 50'
# Após uma atualização, voltar à imagem anterior:
ssh root@62.72.9.20 'cd /opt/portfolio-demo && cp .env.previous .env && docker compose up -d --wait --wait-timeout 90'
```

Versão inicial: `demo-20260929-2`. Mantenha a imagem anterior disponível até validar a atualização. Os arquivos da demo estão incorporados à imagem, sem volumes de dados.

Na futura implantação Next.js, planeje a substituição deste serviço: a porta 7152 estará ocupada pela demo. O deploy completo e a migração do conteúdo ainda serão definidos separadamente.
