// Run once, with the API stopped, after restoring the initial snapshot:
// docker compose run --rm --no-deps -T --entrypoint node api --input-type=module < prepare-preview.mjs
import { openDatabase } from './src/db.js';
import { databaseLease } from './src/lease.js';
const release = await databaseLease(process.env.DATABASE_PATH);
const db = openDatabase(process.env.DATABASE_PATH);
try {
  if (db.prepare("SELECT 1 FROM translation_reviews WHERE subject='projetos:luminar'").get())
    throw new Error('Finish the Luminar review before changing its media.');
  const row = db.prepare("SELECT draft,published FROM entries WHERE id='luminar' AND kind='projetos'").get();
  if (!row) throw new Error('Luminar not found');
  const onlyCover = raw => {
    if (!raw) return null;
    const data = JSON.parse(raw);
    const cover = data.midias?.find(media => media.assetId === data.capaId);
    const asset = cover && db.prepare('SELECT mime FROM assets WHERE id=?').get(cover.assetId);
    if (!asset?.mime.startsWith('image/')) throw new Error('An existing image cover is required');
    data.midias = [cover];
    return JSON.stringify(data);
  };
  db.transaction(() => {
    db.prepare("UPDATE entries SET draft=?,published=?,revision=revision+1 WHERE id='luminar'")
      .run(onlyCover(row.draft), onlyCover(row.published));
    const target = db.prepare("SELECT draft_en,published_en FROM entry_i18n WHERE entry_id='luminar'").get();
    if (target) db.prepare("UPDATE entry_i18n SET draft_en=?,published_en=? WHERE entry_id='luminar'")
      .run(onlyCover(target.draft_en), onlyCover(target.published_en));
  })();
  console.log('Luminar uses only its existing image cover; original assets remain in the snapshot.');
} finally { db.close(); await release(); }
