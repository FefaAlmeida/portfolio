// Run from frontend: node public/demos/landing/build.mjs
import { compile } from '@tailwindcss/node';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const base = dirname(fileURLToPath(import.meta.url));
const compiler = await compile(await readFile(resolve(base, 'tailwind.input.css'), 'utf8'), {base, onDependency() {}});
const source = await Promise.all(['index.html', 'script.js', 'original-dialogs.js'].map(name => readFile(resolve(base,name),'utf8')));
const candidates = source.join(' ').replaceAll('\\\"', '\"').match(/[^\s"'`<>]+/g) || [];
await writeFile(resolve(base,'tailwind.css'), compiler.build(candidates));
