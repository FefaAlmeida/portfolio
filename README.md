# Portfólio com painel administrativo

Next.js no frontend e Node.js/Express no backend, ambos em JavaScript. SQLite guarda conteúdo e sessões; uma instância privada de MinIO guarda fotos, vídeos, miniaturas e credenciais. O painel está em `/admin`.

## Desenvolvimento — um comando

Na **raiz do projeto**:

```sh
npm run dev
```

Requisitos: Node.js 24+, npm e Docker Compose. Não precisa instalar dependências em cada pasta nem criar `.env` para subir o ambiente local: o comando constrói as imagens, inicia os containers, espera os healthchecks e prepara o conteúdo inicial.

| Serviço | Endereço / persistência |
| --- | --- |
| Frontend Next.js | http://localhost:3000 |
| Painel | http://localhost:3000/admin |
| API Node.js | http://localhost:3001/api/health |
| MinIO | 127.0.0.1:19000; volume `portfolio-dev_minio-data` |
| SQLite e backups | `backend/data/`, montado em `/data` no container da API |

O SQLite é um banco em arquivo, usado diretamente pelo backend; **não há um processo ou container SQLite separado**. O banco, backups e imagens persistem quando os containers são desligados ou recriados.

Na primeira execução, o conteúdo original é importado e uma conta local é criada com senha aleatória em `backend/data/local-admin.txt` (fora do Git). Nas próximas execuções, dados, conta e senha existentes são preservados. O primeiro build do MinIO compila a versão fixada no projeto e pode levar alguns minutos; os seguintes aproveitam o cache.

Os containers ficam em segundo plano. Mudanças em `frontend/src` e `backend/src` são recarregadas automaticamente. Ao mudar dependências ou Dockerfiles, execute `npm run dev` novamente para reconstruir as imagens.

No Docker, o frontend usa Webpack com verificação de arquivos a cada 500 ms, para detectar edições mesmo quando o sistema não repassa eventos de arquivos ao container. Ao salvar componentes como `frontend/src/components/sobreMim/index.jsx`, o Next recompila e atualiza a aba automaticamente. Após receber essa configuração, execute `npm run dev` uma vez para recriar o serviço com ela; as próximas edições não exigem reiniciar.

Em desenvolvimento, edite os textos e listas dos itens existentes em **`backend/seed/content.json`**. A API sincroniza o arquivo com o banco local em cerca de 500 ms e a página pública aberta detecta mudanças a cada segundo, inclusive mantendo o modal aberto. Publicações pelo painel também aparecem automaticamente. Não é necessário `npm run dev:restart` nem atualizar a aba.

Na primeira ativação dessa sincronização, os campos presentes no arquivo são aplicados aos itens locais correspondentes. Depois, só os campos alterados no arquivo são reaplicados; edições do painel em outros campos e rascunhos independentes são preservados. Itens privados continuam privados. JSON inválido não altera o banco; corrija o arquivo e a sincronização retoma sozinha. Criação/exclusão de itens, ordenação e mídias continuam pelo painel. O sincronizador não solicita traduções nem modifica o conteúdo em inglês.

`frontend/src/data/projetos.jsx` é um arquivo legado e não alimenta a página atual. Em produção, o conteúdo continua sendo administrado pelo painel: sincronização de arquivos e atualização automática da página ficam desativadas.


```sh
npm run dev:logs       # acompanhar logs
npm run dev:status     # conferir os containers
npm run dev:down       # desligar sem apagar os dados
npm run dev           # subir novamente
npm run backup        # gerar um backup agora
npm run admin -- seu-email@exemplo.com  # trocar e-mail/senha da conta
```

O comando de administrador solicita a senha sem exibi-la e encerra as sessões anteriores. Não existe cadastro público nem recuperação por e-mail. As credenciais do Compose local são exclusivamente de desenvolvimento.

As portas 3000, 3001 e 19000 precisam estar livres para a primeira inicialização. Se estava usando `npm run dev` dentro de `frontend/` ou `backend/`, encerre esses processos antes de usar o comando da raiz. Não execute a API nativa e a API Docker simultaneamente: ambas usariam o mesmo SQLite.

