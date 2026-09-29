# Demo — Fernanda Monteiro

Abra `index.html` diretamente no navegador ou acesse `/demos/landing/index.html` no servidor do portfólio.

HTML estático, Tailwind CSS compilado localmente, CSS de identidade e JavaScript sem dependências de runtime. Imagens e fonte locais; não exige API nem CDN. A demo não altera a landing page principal.

## Interações

- Menu mobile, navegação por seção e modo escuro persistente.
- Detalhes de projetos com diálogo acessível e URL compartilhável (`#projeto-lector-hub`, por exemplo).
- Carrossel e modais originais dos projetos; linha do tempo original dos projetos extracurriculares. Reconhecimentos expansíveis.
- Formulário demonstrativo que copia uma mensagem. Não envia dados nem inventa um endereço de contato.
- Conteúdo e links das duas seções restauradas preservados como na página original, incluindo os links provisórios das experiências.

## Recompilar Tailwind

A partir de `frontend`, execute:

```sh
node public/demos/landing/build.mjs
```

`tailwind.input.css` é a entrada, `tailwind.css` é a saída versionada. Não precisa compilar para abrir a demo.

## Conteúdo antes da publicação

Adicionar e-mail de contato, credenciais e URLs oficiais das iniciativas. Projetos e experiências usam cópias locais do HTML, estilos, fontes e mídias da página original. Configurar URL absoluta da imagem Open Graph e canonical com o domínio final. A demo está em português; a versão inglesa continua disponível na aplicação original.
