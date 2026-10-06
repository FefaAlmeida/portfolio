import { expect, test } from "@playwright/test";
import { completeReview } from "./review-helper";

const titles = [
  "MatMov",
  "Vozes Além das Fronteiras",
  "Jornal SESI 222",
  "Nossa Casinha",
  "Juventudes em Diálogo",
];

test("English experiences retain their inline emphasis and highlight styling", async ({
  page,
}) => {
  await page.goto("/en#experiencias");
  const expected = {
    "exp-01": [
      "5 members",
      "4 exhibitions",
      "1 digital presentation",
      "4 middle school classes",
    ],
    "exp-02": ["6 months", "10 babies each Saturday", "2 weeks"],
    "exp-03": ["50+ students", "16–25 students", "50 participants"],
    "exp-04": ["6 contributors", "15+ articles published", "2 videos"],
    "exp-05": ["1 published issue", "10 contributors"],
  };
  for (const [id, phrases] of Object.entries(expected)) {
    const bold = page.locator(`#experiencia-${id} strong`);
    await expect(bold).toHaveText(phrases);
    await expect(bold.first()).toHaveCSS("font-weight", "600");
    await expect(bold.first()).toHaveCSS("color", "rgb(164, 62, 89)");
  }
});

test("editorial experiences expose inline highlights, real links and the MatMov gallery", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#experiencias");
  const section = page.locator("#experiencias");
  await expect
    .poll(async () => (await section.locator("h3").allTextContents()).sort())
    .toEqual([...titles].sort());
  await expect(
    section.locator(".experience-results,.experience-result"),
  ).toHaveCount(0);
  await expect(
    section.getByRole("link", { name: /abre em nova aba/ }),
  ).toHaveCount(5);
  const vaf = page.locator("#experiencia-exp-04");
  await expect(vaf.locator("strong")).toHaveText([
    "6 colaboradores",
    "+15 textos publicados",
    "2 vídeos",
  ]);
  await expect(vaf.locator("strong").first()).toHaveCSS(
    "color",
    "rgb(164, 62, 89)",
  );
  await expect(vaf.locator("strong").first()).toHaveCSS("font-weight", "600");
  const gallery = page.locator("#experiencia-exp-03 [data-slot=carousel]");
  await expect(gallery.getByRole("status")).toHaveCount(0);
  await expect(
    gallery.getByRole("button", { name: "Próxima imagem" }),
  ).toHaveCount(0);
  await expect(
    gallery.getByRole("button", { name: "Imagem anterior" }),
  ).toHaveCount(0);
  const slides = gallery.locator("[data-slot=carousel-item]");
  await gallery.focus();
  await gallery.press("ArrowRight");
  await expect
    .poll(async () => {
      const slide = await slides.nth(1).boundingBox();
      const frame = await gallery.boundingBox();
      return Math.abs(slide.x + 16 - frame.x);
    })
    .toBeLessThan(2);
  await gallery.press("ArrowLeft");
  await expect(
    gallery.getByRole("button", { name: "Iniciar troca automática" }),
  ).toBeVisible();
  await page.goto("/#experiencia-exp-01");
  const last = page.locator("#experiencia-exp-01");
  await last.scrollIntoViewIfNeeded();
  await expect(last.locator("h3")).toBeInViewport();
  await expect(last.locator("img")).toHaveCount(1);
  await expect(last.locator(".experience-date")).toHaveText(
    "07/2025 — 12/2025",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await expect(section).toHaveCSS("background-color", "rgb(35, 28, 32)");
  await expect(vaf.locator("strong").first()).toHaveCSS(
    "color",
    "rgb(240, 162, 180)",
  );
  expect(errors).toEqual([]);
});

test("editor bold persists as an inline pink highlight in previews and the public page", async ({
  page,
}, info) => {
  const text = `6 meses de cuidado (${info.project.name})`;
  const title = `Bold preview ${info.project.name}`;
  await page.goto("/admin");
  await page.getByLabel("E-mail", { exact: true }).fill("editor@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("browser-test-password");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.getByRole("button", { name: "Experiência", exact: true }).click();
  await page
    .getByRole("button", { name: "Nova experiência", exact: true })
    .click();
  await page.getByRole("textbox", { name: "Título", exact: true }).fill(title);
  await page
    .getByRole("combobox", { name: "Visibilidade" })
    .selectOption("publico");
  const editor = page.getByRole("textbox", { name: "Descrição", exact: true });
  await editor.click();
  await editor.press("ControlOrMeta+a");
  await editor.press("Backspace");
  await editor.pressSequentially(text);
  await expect(editor).toHaveText(text);
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await completeReview(page);
  await editor.click();
  await editor.press("ControlOrMeta+a");
  const bold = page.getByRole("button", { name: "Negrito", exact: true });
  if ((await bold.getAttribute("aria-pressed")) === "true") await bold.click();
  await bold.click();
  await expect(editor.locator("strong")).toHaveText(text);
  await expect(editor.locator("strong")).toHaveCSS("color", "rgb(164, 62, 89)");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  const review = page.getByRole("dialog", {
    name: "Revisar traduções",
    exact: true,
  });
  await expect(review.locator("strong")).toHaveText([text, text]);
  await completeReview(page);
  await expect(page.locator(".admin-notice")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Experiência", exact: true }).click();
  await page
    .locator(".admin-list .item-title")
    .getByText(title, { exact: true })
    .click();
  await expect(editor.locator("strong")).toHaveText(text);
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  const preview = page.getByRole("dialog", {
    name: "Preview do item",
    exact: true,
  });
  await expect(preview.locator("strong")).toHaveText(text);
  await expect(preview.locator("strong")).toHaveCSS(
    "color",
    "rgb(164, 62, 89)",
  );
  await expect(preview.locator(".experience-result")).toHaveCount(0);
  await page.goto("/");
  const rows = await (await page.request.get("/api/experiencias")).json();
  const id = rows.find((item) => item.titulo === title).id;
  await expect(page.locator(`#experiencia-${id} strong`)).toHaveText(text);
  const current = await (
    await page.request.get(`/api/admin/experiencias/${id}`)
  ).json();
  const session = await (await page.request.get("/api/auth/session")).json();
  const removed = await page.request.delete(`/api/admin/experiencias/${id}`, {
    headers: { origin: "http://localhost:3100", "x-csrf-token": session.csrf },
    data: { revision: current.revision },
  });
  expect(removed.ok()).toBe(true);
});