Os Dockerfiles e o Compose em `deploy/` continuam separados do ambiente de desenvolvimento. Para executar verificações diretamente no host, instale as dependências de cada pasta com `npm ci --prefix backend` e `npm ci --prefix frontend`.

## Editar e salvar

- **Salvar** persiste o conteúdo e a **Visibilidade** escolhida: **Público** atualiza o site na próxima visita/atualização; **Privado** fica disponível apenas no painel e no Preview autenticado. Novos itens começam privados e permitem escolher Público antes de salvar.
- **Preview** mostra as alterações atuais sem salvar. A barra superior contém Desfazer, Refazer, Preview e Salvar.
- Alterar a visibilidade só entra em vigor ao salvar. A exclusão fica na listagem e remove o registro após confirmação.
- Os botões subir/descer alteram imediatamente a ordem dos itens de uma seção. Prêmios respeitam essa ordem, sem reordenação automática por ano.
- Textos longos aceitam parágrafos, negrito, itálico, listas e links HTTP(S). O servidor valida a estrutura e o frontend renderiza elementos permitidos, sem HTML arbitrário.
- **Mídias do projeto:** até 5 arquivos, sendo no máximo 1 vídeo. Fotos JPEG, PNG ou WebP de até **10 MB**; vídeos MP4 (H.264, 8 bits, 4:2:0) ou WebM (VP8/VP9, 8 bits, 4:2:0) de até **100 MB**. Não há conversão de codecs.
- O primeiro upload define a capa; vídeos usam exatamente o primeiro frame, inclusive se estiver preto. Arraste as mídias para ordenar (ou use Alt + setas no puxador). O menu de três pontos permite tornar capa, ajustar o fundo ou excluir. Trocar a ordem não troca a capa; excluir a capa promove a primeira mídia restante.
- Cada mídia tem uma cor de fundo detectada pelas bordas, ajuste manual e opção de restaurar a cor automática. No modal, fotos aparecem em slider; se houver vídeo, somente ele aparece, mudo, automático, em loop e com botão de tela cheia. Preferências do navegador podem bloquear a reprodução automática.
- Imagens de experiências: JPEG, PNG ou WebP. Credenciais: esses formatos ou PDF; alternativamente, um link externo. Limite de **10 MB** por arquivo. PDFs são entregues como download.
- O importador copia 4 projetos, 5 experiências e 6 prêmios visíveis no site original. Links fictícios foram retirados. Os anos e instituições que já estavam pendentes de confirmação devem ser revisados no painel.
- Uploads não utilizados são removidos após sete dias, durante a rotina de backup. Arquivos usados pelo rascunho ou pela versão publicada são preservados; snapshots antigos mantêm suas próprias cópias.

## API e organização

- `backend/src`: API, validação, SQLite, armazenamento S3, importação, comandos e backups.
- `frontend/src/app/admin`: painel e prévia; o site público consulta a API no servidor, sem cache persistente.
- `deploy`: imagens e Compose de produção, exemplos de configuração do Caddy e ambiente.

Consultas públicas: `GET /api/projetos`, `/api/experiencias`, `/api/premios` e `/api/media/:id`. Só retornam dados publicados. A API não entrega arquivos vinculados exclusivamente a itens privados a visitantes.

Autenticação: `GET /api/auth/session`, `POST /api/auth/login` e `/api/auth/logout`. O GET retorna um token CSRF; requisições de escrita exigem a origem configurada e o header `X-CSRF-Token`, além da sessão quando administrativas. A sessão dura no máximo sete dias e usa cookie HttpOnly, SameSite e Secure em produção.

