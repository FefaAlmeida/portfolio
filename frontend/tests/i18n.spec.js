import { expect, test } from "@playwright/test";
import { completeReview } from "./review-helper";

async function login(page) {
  await page.goto("/admin");
  await page.getByLabel("E-mail", { exact: true }).fill("editor@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("browser-test-password");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Projetos", exact: true }),
  ).toBeVisible();
}
test("English public route and admin interface keep their language after reload", async ({
  page,
}) => {
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en-US");
  await expect(
    page.getByRole("heading", { name: "Projects", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "About me", exact: true }),
  ).toBeVisible();
  await login(page);
  await page.getByLabel("Idioma da interface").selectOption("en-US");
  await expect(
    page.getByRole("heading", { name: "Projects", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en-US");
  await expect(
    page.getByRole("heading", { name: "Projects", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Translations and budget", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Translation settings" }),
  ).toBeVisible();
  await expect(page.getByLabel("Glossary")).toBeVisible();
});
test("manual English changes are preserved and stale translations keep the previous publication", async ({
  page,
}, info) => {
  await login(page);
  await page.getByRole("button", { name: "Experiência", exact: true }).click();
  await page
    .getByRole("button", { name: "Nova experiência", exact: true })
    .click();
  const title = `i18n ${info.project.name}`;
  await page.getByRole("textbox", { name: "Título", exact: true }).fill(title);
  await page
    .getByRole("combobox", { name: "Visibilidade" })
    .selectOption("publico");
  await page
    .getByRole("textbox", { name: "Descrição", exact: true })
    .fill("Texto original");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await completeReview(page);
  await expect(page.locator(".admin-notice")).toHaveText("Item salvo.");
  await page.getByRole("button", { name: "English", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Descrição", exact: true })
    .fill("My English adjustment");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await completeReview(page);
  await expect(page.locator(".admin-notice")).toHaveText("Item salvo.");
  await page.getByRole("button", { name: "Português", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Descrição", exact: true }),
  ).toHaveText("Texto original");
  await page
    .getByRole("textbox", { name: "Descrição", exact: true })
    .fill("Texto atualizado");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.locator(".admin-notice")).toContainText("Rascunho salvo");
  const published = await (await page.request.get("/api/experiencias")).json();
  expect(
    published.find((item) => item.titulo === title).descricao.content[0]
      .content[0].text,
  ).toBe("Texto original");
  const dialog = page.getByRole("dialog", {
    name: "Revisar traduções",
    exact: true,
  });
  await expect(
    dialog.getByText("My English adjustment", { exact: true }),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: "Manter anterior", exact: true })
    .click();
  await dialog
    .getByRole("button", {
      name: "Concluir e publicar nos dois idiomas",
      exact: true,
    })
    .click();
  await expect(dialog).toHaveCount(0);
  const updated = await (await page.request.get("/api/experiencias")).json();
  expect(
    updated.find((item) => item.titulo === title).descricao.content[0]
      .content[0].text,
  ).toBe("Texto atualizado");
  const id = updated.find((item) => item.titulo === title).id;
  const session = await (await page.request.get("/api/auth/session")).json();
  const current = await (
    await page.request.get(`/api/admin/experiencias/${id}`)
  ).json();
  const removed = await page.request.delete(`/api/admin/experiencias/${id}`, {
    headers: { origin: "http://localhost:3100", "x-csrf-token": session.csrf },
    data: { revision: current.revision },
  });
  expect(removed.ok()).toBe(true);
});
test("translation failure keeps the editor contents and allows retry", async ({
  page,
}) => {
  await login(page);
  await page.locator(".admin-list .item-title").first().click();
  await page
    .getByRole("textbox", { name: "Título", exact: true })
    .fill("Unsaved translation test");
  await page.route("**/api/admin/projetos/*", async (route) => {
    if (route.request().method() === "PUT")
      await route.fulfill({
        status: 503,
        json: { error: "Tradução indisponível ou inválida. Tente novamente." },
      });
    else await route.continue();
  });
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.locator(".admin-error")).toContainText(
    "Tradução indisponível",
  );
  await expect(
    page.getByRole("textbox", { name: "Título", exact: true }),
  ).toHaveValue("Unsaved translation test");
  await expect(
    page.getByRole("button", { name: "Salvar", exact: true }),
  ).toBeEnabled();
});
