# Landing V3

Abra `index.html` diretamente ou acesse `/demos/landing-v3/index.html` no servidor do portfólio. V1 e V2 permanecem disponíveis para comparação.

HTML estático + Tailwind compilado, CSS e JavaScript locais. Sem API ou CDN.

## Direção visual

- Abertura tipográfica horizontal, com apresentação e ações reunidas.
- Foto ao lado dos três parágrafos completos do Sobre mim. Sem repetir nome, escola ou curso na biografia.
- Educação em uma faixa própria: Técnico em Desenvolvimento de Sistemas, SENAI São Caetano do Sul, Jan 2025 – Dez 2026.
- Projetos preservados: mesmo HTML, CSS, conteúdo, carrossel e modais da V2 aprovada.
- Extracurriculares em linha do tempo com índice numerado, categorias originais, datas com calendário e fotos alternadas em molduras. Textos completos com KPIs em negrito nos parágrafos (+50 alunos no MatMov e +15 textos publicados no VAF), sem faixa separada de resultados. Os números sobem uma vez ao entrar na tela; com movimento reduzido ou sem JavaScript, os valores finais permanecem disponíveis. No celular, índice em duas colunas e experiências empilhadas; fotos preservadas sem cortes.
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