Gerenciamento: `GET/POST /api/admin/:section`, `GET/PUT/DELETE /api/admin/:section/:id`, `POST .../:id/publish`, `POST .../:id/hide`, `PUT .../order` com `{ids:[...]}` e `POST /api/admin/uploads` com multipart `file`. Criações enviam os campos do conteúdo e `visibilidade: "publico" | "privado"` (padrão: `"privado"`); edições enviam `{draft,revision,visibilidade}` e salvam conteúdo e visibilidade atomicamente. Respostas administrativas incluem `visibilidade`. Os endpoints `publish`/`hide` e edições sem `visibilidade` mantêm o comportamento antigo por compatibilidade. Publicação, ocultação e exclusão enviam `{revision}`. Conflitos entre abas retornam HTTP 409.

Projetos persistem `midias: [{assetId, corFundo: null | "#RRGGBB"}]` e `capaId`. As respostas enriquecem cada mídia com `tipo`, `nome`, `url`, `previewUrl` e `corAutomatica`; a API pública mantém `imagemUrl` e `imagemBg` derivados da capa. Envie cada mídia para `POST /api/admin/uploads/project-media` com multipart `file`. Arquivos e miniaturas privados exigem sessão; os públicos são acessíveis por referência publicada, com suporte a `Range` e `HEAD`.

O esquema v2 migra capas existentes para a lista de mídias, preservando as cores e as versões de rascunho/publicação. Links antigos em `imagens` ou `videoUrl` interrompem a migração sem descartar conteúdo: importe-os antes da atualização. Na inicialização, o servidor calcula os metadados ausentes. Backups v1 continuam restauráveis e são migrados ao iniciar a aplicação atual.

FFmpeg/FFprobe e Sharp fazem o processamento no servidor. As imagens Docker já incluem essas dependências; para executar a API ou os testes diretamente no host, instale FFmpeg (incluindo FFprobe) no PATH. O proxy Caddy deve permitir **106 MB** por requisição (arquivo mais multipart), conforme `deploy/Caddyfile.example`.

Comandos operacionais usam `/api/internal/*`, com um token separado. Essas rotas são bloqueadas pelo Caddy e pelo proxy do Next.js, ficando disponíveis apenas diretamente na API interna. A aplicação usa **uma única instância de API** para coordenar alterações e backups; não aumente o número de réplicas.

## Backups e restauração

Todos os dias às **03h de America/Sao_Paulo**, a API gera uma cópia consistente do SQLite e dos arquivos, pausando brevemente as gravações. Leituras continuam disponíveis. O horário pode ser ajustado em `BACKUP_SCHEDULE`.

Cada snapshot contém banco, objetos e um manifesto com hashes. A rotina verifica a integridade antes de publicar a nova cópia:

- Se o conteúdo é igual, substitui somente o snapshot mais recente.
- Se mudou, mantém os dois. Guarda até **sete versões distintas**, independentemente das datas.
- Sessões e metadados operacionais não geram versões adicionais. Mudanças de conteúdo, arquivos, credenciais administrativas ou esquema geram.
- Se a verificação falha, nenhuma cópia anterior é removida. A falha aparece nos logs como `BACKUP FAILED`.

Backup manual local, com os containers em execução, na raiz do projeto:

```sh
npm run backup
```

Produção:

```sh
cd /opt/portfolio
docker compose exec -T api npm run backup
```

Para gerar e baixar o snapshot mais recente para o seu computador, a partir deste repositório:

```sh
./scripts/download-backup.sh ~/Backups/portfolio
```

O destino SSH padrão é `root@62.72.9.20`; altere com `PORTFOLIO_SSH`. O arquivo contém dados administrativos e deve ser guardado em local privado. A cópia externa é manual nesta versão; os backups diários no próprio servidor não protegem contra perda desse servidor.

Para restaurar um snapshot já existente no volume de produção:

```sh
cd /opt/portfolio
docker compose stop api web
docker compose run --rm --no-deps api npm run restore -- /data/backups/NOME-DO-SNAPSHOT --confirm
docker compose up -d --wait api web
```

Para recuperar de um arquivo baixado em volumes novos, primeiro inicie o MinIO. Extraia o arquivo em uma pasta temporária e monte essa pasta somente para leitura no comando de restauração, usando um caminho absoluto:

