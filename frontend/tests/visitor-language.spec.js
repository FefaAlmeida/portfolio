import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] }, locale: "en-US" });

test("first visit requires confirmation, updates dialog language, and remembers preference", async ({
  page,
  context,
}) => {
  await page.goto("/?source=test#projetos");
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: "Which language do you prefer?" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("radio", { name: /Português/ }).check();
  await expect(
    dialog.getByRole("heading", { name: "Qual idioma você prefere?" }),
  ).toBeVisible();
  await dialog.getByRole("radio", { name: /English/ }).check();
  await dialog
    .getByRole("button", { name: "Continue in this language" })
    .click();
  await expect(page).toHaveURL(/\/en\?source=test#projetos$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en-US");
  await expect(dialog).toHaveCount(0);
  const cookie = (await context.cookies()).find(
    (item) => item.name === "portfolio-visitor-locale",
  );
  expect(cookie.value).toBe("en-US");
  expect(cookie.expires * 1000 - Date.now()).toBeGreaterThan(
    360 * 24 * 60 * 60 * 1000,
  );
  await page.goto("/");
  await expect(page).toHaveURL(/\/en$/);
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveTitle("Fernanda Gabriela | Portfolio");
});

test("an explicit English URL is preserved for a returning Portuguese visitor", async ({
  page,
  context,
}) => {
  await context.addCookies([
    {
      name: "portfolio-visitor-locale",
      value: "pt-BR",
      domain: "localhost",
      path: "/",
    },
  ]);
  await page.goto("/en");
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/");
  await expect(page).toHaveTitle("Fernanda Gabriela | Portfólio");
});
