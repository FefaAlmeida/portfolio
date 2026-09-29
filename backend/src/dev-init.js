// First-run provisioning for the local Docker environment only.
import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import Database from "better-sqlite3";
import { configuration } from "./config.js";

if (process.env.NODE_ENV !== "development")
  throw new Error(
    "Inicialização automática permitida apenas no ambiente local.",
  );
const config = configuration();
async function operation(name, body = {}) {
  const response = await fetch(
    `${process.env.API_BASE_URL || "http://api:3001"}/api/internal/${name}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.operationsToken}`,
      },
      body: JSON.stringify(body),
    },
  );
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error || `Falha na inicialização: ${name}`);
  return result;
}

const imported = await operation("seed");
console.log(
  imported.imported
    ? `${imported.count} itens importados.`
    : "Conteúdo existente preservado.",
);
const db = new Database(config.database, {
  readonly: true,
  fileMustExist: true,
});
let hasAdmin;
try {
  hasAdmin = Boolean(db.prepare("SELECT 1 FROM admin WHERE id=1").get());
} finally {
  db.close();
}
if (hasAdmin) {
  console.log("Conta administrativa existente preservada.");
} else {
  const email = "admin@portfolio.local";
  const password = randomBytes(24).toString("base64url");
  const filename = path.join(path.dirname(config.database), "local-admin.txt");
  // Persist the generated credentials before provisioning so they cannot be lost on interruption.
  await fs.writeFile(
    filename,
    `Acesso local: ${config.publicUrl}/admin\nE-mail: ${email}\nSenha: ${password}\n\nPara trocar e-mail/senha, na raiz do projeto: npm run admin -- seu-email@exemplo.com\n`,
    { mode: 0o600 },
  );
  await fs.chmod(filename, 0o600);
  await operation("admin", { email, password });
  console.log(
    "Conta local criada. Credenciais em backend/data/local-admin.txt.",
  );
}
