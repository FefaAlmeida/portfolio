import { expect, test } from "@playwright/test";

test("editorial landing retains published copy, responsive layout and theme persistence", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const site = await (await page.request.get("/api/site")).json();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Fernanda Gabriela.",
  );
  await expect(page.locator("#sobre h2")).toHaveText("Sobre mim");
  await expect(page.getByLabel(site.heroTitle, { exact: true })).toBeVisible();
  await expect(page.locator("#educacao")).toContainText(
    "SENAI São Caetano do Sul",
  );
  const awards = await (await page.request.get("/api/premios")).json();
  await expect(page.locator("#premios h3")).toHaveText(
    awards.map((item) => item.titulo),
  );
  await expect(page.locator("#premios button:disabled")).toHaveCount(
    awards.filter((item) => !item.credencialUrl).length,
  );
  for (const name of ["Leitor Destaque", "Destaque em Redação"]) {
    const card = page
      .locator("#premios li")
      .filter({ has: page.getByRole("heading", { name, exact: true }) });
    await expect(
      card.getByRole("img", { name: "SESI", exact: true }),
    ).toHaveAttribute("src", "/awards/logo-sesi.svg");
  }

  if (info.project.name === "mobile") {
    await page.getByRole("button", { name: "Abrir menu", exact: true }).click();
    await page
      .locator("#mobile-navigation")
      .getByRole("link", { name: "Sobre", exact: true })
      .click();
    await expect(page).toHaveURL(/#sobre$/);
    await expect(page.locator("#mobile-navigation")).toHaveCount(0);
    await expect(page.locator("#sobre h2")).toBeInViewport();
  }
  for (const width of info.project.name === "mobile"
    ? [320, 390]
    : [768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page
    .getByRole("button", { name: "Ativar modo escuro", exact: true })
    .click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page
    .getByRole("button", { name: "Ativar modo claro", exact: true })
    .click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  expect(errors).toEqual([]);
});

test("project dialog traps focus, isolates gallery keyboard controls and restores focus", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const trigger = page.getByRole("button", {
    name: "Ver detalhes de Lector Hub",
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  const track = page.locator("#projetos .work-track");
  const before = await track.evaluate((el) => getComputedStyle(el).transform);
  await dialog.getByRole("button", { name: "Fechar", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  expect(await track.evaluate((el) => getComputedStyle(el).transform)).toBe(
    before,
  );
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    expect(
      await dialog.evaluate((el) => el.contains(document.activeElement)),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  if (info.project.name === "desktop") {
    await page
      .getByRole("button", { name: "Próximo projeto", exact: true })
      .click();
    await expect(
      page.getByRole("button", {
        name: "Ver detalhes de Snack Point",
        exact: true,
      }),
    ).toBeInViewport();
  }
});
