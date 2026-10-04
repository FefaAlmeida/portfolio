import sharp from "sharp";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { fileTypeFromFile } from "file-type";
import { now } from "./db.js";

const exec = promisify(execFile);
export const DEFAULT_COLOR = "#f4eee1";
const invalid = (message) => Object.assign(new Error(message), { status: 400 });

export async function detectBackground(input) {
  const { data, info } = await sharp(input, { limitInputPixels: 40_000_000 })
    .autoOrient()
    .resize(128, 128, { fit: "inside", withoutEnlargement: true })
    .toColourspace("srgb")
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const border = Math.max(
    1,
    Math.round(Math.min(info.width, info.height) * 0.1),
  );
  const buckets = new Map();
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (
        x >= border &&
        y >= border &&
        x < info.width - border &&
        y < info.height - border
      )
        continue;
      const i = (y * info.width + x) * 4;
      if (data[i + 3] < 128) continue;
      const rgb = [data[i], data[i + 1], data[i + 2]];
      const key = rgb.map((v) => v >> 4).join(",");
      const bucket = buckets.get(key) || { count: 0, sum: [0, 0, 0] };
      bucket.count++;
      rgb.forEach((v, channel) => {
        bucket.sum[channel] += v;
      });
      buckets.set(key, bucket);
    }
  }
  const winner = [...buckets.values()].sort((a, b) => b.count - a.count)[0];
  return winner
    ? `#${winner.sum
        .map((v) =>
          Math.round(v / winner.count)
            .toString(16)
            .padStart(2, "0"),
        )
        .join("")}`
    : DEFAULT_COLOR;
}

export async function processMedia(file) {
  const type = await fileTypeFromFile(file.path).catch(() => null);
  if (
    !type ||
    ![
      "image/jpeg",
      "image/png",
      "image/webp",
      "video/mp4",
      "video/webm",
    ].includes(type.mime)
  )
    throw invalid("Use JPEG, PNG, WebP, MP4 ou WebM.");
  const video = type.mime.startsWith("video/");
  if (file.size > (video ? 100 : 10) * 1024 * 1024)
    throw invalid(`O arquivo deve ter no máximo ${video ? 100 : 10} MB.`);
  let posterPath;
  try {
    if (video) {
      const { stdout } = await exec(
        "ffprobe",
        [
          "-v",
          "error",
          "-protocol_whitelist",
          "file,pipe",
          "-select_streams",
          "v:0",
          "-show_streams",
          "-of",
          "json",
          file.path,
        ],
        { timeout: 30_000, maxBuffer: 1024 * 1024 },
      );
      const stream = JSON.parse(stdout).streams?.[0];
      const codecs = type.mime === "video/mp4" ? ["h264"] : ["vp8", "vp9"];
      if (
        !stream ||
        !codecs.includes(stream.codec_name) ||
        !["yuv420p", "yuvj420p"].includes(stream.pix_fmt) ||
        stream.width * stream.height > 40_000_000
      )
        throw invalid(
          "Vídeo incompatível. Exporte MP4 com H.264 ou WebM com VP8/VP9, em 8 bits (4:2:0).",
        );
      posterPath = `${file.path}.png`;
      await exec(
        "ffmpeg",
        [
          "-v",
          "error",
          "-nostdin",
          "-protocol_whitelist",
          "file,pipe",
          "-i",
          file.path,
          "-map",
          "0:v:0",
          "-frames:v",
          "1",
          "-threads",
          "1",
          posterPath,
        ],
        { timeout: 60_000, maxBuffer: 1024 * 1024 },
      );
    }
    const corAutomatica = await detectBackground(posterPath || file.path);
    return { mime: type.mime, posterPath, corAutomatica };
  } catch (error) {
    if (error.status) throw error;
    if (error.code === "ENOENT")
      throw new Error("FFmpeg/FFprobe não estão disponíveis no servidor.");
    throw invalid(
      video
        ? "Não foi possível ler o primeiro frame do vídeo. Confira o arquivo e tente novamente."
        : "Não foi possível ler a imagem. Confira o arquivo e tente novamente.",
    );
  }
}

export async function storeProjectMedia(db, storage, file) {
  const processed = await processMedia(file);
  const saved = [];
  const rows = [];
  async function store(filename, mime, name, metadata = null) {
    const id = randomUUID();
    const size = (await fs.stat(filename)).size;
    const digest = createHash("sha256");
    for await (const chunk of createReadStream(filename)) digest.update(chunk);
    // Include even an uncertain write in rollback: an interrupted response may have stored the object.
    saved.push(id);
    if (storage.putFile) await storage.putFile(id, filename, mime, size);
    else await storage.put(id, await fs.readFile(filename), mime);
    rows.push([
      id,
      id,
      name.slice(0, 255),
      mime,
      size,
      digest.digest("hex"),
      now(),
      metadata && JSON.stringify(metadata),
    ]);
    return id;
  }
  try {
    const posterId = processed.posterPath
      ? await store(
          processed.posterPath,
          "image/png",
          `Primeiro frame — ${file.originalname}`,
        )
      : null;
    const assetId = await store(file.path, processed.mime, file.originalname, {
      posterId,
      corAutomatica: processed.corAutomatica,
    });
    db.transaction(() => {
      const insert = db.prepare(
        "INSERT INTO assets(id,object_key,name,mime,size,sha256,created_at,metadata) VALUES(?,?,?,?,?,?,?,?)",
      );
      for (const row of rows) insert.run(...row);
    })();
    return assetId;
  } catch (error) {
    await Promise.allSettled(saved.map((id) => storage.remove(id)));
    throw error;
  }
}

// Runs before accepting traffic; metadata is idempotent and doesn't change editorial colors.
export async function initializeMediaMetadata(db, storage) {
  const ids = new Set();
  for (const row of db
    .prepare("SELECT draft,published FROM entries WHERE kind IN ('projetos','experiencias')")
    .all()) {
    for (const json of [row.draft, row.published].filter(Boolean)) {
      const payload = JSON.parse(json);
      for (const media of payload.midias || []) ids.add(media.assetId);
      if (payload.imagemId) ids.add(payload.imagemId);
      if (payload.imagemSecundariaId) ids.add(payload.imagemSecundariaId);
    }
  }
  for (const id of ids) {
    const asset = db.prepare("SELECT * FROM assets WHERE id=?").get(id);
    if (!asset || asset.metadata || !asset.mime.startsWith("image/")) continue;
    const corAutomatica = await detectBackground(
      await storage.get(asset.object_key),
    );
    db.prepare("UPDATE assets SET metadata=? WHERE id=?").run(
      JSON.stringify({ corAutomatica }),
      id,
    );
  }
}
