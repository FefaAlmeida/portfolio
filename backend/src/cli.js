import { databaseLease } from "./lease.js";
import Database from "better-sqlite3";
import { configuration } from "./config.js";
import { openDatabase } from "./db.js";
import { createStorage } from "./storage.js";
import { restoreBackup } from "./backup.js";
const config = configuration();
const [command, ...args] = process.argv.slice(2);
async function password() {
  process.stderr.write("Senha (mínimo 12 caracteres): ");
  if (!process.stdin.isTTY) {
    let text = "";
    for await (const chunk of process.stdin) text += chunk;
    return text.trimEnd();
  }
  return new Promise((resolve, reject) => {
    let value = "";
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    const done = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener("data", handler);
      process.stderr.write("\n");
    };
    const handler = (data) => {
      for (const c of data) {
        if (c === "\u0003") {
          done();
          reject(new Error("Cancelado."));
          return;
        }
        if (c === "\r" || c === "\n") {
          done();
          resolve(value);
          return;
        }
        if (c === "\u007f") value = value.slice(0, -1);
        else if (c >= " ") value += c;
      }
    };
    process.stdin.on("data", handler);
  });
}
async function internal(action, body = {}) {
  if (!config.operationsToken) throw new Error("Configure OPERATIONS_TOKEN.");
  const response = await fetch(
    `${process.env.API_BASE_URL || "http://127.0.0.1:3001"}/api/internal/${action}`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.operationsToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "A operação falhou.");
  console.log(JSON.stringify(result, null, 2));
}
try {
  if (command === "admin")
    await internal("admin", { email: args[0], password: await password() });
  else if (command === "seed" || command === "backup") await internal(command);
  else if (command === "i18n:backfill") {
    for (;;) {
      if (!config.operationsToken) throw new Error("Configure OPERATIONS_TOKEN.");
      const response = await fetch(`${process.env.API_BASE_URL || "http://127.0.0.1:3001"}/api/internal/i18n/backfill`, {
        method: "POST",
        headers: { authorization: `Bearer ${config.operationsToken}`, "content-type": "application/json" },
        body: "{}",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (result.done) break;
      console.log(`Traduzido: ${result.id}`);
    }
  }
  else if (command === "compatible") {
    const db = new Database(config.database, {
      readonly: true,
      fileMustExist: true,
    });
    try {
      if (
        db.prepare("SELECT MAX(version) AS version FROM migrations").get()
          .version > 8
      )
        throw new Error("O banco exige uma versão mais recente da aplicação.");
    } finally {
      db.close();
    }
  } else if (command === "migrate") {
    const release = await databaseLease(config.database);
    try {
      const db = openDatabase(config.database);
      db.close();
    } finally {
      await release();
    }
    console.log("Migrações concluídas.");
  } else if (command === "restore") {
    if (!args[0] || !args.includes("--confirm"))
      throw new Error(
        "Pare a API e use: npm run restore -- /caminho/do/snapshot --confirm",
      );
    let reachable = false;
    try {
      await fetch(
        `${process.env.API_BASE_URL || "http://127.0.0.1:3001"}/api/health`,
        { signal: AbortSignal.timeout(2000) },
      );
      reachable = true;
    } catch {}
    if (reachable)
      throw new Error("Pare o container/processo da API antes de restaurar.");
    const release = await databaseLease(config.database);
    const storage = createStorage(config.s3);
    try {
      await storage.initialize();
      await restoreBackup(args[0], storage, config.database);
      console.log(
        "Restauração concluída. Sessões anteriores foram invalidadas.",
      );
    } finally {
      storage.close();
      await release();
    }
  } else throw new Error("Comando desconhecido.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
