import { expect, test } from "@playwright/test";

test("admin has its own root, login origin, language and link to the public landing", async ({
  page,
}) => {
  const admin = "http://admin.localhost:3100/";
  await page.goto(admin);
  await expect(page).toHaveURL(admin);
  await expect(
    page.getByRole("heading", { name: "Bem-vinda de volta" }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByLabel("E-mail", { exact: true }).fill("editor@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("browser-test-password");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Projetos e trabalhos", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Ver site", exact: true }),
  ).toHaveAttribute("href", "http://localhost:3100");
  await page.getByLabel("Idioma da interface").selectOption("en-US");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en-US");
  await expect(
    page.getByRole("heading", { name: "Projects and work", exact: true }),
  ).toBeVisible();
  await page.goto("http://localhost:3100/admin");
  await expect(page).toHaveURL(admin);
  await page.goto("http://localhost:3100/");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Projects and work", exact: true }),
  ).toHaveCount(0);
});
