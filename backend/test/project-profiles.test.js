import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { openDatabase } from "../src/db.js";
import { migrateProjectProfiles } from "../src/project-payload.js";
import { schemas } from "../src/schema.js";

const legacy = {
  titulo: "Biblioteca",
  detalhes: {
    tiposUsuarios: ["Administrador (Bibliotecário)", "Usuário Comum (Leitor)"],
    funcionalidadesAdmin: ["Gerenciar empréstimos"],
    funcionalidadesUsuario: ["Consultar catálogo"],
  },
};
test("legacy profiles retain names, categories and features, including unmatched labels", () => {
  const migrated = migrateProjectProfiles(legacy);
  assert.deepEqual(migrated.detalhes.perfis, [
    { categoria: "admin", nome: "Bibliotecário", funcionalidades: ["Gerenciar empréstimos"] },
    { categoria: "usuario", nome: "Leitor", funcionalidades: ["Consultar catálogo"] },
  ]);
  assert.deepEqual(migrateProjectProfiles(migrated), migrated);
  assert.equal(legacy.detalhes.tiposUsuarios.length, 2);
  assert.equal(Object.hasOwn(migrated.detalhes, "tiposUsuarios"), false);
  const unknown = migrateProjectProfiles({ detalhes: {
    tiposUsuarios: ["Equipe de apoio"], funcionalidadesAdmin: ["Revisar"],
  } });
  assert.deepEqual(unknown.detalhes.tiposUsuarios, ["Equipe de apoio"]);
  assert.deepEqual(unknown.detalhes.perfis, [{ categoria: "admin", nome: "", funcionalidades: ["Revisar"] }]);
  assert.deepEqual(migrateProjectProfiles({ titulo: "Sem perfis" }).detalhes.perfis, []);
});

test("schema accepts zero, one or two profiles and rejects duplicates, unknown categories and excess features", () => {
  const parse = (perfis) => schemas.projetos.safeParse({ titulo: "Teste", detalhes: { perfis } });
  const admin = { categoria: "admin", nome: "  Bibliotecário  ", funcionalidades: ["  Gerenciar  "] };
  const user = { categoria: "usuario", nome: "", funcionalidades: [] };
  assert.equal(parse([]).success, true);
  assert.equal(parse([user]).success, true);
  assert.deepEqual(parse([admin]).data.detalhes.perfis[0], { ...admin, nome: "Bibliotecário", funcionalidades: ["Gerenciar"] });
  assert.equal(parse([admin, user]).success, true);
  assert.equal(parse([admin, admin]).success, false);
  assert.equal(parse([admin, user, admin]).success, false);
  assert.equal(parse([{ categoria: "auxiliar" }]).success, false);
  assert.equal(parse([{ ...admin, funcionalidades: Array(61).fill("Item") }]).success, false);
  assert.equal(parse([{ ...admin, funcionalidades: ["x".repeat(501)] }]).success, false);
  assert.deepEqual(schemas.projetos.parse(legacy).detalhes.perfis, migrateProjectProfiles(legacy).detalhes.perfis);
  assert.equal(schemas.projetos.safeParse({ titulo: "Inválido", detalhes: { tiposUsuarios: [null] } }).success, false);
});

test("migration preserves independent drafts and publications, private entries, revisions and other kinds", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "profiles-migration-"));
  let db;
  try {
    const file = path.join(dir, "test.sqlite");
    db = openDatabase(file);
    db.prepare("DELETE FROM migrations WHERE version = 5").run();
    const published = { ...legacy, detalhes: { funcionalidadesUsuario: ["Publicado"] } };
    const insert = db.prepare("INSERT INTO entries(id,kind,position,draft,published,updated_at) VALUES(?,?,0,?,?,?)");
    insert.run("public", "projetos", JSON.stringify(legacy), JSON.stringify(published), "original");
    insert.run("private", "projetos", JSON.stringify(legacy), null, "original");
    insert.run("experience", "experiencias", JSON.stringify(legacy), null, "original");
    db.close();
    db = openDatabase(file);
    const rows = db.prepare("SELECT * FROM entries ORDER BY id").all();
    const project = rows.find((row) => row.id === "public");
    assert.deepEqual(JSON.parse(project.draft), migrateProjectProfiles(legacy));
    assert.deepEqual(JSON.parse(project.published), migrateProjectProfiles(published));
    assert.equal(project.revision, 2);
    assert.equal(rows.find((row) => row.id === "private").published, null);
    assert.deepEqual(JSON.parse(rows.find((row) => row.id === "experience").draft), legacy);
    db.close();
    db = openDatabase(file);
    assert.deepEqual(db.prepare("SELECT * FROM entries ORDER BY id").all(), rows);
  } finally {
    db?.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