```sh
docker compose up -d --wait minio
# Extraia seu arquivo .tar.gz em /caminho/absoluto/recuperacao antes deste comando.
docker compose run --rm --no-deps -v /caminho/absoluto/recuperacao:/restore:ro api npm run restore -- /restore/NOME-DO-SNAPSHOT --confirm
docker compose up -d --wait api web
```

A restauração verifica banco e arquivos antes de trocar o banco ativo e invalida as sessões antigas. A API precisa permanecer parada durante todo o procedimento. O agendamento depende da API estar em execução; um horário perdido durante indisponibilidade não é reexecutado automaticamente.

## Deploy na VPS com GitHub Actions

A aplicação roda em Docker na VPS `root@62.72.9.20`, em `/opt/portfolio`. O Next.js usa `127.0.0.1:7154`; a API, `127.0.0.1:7153`. MinIO e SQLite ficam em volumes exclusivos, sem portas públicas para o armazenamento. A demo anterior fica preservada em `/opt/portfolio-demo` para recuperação, com o container parado após a troca. A landing pública usa `https://fernandagabriela.com`, e o painel abre diretamente em `https://admin.fernandagabriela.com`. O antigo `/admin` redireciona para o painel.

A Cloudflare mantém os registros DNS sem proxy. O Caddy do host termina HTTPS com Let's Encrypt e encaminha as requisições para os containers. A prévia é `https://previa.fernandagabriela.com`, com senha adicional e `X-Robots-Tag: noindex, nofollow, noarchive`. O painel tem autenticação própria, com cookies restritos ao seu host e validação de origem em `ADMIN_URL`. As credenciais ficam fora do Git; a chave Gemini existe somente no ambiente da API.

Cada push na `main` executa `.github/workflows/ci.yml`: verifica traduções e lint, testa o backend, constrói o Next.js e executa os testes de navegador da landing e do subdomínio administrativo. Somente depois de todas as verificações passarem, o job `deploy` constrói as imagens Docker no runner do GitHub, com cache por serviço, e as transfere por SSH para a VPS. Pull requests executam somente a verificação. Também é possível executar o workflow manualmente na `main`, em Actions → CI e deploy → Run workflow.

O GitHub usa o environment `production`, com a variável `DEPLOY_HOST` e os secrets `DEPLOY_SSH_KEY` e `DEPLOY_KNOWN_HOSTS`. A chave SSH é exclusiva desse repositório e sua entrada em `/root/.ssh/authorized_keys` tem `restrict,command="/usr/local/sbin/portfolio-deploy-receive"`. O receptor instalado a partir de `scripts/deploy-receive.sh` aceita somente `deploy <SHA completo>`, recebe as imagens e baixa o Compose e o script de deploy do mesmo commit no repositório público. Mudanças no receptor precisam ser instaladas separadamente pelo administrador da VM. A confiança dessa chave inclui executar o script de deploy do repositório como root; ela não oferece shell interativo nem encaminhamento de portas. A identidade SSH da VM é fixada em `DEPLOY_KNOWN_HOSTS`, obtida por uma conexão administrativa já verificada.

As imagens da aplicação recebem a tag `ci-<SHA>`. O workflow serializa os deploys sem interromper uma publicação em andamento e ignora uma versão que já tenha sido substituída na `main` antes da transferência. Um lock na VM também impede concorrência com deploys manuais. Os arquivos recebidos ficam em `/opt/portfolio/releases`; o arquivo grande de imagens é removido após a tentativa. `.last-deploy` registra a última tag saudável. Os testes finais verificam HTTPS da landing em português e inglês, a API e o painel. Caddy, DNS, volumes e `/opt/portfolio/.env` permanecem na VM; nenhuma chave Gemini ou senha administrativa é enviada ao Actions. Pode haver uma breve indisponibilidade enquanto a API para para migrar e reiniciar.

O deploy manual continua disponível e inclui alterações locais ainda não commitadas. Não há publicação de imagens no GHCR. Depois das verificações:

```sh
./scripts/deploy-manual.sh manual-AAAAMMDD-HHMMSS
```

