import { expect, test } from "@playwright/test";
import { completeReview } from "./review-helper";

async function resetSite({ request }) {
  const response = await request.post(
    "http://127.0.0.1:3101/__test__/reset-site",
    {
      headers: {
        authorization: "Bearer browser-test-only-token-32-characters",
      },
    },
  );
  expect(response.status()).toBe(204);
}

test.beforeEach(resetSite);
// Restore both languages and pending reviews even when the editor test fails.
test.afterEach(resetSite);

test("site sections share navigation, publish rich text and photos, and protect unsaved edits", async ({
  page,
}, info) => {
  const name = `Nome de teste ${info.project.name}`;
  const story = `Minha história em destaque ${info.project.name}.`;
  await page.goto("/admin");
  await page.getByLabel("E-mail", { exact: true }).fill("editor@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("browser-test-password");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  const tabs = page.locator(".admin-tabs");
  await expect(tabs.getByRole("button")).toHaveText([
    "Início",
    "Sobre",
    "Projetos",
    "Experiência",
    "Prêmios",
  ]);
  await tabs.getByRole("button", { name: "Início", exact: true }).click();
  await page.getByRole("textbox", { name: "Nome", exact: true }).fill(name);
  await tabs.getByRole("button", { name: "Sobre", exact: true }).click();
  await expect(
    page.getByRole("alertdialog", { name: "Descartar as alterações?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Nome", exact: true }),
  ).toHaveValue(name);
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.locator(".admin-notice")).toHaveText("Textos salvos.");
  await tabs.getByRole("button", { name: "Sobre", exact: true }).click();
  const editor = page.getByRole("textbox", {
    name: "Texto sobre mim",
    exact: true,
  });
  await editor.press("ControlOrMeta+a");
  await editor.press("Backspace");
  await editor.pressSequentially(story);
  await expect(
    page.getByRole("button", { name: "Salvar", exact: true }),
  ).toBeEnabled();
  await expect(editor).toHaveText(story);
  await editor.press("ControlOrMeta+a");
  const bold = page.getByRole("button", { name: "Negrito", exact: true });
  if ((await bold.getAttribute("aria-pressed")) !== "true") await bold.click();
  await page
    .getByRole("button", { name: "Alinhamento do texto", exact: true })
    .click();
  await page
    .getByRole("menuitemradio", { name: "Justificar", exact: true })
    .click();
  await expect(editor.locator("p").filter({ hasText: story })).toHaveCSS(
    "text-align",
    "justify",
  );
  await expect(editor.locator("strong")).toHaveText(story);
  for (const label of ["Foto principal", "Foto secundária"]) {
    await page
      .getByLabel(label, { exact: true })
      .setInputFiles("public/foto_perfil.jpeg");
    await expect(page.locator(".admin-notice")).toContainText(
      "Arquivo enviado",
    );
  }
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  const preview = page.getByRole("dialog");
  await expect(preview.locator("strong")).toHaveText(story);
  await expect(preview.locator('img[src^="/api/media/"]')).toHaveCount(2);
  await page
    .getByRole("button", { name: "Fechar prévia", exact: true })
    .click();
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await completeReview(page);
  // An alignment-only edit must enable Save and survive another publication.
  await editor.locator("p").filter({ hasText: story }).click();
  await page
    .getByRole("button", { name: "Alinhamento do texto", exact: true })
    .click();
  await page
    .getByRole("menuitemradio", { name: "Centralizar", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Salvar", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.locator(".admin-notice")).toHaveText("Textos salvos.");
  await page.reload();
  await tabs.getByRole("button", { name: "Sobre", exact: true }).click();
  await expect(editor.locator("p").filter({ hasText: story })).toHaveCSS(
    "text-align",
    "center",
  );
  await page.goto("/");
  await expect(page.locator("#intro-title")).toContainText(name);
  await expect(page.locator("#sobre strong")).toHaveText(story);
  await expect(page.locator("#sobre p").filter({ hasText: story })).toHaveCSS(
    "text-align",
    "center",
  );
  for (const img of await page.locator("#sobre img").all()) {
    await expect(img).toHaveAttribute("src", /^\/api\/media\//);
    await expect
      .poll(() =>
        img.evaluate((node) => node.complete && node.naturalWidth > 0),
      )
      .toBeTruthy();
  }
});
