import { test } from 'node:test';
import assert from 'node:assert/strict';
import { schemas, serializePayload } from '../src/schema.js';
import { openDatabase, assetIds, referencedAssets } from '../src/db.js';
import { reconcileEntry } from '../src/translate.js';
import { initializeMediaMetadata } from '../src/media.js';
import sharp from 'sharp';

test('experience fields are optional and reject unsafe links and excess results', () => {
  const legacy = schemas.experiencias.parse({ titulo: 'Legacy' });
  assert.deepEqual(legacy.resultados, []);
  assert.equal(legacy.imagemDupla, false);
  assert.throws(() => schemas.experiencias.parse({ titulo: 'Bad', resultados: ['1', '2', '3', '4'] }));
  assert.throws(() => schemas.experiencias.parse({ titulo: 'Bad', siteUrl: 'javascript:alert(1)' }));
});

test('experience media extracts background and retains secondary images', async (t) => {
  const db = openDatabase(':memory:'); t.after(() => db.close());
  const ids = ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222'];
  const buffer = await sharp({ create: { width: 16, height: 16, channels: 3, background: '#f8f8f8' } }).png().toBuffer();
  for (const id of ids) db.prepare('INSERT INTO assets(id,object_key,name,mime,size,sha256,created_at) VALUES(?,?,?,\'image/png\',1,\'hash\',\'now\')').run(id,id,'photo.png');
  const payload = schemas.experiencias.parse({ titulo: 'Experience', imagemId: ids[0], imagemSecundariaId: ids[1], imagemDupla: true });
  db.prepare("INSERT INTO entries(id,kind,position,draft,published,updated_at) VALUES('exp','experiencias',0,?,?,'now')").run(JSON.stringify(payload), JSON.stringify(payload));
  await initializeMediaMetadata(db, { get: async () => buffer });
  const output = serializePayload(payload, db);
  assert.equal(output.imagemBg, '#f8f8f8');
  assert.equal(output.imagemSecundariaUrl, `/api/media/${ids[1]}`);
  assert.deepEqual(assetIds(payload), ids);
  assert.ok(referencedAssets(db, true).has(ids[1]));
});

test('experience links and collage synchronize without translating English results', async () => {
  const pt = schemas.experiencias.parse({ titulo: 'Projeto', resultados: ['4 exposições'], imagemLegenda: 'Registro', siteUrl: 'https://example.com/old' });
  const en = { ...pt, titulo: 'Project', resultados: ['4 exhibitions'], imagemLegenda: 'Photo' };
  const updated = await reconcileEntry({ kind: 'experiencias', sourceLocale: 'pt-BR', editedLocale: 'pt-BR', oldPt: pt, oldEn: en, newPayload: { ...pt, siteUrl: 'https://example.com/new', imagemDupla: true }, translate: () => { throw new Error('Should not translate shared fields'); } });
  assert.equal(updated.en.siteUrl, 'https://example.com/new');
  assert.equal(updated.en.imagemDupla, true);
  assert.deepEqual(updated.en.resultados, ['4 exhibitions']);
  assert.equal(updated.en.imagemLegenda, 'Photo');
});