O script exige `/opt/portfolio/.env` previamente configurado conforme `deploy/.env.example`. Ele constrói as três imagens, carrega-as na VPS, gera backup, interrompe a única API escritora para migrar o banco e verifica a saúde dos serviços. Tanto o deploy automático quanto o manual preservam `.env.before-deploy` e `compose.yml.before-deploy`; não restauram o banco automaticamente em caso de falha. Antes de voltar a uma imagem anterior, confira a compatibilidade do esquema com `node src/cli.js compatible`. As imagens anteriores são mantidas para recuperação; monitore o espaço em disco e remova somente versões antigas do portfólio que já não sejam necessárias. O MinIO usa uma versão independente da aplicação, fixada no commit `7aac2a2c5b7c882e68c1ce017d8256be2feea27f`.

Na primeira instalação, restaure um snapshot local verificado com a API parada, inicialize o MinIO, aplique as migrações e configure a conta administrativa. `deploy/prepare-preview.mjs` adapta exclusivamente o Luminar para mostrar sua capa existente; execute-o uma vez antes de iniciar a API e preparar as traduções. O snapshot original preserva suas mídias anteriores. Nunca execute seed para substituir um banco já migrado.

A configuração da prévia está em `deploy/Caddyfile.preview.example`. Substitua o hash de senha gerado por `caddy hash-password`, instale-a como um import do Caddy, valide e recarregue. `/api/internal/*` permanece bloqueado; os endpoints do gateway exigem seu token próprio mesmo na prévia.

A troca para `fernandagabriela.com` usa `deploy/Caddyfile.example` e `scripts/cutover.sh`, somente depois da revisão da prévia. O comando exige todas as traduções públicas concluídas, faz backup e troca a origem da aplicação e o import do Caddy. O container da demo é preservado para retorno rápido e pode ser reiniciado se necessário. A prévia continua protegida por senha após a troca; sua antiga rota administrativa redireciona para o subdomínio do painel. `PUBLIC_URL` define a landing e `ADMIN_URL` define a origem autorizada a editar.

## Verificação

```sh
npm run lint:admin --prefix frontend
npm run check --prefix backend
npm test --prefix backend
npm run build --prefix frontend
npx --prefix frontend playwright install chromium
npm run test:e2e --prefix frontend
(cd frontend && npx playwright test -c playwright.admin.config.js)
```

Os testes de navegador usam banco temporário e armazenamento em memória, sem tocar no conteúdo local ou de produção. Os testes da API verificam publicação, isolamento de mídia, autenticação, conflitos, uploads, backups e restauração. A integração real com MinIO pode ser conferida com `npm run test:storage --prefix backend` após iniciar o Compose local.

## Português e inglês

O conteúdo público usa `/` (`pt-BR`) e `/en` (`en-US`). O painel tem idioma de interface independente do idioma do item. Cada item guarda seu idioma de origem, os dois rascunhos e as duas versões publicadas. Na criação, escolha Português ou English antes de preencher o formulário.

### Experiências extracurriculares

A seção usa a composição editorial da landing-v3, com linha do tempo na ordem definida no painel. Os indicadores fazem parte dos parágrafos de `descricao`: use o botão **Negrito** do editor para deixá-los em rosa e negrito no editor, na prévia e no site. Não há cards nem listas separadas de resultados; o campo legado `resultados` permanece no esquema apenas por compatibilidade.

`siteUrl`, `instagramUrl`, `imagemLegenda` e `imagemAjuste` (`natural`, `contain` ou `cover`) continuam editáveis. `imagemDupla` habilita uma segunda foto na galeria quando `imagemSecundariaId` está preenchido, sem imagens provisórias. A galeria do MatMov combina seu logo com a foto cadastrada, com navegação, pausa e progresso; a troca automática respeita movimento reduzido e pausa fora da tela. Os links publicados das cinco experiências seguem os endereços da referência.

A página pública e seus modais usam Tailwind e os componentes em `frontend/src/components/ui`. `globals.css` contém apenas imports, tokens dos temas, regras base e keyframes das bolhas; os antigos `projects.css` e `experiences.css` foram removidos. O painel administrativo mantém sua folha de layout própria.

