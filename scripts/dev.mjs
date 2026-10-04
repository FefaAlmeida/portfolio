import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const env = {
  ...process.env,
  LOCAL_UID: String(process.getuid?.() ?? 1000),
  LOCAL_GID: String(process.getgid?.() ?? 1000),
};

async function docker(...args) {
  await new Promise((resolve, reject) => {
    const child = spawn("docker", ["compose", ...args], {
      cwd: root,
      env,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code, signal) =>
      code === 0
        ? resolve()
        : reject(
            new Error(
              `Docker Compose terminou com ${signal || `código ${code}`}.`,
            ),
          ),
    );
  });
}

try {
  // Bind mount keeps existing SQLite data, backups and the current admin account.
  await mkdir(new URL("../backend/data/", import.meta.url), {
    recursive: true,
    mode: 0o700,
  });
  await docker("up", "--build", "--detach", "--wait", "--wait-timeout", "180");
  await docker("exec", "-T", "api", "node", "src/dev-init.js");
  console.log(
    "\nPortfólio: http://localhost:3000\nPainel: http://localhost:3000/admin",
  );
  console.log(
    "Credenciais locais: backend/data/local-admin.txt (quando geradas automaticamente).",
  );
  console.log("Código e textos de backend/seed/content.json são atualizados automaticamente na página local.");
  console.log("Logs: npm run dev:logs\nParar: npm run dev:down");
} catch (error) {
  console.error(`\nNão foi possível iniciar o portfólio: ${error.message}`);
  console.error(
    "Confira Docker/portas disponíveis e consulte: npm run dev:logs",
  );
  process.exitCode = 1;
}
