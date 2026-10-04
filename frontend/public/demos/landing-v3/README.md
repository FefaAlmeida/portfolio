# Landing V3

Abra `index.html` diretamente ou acesse `/demos/landing-v3/index.html` no servidor do portfólio. V1 e V2 permanecem disponíveis para comparação.

HTML estático + Tailwind compilado, CSS e JavaScript locais. Sem API ou CDN.

## Direção visual

- Abertura tipográfica horizontal, com apresentação e ações reunidas.
- Foto ao lado dos três parágrafos completos do Sobre mim. Sem repetir nome, escola ou curso na biografia.
- Educação em uma faixa própria: Técnico em Desenvolvimento de Sistemas, SENAI São Caetano do Sul, Jan 2025 – Dez 2026.
- Projetos preservados: mesmo HTML, CSS, conteúdo, carrossel e modais da V2 aprovada.
- Extracurriculares em cards translúcidos com datas acima dos títulos, fotos e textos alternados e conexões entre cards que chegam até cada data. Textos completos com KPIs em negrito nos parágrafos (+50 alunos no MatMov e +15 textos publicados no VAF), sem faixa separada de resultados. Os números sobem uma vez ao entrar na tela; com movimento reduzido ou sem JavaScript, os valores finais permanecem disponíveis. No celular, experiências empilhadas com as mesmas conexões e molduras consistentes.
- Reconhecimentos em seis cards com logos oficiais, carrossel no desktop e empilhamento no celular; rodapé compacto.

Modo escuro persistente, preferência inicial do sistema, menu mobile, navegação por teclado, foco restaurado ao fechar diálogos e respeito a movimento reduzido. Contatos não informados não foram inventados.

Para recompilar o Tailwind, execute a partir de `frontend`:

```sh
node public/demos/landing-v3/build.mjs
```

## Prêmios — revisão com logos

Seis cards, em ordem: OLITEF 2025, Letrus 2025, Avalia SESI 2025, Letrus 2024, Leitor Destaque 2025 e Destaque em Redação 2023. Os dois últimos usam SESI conforme confirmação da autora.

Três cards visíveis no carrossel desktop (a partir de 1024px), navegação circular e por teclado. Abaixo desse tamanho, os seis cards ficam empilhados. “Ver credencial” está desativado, sem links, conforme solicitado.

Logos oficiais salvas localmente, sem recoloração:
- Letrus: SVG do cabeçalho de https://www.letrus.com/
- OLITEF: https://www.olitef.com.br/ — arquivo original https://static.wixstatic.com/media/7b6a95_b4623191fbdc43c48d23c0bf6f6076ed~mv2.png
- SESI-SP: https://www.sesisp.org.br/images/Logo-SESI-SP.svg

## Refinamento de extracurriculares

- Cards com branco a 25% (24% no tema escuro), backdrop blur de 14px e sombra discreta. A transparência é aplicada apenas ao fundo.
- Conexões decorativas SVG passam pelos intervalos entre os cards e terminam no topo das datas, sem dividir imagem e texto. ResizeObserver mantém a geometria em telas diferentes.
- A moldura da logo do Vozes Além das Fronteiras é a referência de mídia: 4:3 no desktop, com o tamanho efetivo acompanhado em telas menores. A logo e seu enquadramento permanecem intactos.
- As quatro fotos usam cópias recortadas de 800 × 600 px; os arquivos originais foram preservados. A apresentação usa `contain`, sem um segundo crop no CSS.
- MatMov alterna automaticamente a cada 3 segundos enquanto visível. As setas e o contador foram removidos; a pausa sobre a imagem continua disponível. A reprodução respeita movimento reduzido e é suspensa quando a aba está oculta.

Recortes sobre os arquivos originais (x, y, largura, altura), seguidos de resize para 800 × 600 e JPEG com qualidade 92:

| Original | Recorte | Arquivo usado |
| --- | --- | --- |
| original-4.jpg | 0, 660, 3120, 2340 | assets/matmov-4x3.jpg |
| original-6.jpg | 0, 0, 864, 648 | assets/jornal-4x3.jpg |
| original-7.jpg | 72, 1, 1136, 852 | assets/casinha-4x3.jpg |
| original-8.jpg | 0, 240, 900, 675 | assets/juventudes-4x3.jpg |

Revisão orientada pelas skills [frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design) e [web-design-guidelines](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines).