Datas aparecem como MM/AAAA, com o período principal de atuação. No conteúdo inicial de Nossa Casinha, julho a dezembro de 2025 é o intervalo estimado escolhido para exibição; o apoio pontual de 2026 é explicado no texto da experiência.

O conteúdo inglês revisado está em `backend/seed/experiencias-en.json`. Para reaplicar explicitamente a revisão inicial a um banco existente, pare a API e execute `node backend/scripts/apply-experience-content.js [caminho-do-banco]`; depois reinicie a API. O comando exige acesso exclusivo, guarda um backup dos registros e traduções, preserva as mídias, atualiza os cinco itens e torna privada somente a entrada extracurricular duplicada do Lector Hub. Ele substitui os textos dos itens abrangidos; não é um sincronizador contínuo. Edições futuras devem usar o painel e seu fluxo de tradução.

Ao salvar o idioma de origem, o rascunho é persistido antes de chamar `gemini-3.8-flash`. A revisão gera propostas somente para campos e blocos de texto alterados ou para o preenchimento inicial do idioma ausente. Blocos possuem identificadores persistentes para manter a associação quando são movidos. Mídias, links, status e datas são compartilhados; títulos, descrições, nomes de perfis, funcionalidades, textos alternativos e legendas são localizados. A resposta do modelo substitui apenas texto: IDs, links e formatação são preservados pelo código.

A revisão compara original anterior e atual, tradução anterior e proposta. Cada trecho permite aprovar, editar e aprovar, rejeitar, pedir outra proposta com orientação opcional ou manter explicitamente a tradução anterior. Aprovar todas inclui apenas propostas válidas; rejeições e erros continuam pendentes. As decisões são salvas a cada ação e podem ser retomadas.

Concluir a revisão publica os dois idiomas atomicamente quando a visibilidade é pública. Itens privados continuam privados. Uma falha do Gemini mantém o rascunho salvo e a publicação anterior; não há repetição paga automática. Alterações manuais no idioma secundário são preservadas. Mudanças apenas em arquivos, status ou apresentação sem alterar negrito não exigem nova chamada ao modelo. Versões da revisão impedem que uma proposta atrasada sobrescreva uma edição mais recente.

Alterações apenas de negrito entram na revisão com a redação traduzida intacta. Destacar um parágrafo inteiro ou remover todos os destaques dispensa o modelo. Para destaques parciais, o modelo seleciona trechos exatos da tradução existente; correspondências ausentes, repetidas ou sobrepostas permanecem pendentes. O painel mostra a formatação e permite editar os destaques, aprovar ou manter a versão anterior. O gateway autenticado aceita `mode: "align-bold"` para essa seleção; atualize também o backend usado como gateway antes de usar a geração de destaques em desenvolvimento. O modo padrão continua sendo tradução de texto.

Para recuperar os destaques antigos das experiências sem substituir a redação inglesa, execute `node backend/scripts/repair-bold.js [caminho-do-banco]` para simular. O manifesto `backend/seed/bold-recovery.json` contém os originais conferidos, os destaques e apenas os acréscimos de informações ausentes aprovados. Para aplicar, pare a API, repita com `--apply` e reinicie a API. O comando exige acesso exclusivo, cria backup SQLite, verifica os originais e trata rascunho/publicação separadamente. Recusa conteúdo divergente ou revisões pendentes, não publica rascunhos e pode ser repetido sem novas alterações. A auditoria também sinaliza diferenças na quantidade de destaques de outros campos ricos e páginas; ela não substitui a conferência semântica dos trechos.

Em **Traduções e orçamento**, edite o glossário e os textos de abertura e “sobre mim”. O mesmo fluxo de tradução, proteção manual e revisão se aplica a esses textos.

### Ativar o serviço

No servidor, configure em `/opt/portfolio/.env`:

- `GEMINI_API_KEY`: chave do projeto Google usado para tradução.
- `I18N_SYNC_TOKEN`: segredo aleatório dedicado, compartilhado somente com ferramentas de desenvolvimento autorizadas.
- `I18N_USD_BRL_RATE`: cotação conservadora em BRL por USD; padrão `7`.

