import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(path.join(root, 'frontend/package.json'));
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const dir = path.join(root, 'packages/i18n/catalogs');
const read = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));
const save = (file, value) => fs.writeFile(file, JSON.stringify(value, null, 2) + '\n');
const digest = (value) => createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');
const catalogs = Object.fromEntries(await Promise.all(['pt-BR','en-US'].map(async locale => [locale, await read(path.join(dir, `${locale}.json`))])));
const stateFile = path.join(dir, 'state.json');
const state = await read(stateFile).catch(() => ({}));
const command = process.argv[2] || 'check';
const from = process.argv.includes('--from=en-US') ? 'en-US' : 'pt-BR';
const to = from === 'pt-BR' ? 'en-US' : 'pt-BR';
const referenced = new Set();
const hardcoded = [];
const allowed = new Set(['Fernanda', 'Fernanda.', 'Fernanda Gabriela', 'F', 'Português', 'English']);
const messageModule = parse(await fs.readFile(path.join(root, 'frontend/src/i18n/messages.js'), 'utf8'), { sourceType: 'module' });
function collectStaticValues(node) {
  if (node?.type === 'StringLiteral') referenced.add(node.value);
  else if (node?.type === 'ArrayExpression') node.elements.forEach(collectStaticValues);
  else if (node?.type === 'ObjectExpression') node.properties.forEach((property) => collectStaticValues(property.value));
}
traverse(messageModule, { VariableDeclarator(p) { if (p.node.id.name === 'sources') collectStaticValues(p.node.init); } });
function collectMessage(node) {
  if (node?.type === 'StringLiteral') referenced.add(node.value);
  if (node?.type === 'ConditionalExpression') { collectMessage(node.consequent); collectMessage(node.alternate); }
}
for (const folder of ['components', 'app']) for (const entry of await fs.readdir(path.join(root, 'frontend/src', folder), { recursive: true })) {
  if (!entry.endsWith('.jsx')) continue;
  const filename = path.join(root, 'frontend/src', folder, entry);
  const ast = parse(await fs.readFile(filename, 'utf8'), { sourceType: 'module', plugins: ['jsx'] });
  traverse(ast, {
    CallExpression(p) {
      if (p.node.callee.name === 'ui') collectMessage(p.node.arguments[0]);
    },
    JSXText(p) {
      const value = p.node.value.replace(/\s+/g, ' ').trim();
      if (/[a-zA-ZÀ-ÿ]/.test(value) && !allowed.has(value)) hardcoded.push(`${entry}:${p.node.loc.start.line}: ${value}`);
    },
    JSXAttribute(p) {
      if (['aria-label','title','placeholder','alt','label'].includes(p.node.name.name) && p.node.value?.type === 'StringLiteral') {
        const value = p.node.value.value;
        if (value && !allowed.has(value)) hardcoded.push(`${entry}:${p.node.loc.start.line}: ${value}`);
      }
    },
  });
}
const errors = [...hardcoded];
if (command === 'sync') {
  for (const key of referenced) if (!(key in catalogs['pt-BR']) && !(key in catalogs['en-US'])) catalogs[from][key] = key;
  const jobs = [];
  for (const key of new Set([...Object.keys(catalogs['pt-BR']), ...Object.keys(catalogs['en-US'])])) {
    const previous = state[key];
    const sourceLocale = previous?.sourceLocale || (key in catalogs[from] ? from : to);
    const targetLocale = sourceLocale === 'pt-BR' ? 'en-US' : 'pt-BR';
    const source = catalogs[sourceLocale][key];
    const target = catalogs[targetLocale][key];
    if (typeof source !== 'string') { errors.push(`Missing source: ${key}`); continue; }
    const manual = previous?.manual || (previous && previous.targetHash !== digest(target));
    if (target !== undefined && previous?.sourceHash === digest(source)) {
      state[key] = { ...previous, targetHash: digest(target), manual: Boolean(manual) }; continue;
    }
    if (manual) {
      if (process.argv.includes('--accept-reviewed')) state[key] = { sourceLocale, sourceHash: digest(source), targetHash: digest(target), manual: true };
      else errors.push(`Manual translation needs review: ${key}. Review it, then use --accept-reviewed.`);
      continue;
    }
    if (!previous && target !== undefined) {
      state[key] = { sourceLocale, sourceHash: digest(source), targetHash: digest(target), manual: false }; continue;
    }
    jobs.push({ key, source, sourceLocale, targetLocale });
  }
  if (errors.length) throw new Error(errors.join('\n'));
  for (const sourceLocale of ['pt-BR','en-US']) {
    const batch = jobs.filter(job => job.sourceLocale === sourceLocale);
    if (!batch.length) continue;
    const url = process.env.I18N_GATEWAY_URL;
    const token = process.env.I18N_SYNC_TOKEN;
    if (!url?.startsWith('https://') || !token) throw new Error('Configure I18N_GATEWAY_URL (HTTPS production URL) and I18N_SYNC_TOKEN.');
    // Small batches keep the same 30-second deadline used by the editor.
    for (let offset = 0; offset < batch.length; offset += 40) {
      const group = batch.slice(offset, offset + 40);
      const response = await fetch(`${url.replace(/\/$/, '')}/api/i18n/translate`, {
        method:'POST', headers: { 'content-type':'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ units: group.map(job => job.source), from: sourceLocale, to: group[0].targetLocale }), signal: AbortSignal.timeout(30000),
      });
      const result = await response.json();
      if (!response.ok || result.units?.length !== group.length) throw new Error(result.error || 'Translation failed');
      group.forEach((job,index) => {
        catalogs[job.targetLocale][job.key] = result.units[index];
        state[job.key] = { sourceLocale, sourceHash: digest(job.source), targetHash: digest(result.units[index]), manual: false };
      });
    }
  }
  for (const [locale, catalog] of Object.entries(catalogs)) await save(path.join(dir, `${locale}.json`), catalog);
  await save(stateFile, state);
  for (const [locale, catalog] of Object.entries(catalogs)) await save(path.join(root, 'frontend/src/i18n', `${locale}.json`), catalog);
}
const placeholders = value => [...value.matchAll(/\{\w+\}/g)].map(match => match[0]).sort().join(',');
for (const key of new Set([...referenced, ...Object.keys(catalogs['pt-BR']), ...Object.keys(catalogs['en-US'])])) {
  const pt = catalogs['pt-BR'][key], en = catalogs['en-US'][key];
  if (typeof pt !== 'string' || typeof en !== 'string' || !pt.trim() || !en.trim()) errors.push(`Missing translation: ${key}`);
  else if (placeholders(pt) !== placeholders(en)) errors.push(`Placeholder mismatch: ${key}`);
  const prior = state[key];
  if (prior && prior.sourceHash !== digest(catalogs[prior.sourceLocale][key])) errors.push(`Stale translation: ${key}`);
}
for (const locale of ['pt-BR','en-US']) {
  const generated = await read(path.join(root, 'frontend/src/i18n', `${locale}.json`));
  if (JSON.stringify(generated) !== JSON.stringify(catalogs[locale])) errors.push(`Generated ${locale} catalog is stale. Run npm run i18n:sync.`);
}
const defaults = await fs.readFile(path.join(root,'packages/i18n/default-site.json'),'utf8');
if (defaults !== await fs.readFile(path.join(root,'frontend/src/i18n/default-site.json'),'utf8')) errors.push('Default site copy is stale.');
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`i18n: ${Object.keys(catalogs['pt-BR']).length} messages have PT/EN parity.`);
