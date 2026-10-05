import { expect, test } from "@playwright/test";

test("published projects match the demo layout and theme controls", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const section = page.locator("#projetos");
  await section.scrollIntoViewIfNeeded();
  const cards = section.locator(".work-card");
  const count = await cards.count();
  expect(count).toBeGreaterThanOrEqual(4);
  const mobile = info.project.name === "mobile";
  if (mobile) {
    await expect(section.locator(".work-mobile-action").first()).toBeHidden();
    await expect(
      section.getByRole("button", {
        name: "Ver detalhes de Lector Hub",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      section.getByRole("button", { name: "Próximo projeto" }),
    ).toBeHidden();
  } else {
    const next = section.getByRole("button", { name: "Próximo projeto" });
    await expect(next).toBeEnabled();
    await next.click();
    await expect(
      section.getByRole("button", {
        name: "Ver detalhes de Snack Point",
        exact: true,
      }),
    ).toBeInViewport();
    await section.getByRole("button", { name: "Projeto anterior" }).click();
    await expect(
      section.getByRole("button", {
        name: "Ver detalhes de Lector Hub",
        exact: true,
      }),
    ).toBeInViewport();
  }
  for (const dark of [false, true]) {
    await page.evaluate(
      (dark) => document.documentElement.classList.toggle("dark", dark),
      dark,
    );
    await expect(section).toHaveCSS(
      "background-color",
      dark ? "rgb(35, 28, 32)" : "rgb(244, 238, 225)",
    );
    await section
      .getByRole("button", { name: "Ver detalhes de Lector Hub", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toHaveCSS(
      "background-color",
      dark ? "rgb(37, 31, 35)" : "rgb(252, 250, 246)",
    );
    const image = dialog.locator(".work-media-frame").first();
    await expect(image).toHaveCSS("aspect-ratio", "16 / 9");
    const code = dialog.getByRole("link", { name: "Ver código", exact: true });
    await code.scrollIntoViewIfNeeded();
    await expect(code).toHaveCSS(
      "background-color",
      dark ? "rgb(255, 255, 255)" : "rgb(17, 17, 17)",
    );
    if (!mobile) {
      await code.hover();
      await expect(code).toHaveCSS(
        "background-color",
        dark ? "rgb(239, 154, 175)" : "rgb(151, 63, 84)",
      );
      await page.mouse.move(0, 0);
    }
    expect(
      await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await dialog.locator(".work-modal-scroll").evaluate((el) => {
      el.scrollTop = 0;
    });
    await page.screenshot({
      path: info.outputPath(`modal-${dark ? "dark" : "light"}.png`),
    });
    await dialog.getByRole("button", { name: "Fechar", exact: true }).click();
    await expect(dialog).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});