Em desenvolvimento, configure `I18N_GATEWAY_URL=https://previa.fernandagabriela.com` e `I18N_SYNC_TOKEN` em `backend/.env`. A API local e o comando de catálogos enviam traduções ao backend de produção. Somente produção usa a chave Gemini; desenvolvimento não possui um orçamento separado. O gateway também centraliza o glossário e a consulta do orçamento. Os tokens nunca vão para o navegador. A rota autenticada `/api/i18n/*` deve alcançar a API através do proxy de produção; `/api/internal/*` continua restrita às operações no servidor.

Após atualizar a API de produção, faça um backup e preencha as traduções do conteúdo existente:

```sh
docker compose --env-file deploy/.env -f deploy/compose.yml exec -T api npm run backup
docker compose --env-file deploy/.env -f deploy/compose.yml exec -T api npm run i18n:backfill
```

O comando prepara revisões retomáveis, incluindo itens privados, sem traduzir nem publicar automaticamente. Abra cada item no painel para gerar e revisar as propostas. `/api/i18n/ready` informa se todos os itens públicos têm tradução publicada. Enquanto houver conteúdo público sem tradução, a API inglesa responde 503 e `/en` mostra indisponibilidade, sem apresentar uma lista parcial. Não há tradução durante visitas ao site.

A primeira visita oferece escolha confirmada de idioma, sugerida pelo navegador e lembrada por um ano. `/` é português e `/en` é inglês; a preferência do visitante é independente da interface administrativa. O link no cabeçalho preserva busca e âncora ao mudar de idioma.

### Orçamento

O saldo pré-pago do Google é administrado no AI Studio; o orçamento abaixo é um controle separado e não faz pagamentos ou recargas.

O teto reservado é **R$105 por ciclo de 12 meses**, iniciado na primeira chamada paga: **R$84 para a estimativa de API**, com **R$21 de margem para câmbio e taxas**. A aplicação reserva uma estimativa conservadora antes de enviar cada chamada e bloqueia chamadas que ultrapassem o saldo. O cálculo usa US$1,50 por milhão de tokens de entrada e US$7,50 por milhão de saída, incluindo raciocínio, inclusive durante tarifas promocionais. Não há fallback para outro modelo nem tentativas automáticas cobradas. Falhas de rede com cobrança incerta conservam a reserva. Cache idêntico não consome saldo; mudanças de glossário invalidam o cache.

O banco registra cotação e consumo por chamada, tanto do painel quanto do desenvolvimento, catálogos e migração. Restaurar um backup preserva o consumo do banco atual. Ao recuperar um servidor totalmente perdido, recupere também o histórico de consumo mais recente antes de habilitar traduções. O teto da aplicação é uma estimativa conservadora; a cobrança real do Google depende da tarifa e conversão efetivas. Revise a cotação/tarifa quando mudarem e mantenha a chave dedicada a este serviço.

### Catálogos do código

`packages/i18n` concentra os idiomas, regras de campos, catálogos e textos iniciais. `frontend/src/i18n/*.json` são cópias verificadas para o bundle do Next. Use `ui("texto de origem")` nos componentes; não escreva novos textos visíveis diretamente no JSX.

```sh
npm run i18n:sync
npm run i18n:sync -- --from=en-US
npm run i18n:check
```

O sync extrai novas mensagens, traduz somente as ausentes ou alteradas através do gateway de produção e preserva traduções editadas manualmente. Para textos com valores variáveis, use `ui("Projeto {0} de {1}", { 0: atual, 1: total })`. Os placeholders são verificados. Se uma tradução manual ficou pendente após mudança no original, revise os catálogos e execute `npm run i18n:sync -- --accept-reviewed`. Esse comando confirma a revisão de todas as pendências manuais, sem sobrescrevê-las.

A CI verifica chaves, placeholders, textos JSX não extraídos e cópias geradas. Os testes de integração usam tradutor simulado e não geram custos reais.
