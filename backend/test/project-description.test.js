import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { openDatabase } from '../src/db.js';
import { migrateProjectDescription, migrateProjectRole } from '../src/project-payload.js';
import { schemas } from '../src/schema.js';
const doc = (text) => ({type: 'doc', content: [{type: 'paragraph', content: [{type: 'text', text, marks: [{type: 'bold'}]}]}]});
test('preserves existing presentation and rich formatting, with legacy narrative fallback', () => {
  const existing = {descricao: doc('Apresentação antiga'), pitch: 'Resumo'};
  assert.deepEqual(migrateProjectDescription(existing), existing);
  const legacy = {pitch: 'Resumo', solucao: doc('Solução'), detalhes: {diferencial: doc('Diferencial')}};
  const migrated = migrateProjectDescription(legacy);
  assert.equal(migrated.descricao.content.length, 3);
  assert.deepEqual(migrated.descricao.content[1], legacy.solucao.content[0]);
  assert.deepEqual(migrateProjectDescription(migrated), migrated);
});
test('migration preserves independent draft and published presentations and runs only once', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'description-migration-'));
  let db;
  try {
    const filename = path.join(dir, 'test.sqlite');
    db = openDatabase(filename);
    db.prepare('DELETE FROM migrations WHERE version = 3').run();
    const draft = {descricao: doc('Rascunho'), pitch: 'Resumo antigo'};
    const published = {pitch: 'Apresentação publicada', solucao: doc('Solução')};
    db.prepare("INSERT INTO entries(id,kind,position,draft,published,updated_at) VALUES('project','projetos',0,?,?,?)").run(JSON.stringify(draft), JSON.stringify(published), new Date().toISOString());
    db.close();
    db = openDatabase(filename);
    const row = db.prepare('SELECT * FROM entries').get();
    assert.deepEqual(JSON.parse(row.draft), draft);
    assert.deepEqual(JSON.parse(row.published), migrateProjectDescription(published));
    db.close();
    db = openDatabase(filename);
    assert.deepEqual(db.prepare('SELECT * FROM entries').get(), row);
  } finally {
    db?.close();
    rmSync(dir, {recursive: true, force: true});
  }
});

test('role migration preserves rich text and avoids duplicating a role already in the description', () => {
  const original = {papel: 'Designer', descricao: doc('Uma descrição personalizada')};
  const migrated = migrateProjectRole(original);
  assert.equal(Object.hasOwn(migrated, 'papel'), false);
  assert.deepEqual(migrated.descricao.content[0].content[1], original.descricao.content[0].content[0]);
  assert.match(migrated.descricao.content[0].content[0].text, /^Como Designer,/);
  assert.deepEqual(migrateProjectRole(migrated), migrated);
  assert.equal(original.descricao.content[0].content.length, 1);
  const existing = doc('Como Desenvolvedora Fullstack, atuei na construção da plataforma.');
  assert.deepEqual(migrateProjectRole({papel: 'Desenvolvedora Full-Stack', descricao: existing}), {descricao: existing});
  const empty = migrateProjectRole({papel: 'Designer'});
  assert.match(empty.descricao.content[0].content[0].text, /^Como Designer,/);
});

test('old project submissions migrate the role while new submissions omit it', () => {
  const legacy = schemas.projetos.parse({titulo: 'Projeto', papel: 'Designer', descricao: doc('Descrição')});
  assert.equal(Object.hasOwn(legacy, 'papel'), false);
  assert.match(legacy.descricao.content[0].content[0].text, /^Como Designer,/);
  assert.equal(Object.hasOwn(schemas.projetos.parse({titulo: 'Novo'}), 'papel'), false);
  assert.equal(schemas.experiencias.parse({titulo: 'Experiência', papel: 'Voluntária'}).papel, 'Voluntária');
});

test('role migration updates draft and published independently, preserves private entries and leaves experiences intact', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'role-migration-'));
  let db;
  try {
    const filename = path.join(dir, 'test.sqlite');
    db = openDatabase(filename);
    db.prepare('DELETE FROM migrations WHERE version = 4').run();
    const draft = {papel: 'Designer', descricao: doc('Rascunho')};
    const published = {papel: 'Programadora', descricao: doc('Publicado')};
    const insert = db.prepare('INSERT INTO entries(id,kind,position,draft,published,updated_at) VALUES(?,?,0,?,?,?)');
    insert.run('project', 'projetos', JSON.stringify(draft), JSON.stringify(published), 'original');
    insert.run('private', 'projetos', JSON.stringify(draft), null, 'original');
    insert.run('experience', 'experiencias', JSON.stringify(draft), null, 'original');
    db.close();
    db = openDatabase(filename);
    const rows = db.prepare('SELECT * FROM entries ORDER BY id').all();
    const project = rows.find(row => row.id === 'project');
    assert.deepEqual(JSON.parse(project.draft), migrateProjectRole(draft));
    assert.deepEqual(JSON.parse(project.published), migrateProjectRole(published));
    assert.equal(project.revision, 2);
    assert.equal(rows.find(row => row.id === 'private').published, null);
    assert.deepEqual(JSON.parse(rows.find(row => row.id === 'experience').draft), draft);
    db.close();
    db = openDatabase(filename);
    assert.deepEqual(db.prepare('SELECT * FROM entries ORDER BY id').all(), rows);
  } finally {
    db?.close();
    rmSync(dir, {recursive: true, force: true});
  }
});
