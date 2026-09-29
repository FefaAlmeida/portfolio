import { expect, test } from "@playwright/test";
import { completeReview } from "./review-helper";

const titles = [
  "MatMov",
  "Vozes Além das Fronteiras",
  "Jornal SESI 222",
  "Nossa Casinha",
  "Juventudes em Diálogo",
];

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
  await expect(gallery.getByRole("status")).toHaveText("1 / 2");
  await gallery.getByRole("button", { name: "Próxima imagem" }).click();
  await expect(gallery.getByRole("status")).toHaveText("2 / 2");
  await gallery.getByRole("button", { name: "Imagem anterior" }).click();
  await expect(gallery.getByRole("status")).toHaveText("1 / 2");
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
  await page.goto("/admin");
  await page.getByLabel("E-mail", { exact: true }).fill("editor@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("browser-test-password");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page
    .getByRole("button", { name: "Extracurriculares", exact: true })
    .click();
  await page
    .locator(".admin-list .item-title")
    .getByText("Nossa Casinha", { exact: true })
    .click();
  const editor = page.getByRole("textbox", { name: "Descrição", exact: true });
  await editor.click();
  await editor.press("ControlOrMeta+a");
  await editor.press("Backspace");
  await editor.pressSequentially(text);
  await expect(editor).toHaveText(text);
  await editor.press("ControlOrMeta+a");
  const bold = page.getByRole("button", { name: "Negrito", exact: true });
  if ((await bold.getAttribute("aria-pressed")) === "true") await bold.click();
  await bold.click();
  await expect(editor.locator("strong")).toHaveText(text);
  await expect(editor.locator("strong")).toHaveCSS("color", "rgb(164, 62, 89)");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await completeReview(page);
  await expect(page.locator(".admin-notice")).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "Extracurriculares", exact: true })
    .click();
  await page
    .locator(".admin-list .item-title")
    .getByText("Nossa Casinha", { exact: true })
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
  await expect(page.locator("#experiencia-exp-02 strong")).toHaveText(text);
});
