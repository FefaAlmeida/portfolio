// Preview: node scripts/repair-bold.js [database]
// Apply: stop the API, then node scripts/repair-bold.js [database] --apply
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { databaseLease } from "../src/lease.js";
import { planBoldRecovery, applyBoldRecovery } from "../src/bold-recovery.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const filename = path.resolve(process.argv.slice(2).find(arg => !arg.startsWith("--")) || path.join(root, "data/portfolio.sqlite"));
const apply = process.argv.includes("--apply");
const manifest = JSON.parse(await fs.readFile(path.join(root, "seed/bold-recovery.json"), "utf8"));
const release = apply ? await databaseLease(filename) : null;
let db;
try {
  db = new Database(filename, { readonly: !apply, fileMustExist: true });
  const plan = planBoldRecovery(db, manifest);
  console.log(JSON.stringify({ mode: apply ? "apply" : "preview", changes: plan.changes.map(({ id, column }) => ({ id, column })), unresolved: plan.audit }, null, 2));
  if (apply && plan.changes.length) {
    const folder = path.join(path.dirname(filename), "backups");
    await fs.mkdir(folder, { recursive: true });
    const backup = path.join(folder, `before-bold-repair-${Date.now()}.sqlite`);
    await db.backup(backup);
    await fs.chmod(backup, 0o600);
    applyBoldRecovery(db, plan);
    console.log(`Recuperação concluída. Backup: ${backup}`);
  }
} finally {
  db?.close();
  await release?.();
}
