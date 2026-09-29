import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { completeReview } from "./review-helper";

let directory, photos, video;
test.beforeAll(async () => {
  directory = await fs.mkdtemp(path.join(os.tmpdir(), "portfolio-media-e2e-"));
  photos = [];
  for (const [index, color] of [
    "white",
    "red",
    "blue",
    "yellow",
    "green",
    "pink",
  ].entries()) {
    const file = path.join(directory, `foto-${index + 1}.png`);
    execFileSync("ffmpeg", [
      "-v",
      "error",
      "-f",
      "lavfi",
      "-i",
      `color=${color}:s=160x90`,
      "-frames:v",
      "1",
      "-threads",
      "1",
      file,
    ]);
    photos.push(file);
  }
  video = path.join(directory, "demo.mp4");
  execFileSync("ffmpeg", [
    "-v",
    "error",
    "-f",
    "lavfi",
    "-i",
    "testsrc2=s=160x90:r=10:d=1",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-threads",
    "1",
    video,
  ]);
});
test.afterAll(async () => fs.rm(directory, { recursive: true, force: true }));
async function createProject(page, title) {
  await page.goto("/admin");
  await page.getByLabel("E-mail", { exact: true }).fill("editor@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("browser-test-password");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.getByRole("button", { name: "Novo projeto", exact: true }).click();
  await page.getByRole("textbox", { name: "Título", exact: true }).fill(title);
  await page.getByRole("button", { name: "Próximo", exact: true }).click();
  await page.getByRole("button", { name: "Próximo", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Visibilidade", exact: true })
    .selectOption("publico");
}
async function menu(page, filename, action) {
  await page
    .getByRole("button", { name: `Opções de ${filename}`, exact: true })
    .click();
  await page.getByRole("menuitem", { name: action, exact: true }).click();
}
async function save(page) {
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await completeReview(page);
  await expect(page.getByText("Item salvo.", { exact: true })).toBeVisible();
}

test("photos: upload, independent cover, reorder, color, undo, persistence and slider", async ({
  page,
}, info) => {
  const title = `Galeria ${info.project.name}`;
  await createProject(page, title);
  const input = page.locator("#project-media-upload");
  const rows = page.locator(".media-row");
  await input.setInputFiles(photos.slice(0, 3));
  await expect(rows).toHaveCount(3);
  await expect(page.locator(".media-progress")).toHaveCount(0);
  await expect(rows.first().locator(".media-cover-badge")).toHaveText("Capa");
  await menu(page, "foto-2.png", "Tornar capa");
  await rows.nth(2).locator(".drag-handle").press("Alt+ArrowUp");
  await expect(rows.locator(".media-info strong")).toHaveText([
    "foto-1.png",
    "foto-3.png",
    "foto-2.png",
  ]);
  await expect(rows.last().locator(".media-cover-badge")).toHaveText("Capa");
  await menu(page, "foto-2.png", "Ajustar fundo");
  const color = page.getByLabel("Cor de fundo de foto-2.png", { exact: true });
  await expect(color).toBeVisible();
  const automaticColor = await color.inputValue();
  await color.fill("#123456");
  await page.getByRole("button", { name: "Restaurar automático" }).click();
  await expect(color).toHaveValue(automaticColor);
  await color.fill("#123456");
  await page.getByRole("button", { name: "Concluir", exact: true }).click();
  await expect(rows.last().locator(".media-thumbnail")).toHaveCSS(
    "background-color",
    "rgb(18, 52, 86)",
  );
  await menu(page, "foto-2.png", "Excluir");
  await expect(rows).toHaveCount(2);
  await expect(rows.first().locator(".media-cover-badge")).toHaveText("Capa");
  await page.getByRole("button", { name: /^Desfazer/ }).click();
  await expect(rows).toHaveCount(3);
  await expect(rows.last().locator(".media-cover-badge")).toHaveText("Capa");
  await save(page);
  await page.reload();
  await page
    .locator(".admin-list .item-title")
    .getByText(title, { exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Mídias e publicação", exact: true }),
  ).toBeVisible();
  await expect(rows.locator(".media-info strong")).toHaveText([
    "foto-1.png",
    "foto-3.png",
    "foto-2.png",
  ]);
  await expect(rows.last().locator(".media-thumbnail")).toHaveCSS(
    "background-color",
    "rgb(18, 52, 86)",
  );
  await page
    .locator(".project-media-editor")
    .screenshot({ path: info.outputPath("media-editor.png") });
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await page
    .getByRole("button", { name: `Ver detalhes de ${title}`, exact: true })
    .click();
  await expect(page.locator('[data-slot="carousel-item"]')).toHaveCount(3);
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Fechar prévia", exact: true })
    .click();
  await page.goto("/");
  await page
    .getByRole("button", { name: `Ver detalhes de ${title}`, exact: true })
    .click();
  const modal = page.getByRole("dialog");
  await expect(modal.locator('[data-slot="carousel-item"]')).toHaveCount(3);
  const next = modal.getByRole("button", { name: "Próxima imagem" });
  const previous = modal.getByRole("button", { name: "Imagem anterior" });
  await expect(modal.getByRole("status")).toHaveText("1/3");
  await expect(previous).toBeDisabled();
  await expect(next).toBeInViewport();
  await next.click();
  await expect(modal.getByRole("status")).toHaveText("2/3");
  await expect(
    modal.getByRole("img", { name: `${title} — tela 2` }),
  ).toBeInViewport();
  await next.click();
  await expect(modal.getByRole("status")).toHaveText("3/3");
  await expect(next).toBeDisabled();
  await expect(
    modal.getByRole("img", { name: `Capa de ${title}` }).locator(".."),
  ).toHaveCSS("background-color", "rgb(18, 52, 86)");
  await expect(
    modal.getByRole("img", { name: `Capa de ${title}` }),
  ).toBeInViewport();
  await previous.click();
  await expect(modal.getByRole("status")).toHaveText("2/3");
  await expect(modal.locator("video")).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("photo-slider.png") });
});

test("video: frame cover, muted loop, photo priority, no click pause and fullscreen", async ({
  page,
}, info) => {
  const title = `Vídeo ${info.project.name}`;
  await createProject(page, title);
  const input = page.locator("#project-media-upload");
  await input.setInputFiles([video, photos[0], photos[1]]);
  await expect(page.locator(".media-row")).toHaveCount(3);
  await expect(page.locator(".media-progress")).toHaveCount(0);
  await expect(
    page.locator(".media-row").first().locator(".media-cover-badge"),
  ).toHaveText("Capa");
  await input.setInputFiles(video);
  await expect(page.locator(".admin-error")).toContainText(
    "no máximo um vídeo",
  );
  await expect(page.locator(".media-row")).toHaveCount(3);
  await save(page);
  const project = (await (await page.request.get("/api/projetos")).json()).find(
    (item) => item.titulo === title,
  );
  expect(project.imagemUrl).toBe(project.midias[0].previewUrl);
  expect(project.imagemUrl).not.toBe(project.midias[0].url);
  const range = await page.request.get(project.midias[0].url, {
    headers: { Range: "bytes=0-15" },
  });
  expect(range.status()).toBe(206);
  expect((await range.body()).length).toBe(16);
  await page.goto("/");
  await page
    .getByRole("button", { name: `Ver detalhes de ${title}`, exact: true })
    .click();
  const modal = page.getByRole("dialog");
  const player = modal.locator("video");
  await expect(player).toHaveCount(1);
  await expect(modal.locator('[data-slot="carousel-item"]')).toHaveCount(0);
  await expect
    .poll(() => player.evaluate((el) => el.readyState))
    .toBeGreaterThan(1);
  await expect.poll(() => player.evaluate((el) => !el.paused)).toBe(true);
  expect(
    await player.evaluate((el) => ({
      muted: el.muted,
      loop: el.loop,
      controls: el.controls,
      inline: el.playsInline,
    })),
  ).toEqual({ muted: true, loop: true, controls: false, inline: true });
  await modal.locator(".project-video").click({ position: { x: 30, y: 30 } });
  expect(await player.evaluate((el) => el.paused)).toBe(false);
  await modal.getByRole("button", { name: "Tela cheia", exact: true }).click();
  await expect(
    modal.getByRole("button", { name: "Sair da tela cheia" }),
  ).toBeVisible();
  await modal.getByRole("button", { name: "Sair da tela cheia" }).click();
  // Exercise the fallback without using the native mobile player controls.
  await page.evaluate(() => {
    Element.prototype.requestFullscreen = undefined;
  });
  await modal.getByRole("button", { name: "Tela cheia", exact: true }).click();
  await expect(modal).toHaveAttribute("data-video-expanded", "true");
  await expect(modal.locator(".project-video")).toHaveCSS("position", "fixed");
  await page.screenshot({ path: info.outputPath("video-fullscreen.png") });
  await page.keyboard.press("Escape");
  await expect(modal).not.toHaveAttribute("data-video-expanded", "true");
  await expect(modal).toBeVisible();
  await page.evaluate(() => {
    window.testVideo = document.querySelector("video");
  });
  await page.keyboard.press("Escape");
  await expect(modal).toHaveCount(0);
  expect(await page.evaluate(() => window.testVideo.paused)).toBe(true);
});

test("upload failures preserve successes, lock saving, and enforce the five-media limit", async ({
  page,
}, info) => {
  await createProject(page, `Falhas ${info.project.name}`);
  const input = page.locator("#project-media-upload");
  await input.setInputFiles(photos);
  await expect(page.locator(".admin-error")).toContainText("até 5 mídias");
  await expect(page.locator(".media-row")).toHaveCount(0);
  let release;
  let count = 0;
  await page.route("**/api/admin/uploads/project-media", async (route) => {
    count++;
    if (count === 1)
      await new Promise((resolve) => {
        release = resolve;
      });
    if (count === 2)
      await route.fulfill({
        status: 400,
        json: { error: "Arquivo inválido de teste." },
      });
    else await route.continue();
  });
  await input.setInputFiles(photos.slice(0, 3));
  await expect.poll(() => Boolean(release)).toBe(true);
  await expect(
    page.getByRole("button", { name: "Salvar", exact: true }),
  ).toBeDisabled();
  release();
  await expect(page.locator(".media-row")).toHaveCount(2);
  await expect(page.locator(".admin-error")).toContainText(
    "Arquivo inválido de teste.",
  );
  await expect(page.locator(".media-info strong")).toHaveText([
    "foto-1.png",
    "foto-3.png",
  ]);
  await page.unroute("**/api/admin/uploads/project-media");
  await input.setInputFiles(photos.slice(3));
  await expect(page.locator(".media-row")).toHaveCount(5);
  await expect(page.locator(".media-progress")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Adicionar mídias" }),
  ).toBeDisabled();
  await menu(page, "foto-1.png", "Excluir");
  await expect(
    page.locator(".media-row").first().locator(".media-cover-badge"),
  ).toHaveText("Capa");
  await expect(
    page.getByRole("button", { name: "Adicionar mídias" }),
  ).toBeEnabled();
  await save(page);
});
