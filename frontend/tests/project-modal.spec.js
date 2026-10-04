import { expect, test } from "@playwright/test";

test("project modal shows its cover, narrative and demo profile layout", async ({
  page,
}, info) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Ver detalhes de Lector Hub", exact: true })
    .click();
  const modal = page.getByRole("dialog");
  await expect(
    modal.getByRole("heading", { name: "Lector Hub", exact: true }),
  ).toBeVisible();
  const cover = modal.getByRole("img", { name: "Capa de Lector Hub" });
  await expect(cover).toBeVisible();
  await expect
    .poll(() => cover.evaluate((img) => img.naturalWidth))
    .toBeGreaterThan(0);
  await expect(
    modal.getByRole("heading", { name: /O problema|A solução|Meu papel/ }),
  ).toHaveCount(0);
  await expect(
    modal.getByText(/plataforma para gestão de acervos/i),
  ).toBeVisible();
  await expect(
    modal.getByText(
      /^Como Desenvolvedora Full-Stack, com foco em Back-end, e Gestora do Projeto, atuei/,
    ),
  ).toBeVisible();
  await expect(
    modal.getByRole("heading", { name: "Lector Hub", exact: true }),
  ).toHaveCSS("text-align", "center");
  await expect(
    modal.getByRole("heading", { name: "Funcionalidades", exact: true }),
  ).toHaveCount(0);
  for (const name of ["Os bibliotecários podem:", "Os leitores podem:"]) {
    await expect(modal.getByRole("heading", { name, exact: true })).toHaveCSS(
      "text-align",
      "left",
    );
  }
  await modal.locator(".project-features").scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath("project-modal.png") });
  await page.keyboard.press("Escape");
  await expect(modal).toHaveCount(0);
});

test("single profile shows full-width bullets and its profile heading", async ({
  page,
}, info) => {
  await page.goto("/");
  if (info.project.name === "desktop")
    await page
      .getByRole("button", { name: "Próximo projeto", exact: true })
      .click();
  await page
    .getByRole("button", { name: "Ver detalhes de Snack Point", exact: true })
    .click();
  const section = page.getByRole("dialog").locator(".project-features");
  await expect(section.locator("h4")).toBeVisible();
  await expect(section.locator("h4")).toHaveCount(1);
  await expect(section.locator("ul")).toHaveCount(1);
  await expect(section.locator("li")).toHaveCount(6);
  const width = await section.evaluate((el) => ({
    section: el.clientWidth,
    list: el.querySelector("ul").clientWidth,
  }));
  expect(width.list).toBe(width.section);
  await section.locator("li").last().scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath("single-profile.png") });
});
