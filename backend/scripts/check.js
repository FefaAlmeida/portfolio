import fs from "node:fs/promises";
import { spawnSync } from "node:child_process";
let failed = false;
for (const directory of ["src", "test", "scripts"]) {
  for (const file of await fs.readdir(directory, { recursive: true })) {
    if (!file.endsWith(".js")) continue;
    const result = spawnSync(
      process.execPath,
      ["--check", `${directory}/${file}`],
      { stdio: "inherit" },
    );
    if (result.status !== 0) failed = true;
  }
}
process.exitCode = failed ? 1 : 0;
