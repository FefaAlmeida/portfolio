import fs from "node:fs/promises";
import path from "node:path";
import lockfile from "proper-lockfile";
export async function databaseLease(filename) {
  await fs.mkdir(path.dirname(filename), { recursive: true, mode: 0o700 });
  try {
    return await lockfile.lock(filename, {
      realpath: false,
      retries: 0,
      stale: 60000,
      update: 15000,
    });
  } catch (error) {
    if (error.code === "ELOCKED")
      throw new Error(
        "O banco está em uso. Pare a API antes de migrar ou restaurar.",
      );
    throw error;
  }
}
