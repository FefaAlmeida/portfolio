// Builds the standalone review page. Only the botanical PNG is AI-generated;
// portraits are the original JPEGs, positioned and cropped with CSS.
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { compile, optimize } from '@tailwindcss/node';
const frontend = fileURLToPath(new URL('../../../', import.meta.url));
const publicDir = new URL('../../', import.meta.url);
const demoDir = new URL('./', import.meta.url);
const photos = [
  { file: 'demos/sobre-mim/assets/imagem1.jpeg', label: 'Fernanda com um balão ao fundo', position: 'left-[43%] top-[5%] w-[45%] h-[33%]', crop: 'object-[47%_48%]' },
  { file: 'demos/sobre-mim/assets/imagem2.jpeg', label: 'Fernanda sorrindo, com roupa preta', position: 'left-[8%] top-[32%] w-[47%] h-[33%]', crop: 'object-[55%_38%]' },
  { file: 'foto_sobre_secundaria.jpeg', label: 'Fernanda sentada em um café', position: 'left-[43%] top-[61%] w-[47%] h-[33%]', crop: 'object-[57%_54%]' },
];
const dataUrl = async (file, mime) => `data:${mime};base64,${(await fs.readFile(new URL(file, publicDir))).toString('base64')}`;
const frames = photos.map((photo, index) => `<div data-polaroid="${index + 1}" class="absolute ${photo.position} bg-[#fffefa] p-[3px] pb-[7px] shadow-[0_3px_10px_#543e2820] sm:p-[4px] sm:pb-[9px]"><img data-photo="${index}" alt="${photo.label}" class="block size-full object-cover ${photo.crop}"></div>`).join('\n');
let html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Três memórias · Sakura</title><style>__CSS__</style></head>
<body class="bg-[#f4eee2] text-[#4b393d] antialiased"><main class="mx-auto max-w-[740px] px-4 pb-8 pt-7 sm:px-8 sm:pt-9"><header class="text-center"><p class="text-[10px] uppercase tracking-[.25em] text-[#a26980]">Polaroides / sakura</p><h1 class="mt-3 font-serif text-3xl sm:text-4xl">Três memórias em flor.</h1><p class="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[#887477]">Três fotos, molduras delicadas e os ramos de uma cerejeira ao redor.</p></header><figure aria-label="Três fotos reais em polaroides retas, com desenho de sakura ao redor" class="relative mx-auto mt-5 aspect-[2/3] w-full max-w-[570px] isolate"><img data-decoration alt="" aria-hidden="true" class="pointer-events-none absolute inset-0 size-full object-contain">${frames}</figure></main><script>const assets=__ASSETS__;document.querySelector('[data-decoration]').src=assets.tree;document.querySelectorAll('[data-photo]').forEach(img=>img.src=assets.photos[Number(img.dataset.photo)]);</script></body></html>`;
const candidates = [...html.matchAll(/class="([^"]+)"/g)].flatMap(match => match[1].split(/\s+/));
const compiler = await compile('@import "tailwindcss";', { base: frontend, onDependency() {} });
const css = optimize(compiler.build(candidates), { minify: true }).code;
const assets = {
  tree: await dataUrl('demos/sobre-mim/assets/decoracoes/sakura-botanica.png', 'image/png'),
  photos: await Promise.all(photos.map(photo => dataUrl(photo.file, 'image/jpeg'))),
};
html = html.replace('__CSS__', () => css).replace('__ASSETS__', () => JSON.stringify(assets));
await fs.writeFile(new URL('sakura-tres-fotos.html', demoDir), html);
console.log('Created frontend/public/demos/sobre-mim/sakura-tres-fotos.html');
