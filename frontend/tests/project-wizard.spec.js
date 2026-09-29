import { expect, test } from "@playwright/test";
import { completeReview } from "./review-helper";

async function login(page) {
  await page.goto("/admin");
  await page.getByLabel("E-mail", { exact: true }).fill("editor@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("browser-test-password");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Novo projeto", exact: true }),
  ).toBeVisible();
}
async function step(page, name) {
  const navigation = page.getByRole("navigation", {
    name: "Etapas do projeto",
  });
  await navigation.getByRole("button", { name, exact: true }).click();
}
const next = (page) =>
  page.getByRole("button", { name: "Próximo", exact: true }).click();
async function save(page) {
  await page
    .getByRole("button", { name: "Salvar projeto", exact: true })
    .click();
  await completeReview(page);
  await expect(page.getByText("Item salvo.", { exact: true })).toBeVisible();
}
async function openPreview(page, title) {
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await page
    .getByRole("button", { name: `Ver detalhes de ${title}`, exact: true })
    .click();
  return page.getByRole("dialog").last().locator(".project-features");
}

test("creation history reveals the section of each change in both directions", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("button", { name: "Novo projeto", exact: true }).click();
  const title = page.getByRole("textbox", { name: "Título", exact: true });
  const subtitle = page.getByRole("textbox", {
    name: "Subtítulo",
    exact: true,
  });
  const features = page.getByRole("textbox", {
    name: "Funcionalidades do usuário",
    exact: true,
  });
  const link = page.getByRole("textbox", {
    name: "Link do projeto",
    exact: true,
  });
  const undo = page.getByRole("button", { name: /^Desfazer/ });
  const redo = page.getByRole("button", { name: /^Refazer/ });
  async function active(index) {
    const button = page.locator(".project-steps button").nth(index);
    await expect(button).toHaveAttribute("aria-current", "step");
    await expect(button).toBeInViewport();
    await expect(page.locator(`[data-project-step="${index}"]`)).toBeVisible();
  }

  await title.fill("Histórico entre etapas");
  await next(page);
  await features.fill("Consultar catálogo");
  await next(page);
  await link.fill("https://example.com");
  // Revisit the first section so redo must also be able to go from 3 to 1.
  await step(page, "Sobre o projeto");
  await subtitle.fill("Uma alteração posterior");
  await next(page);
  await next(page);
  await expect(undo).toHaveText("4");

  await page.keyboard.press("Control+z");
  await active(0);
  await expect(subtitle).toHaveValue("");
  await page.keyboard.press("Control+z");
  await active(2);
  await expect(link).toHaveValue("");
  await page.keyboard.press("Control+z");
  await active(1);
  await expect(features).toHaveValue("");
  await page.keyboard.press("Control+z");
  await active(0);
  await expect(title).toHaveValue("");
  await expect(undo).toBeDisabled();
  await page.keyboard.press("Control+z");
  await active(0);

  await page.keyboard.press("Control+y");
  await active(0);
  await expect(title).toHaveValue("Histórico entre etapas");
  await page.keyboard.press("Control+y");
  await active(1);
  await expect(features).toHaveValue("Consultar catálogo");
  await page.keyboard.press("Control+Shift+z");
  await active(2);
  await expect(link).toHaveValue("https://example.com");
  await page.keyboard.press("Control+y");
  await active(0);
  await expect(subtitle).toHaveValue("Uma alteração posterior");
  await expect(redo).toBeDisabled();

  await undo.click();
  await undo.click();
  await active(2);
  await redo.click();
  await active(2);
  await redo.click();
  await active(0);
  await undo.click();
  await subtitle.fill("Novo caminho");
  await expect(redo).toBeDisabled();
});

test("wizard preserves profiles through navigation, selection, undo, save and reopening", async ({
  page,
}, info) => {
  const errors = [];
  const writes = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (
      request.url().includes("/api/admin/projetos") &&
      request.method() !== "GET"
    )
      writes.push(request.method());
  });
  await login(page);
  await page.getByRole("button", { name: "Novo projeto", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Sobre o projeto", exact: true }),
  ).toHaveAttribute("aria-current", "step");
  await next(page);
  const titleField = page.getByRole("textbox", { name: "Título", exact: true });
  await expect(titleField).toBeFocused();
  await expect(
    page.getByRole("button", { name: "Sobre o projeto", exact: true }),
  ).toHaveAttribute("aria-current", "step");
  const title = `Perfis personalizados ${info.project.name}`;
  await titleField.fill(title);
  await next(page);
  const selection = page.getByRole("combobox", {
    name: "Quais perfis a aplicação tem?",
    exact: true,
  });
  await expect(selection).toHaveValue("usuario");
  await selection.selectOption("ambos");
  const adminName = page.getByRole("textbox", {
    name: "Nome do administrador",
    exact: true,
  });
  const userName = page.getByRole("textbox", {
    name: "Nome do usuário",
    exact: true,
  });
  const adminFeatures = page.getByRole("textbox", {
    name: "Funcionalidades do administrador",
    exact: true,
  });
  const userFeatures = page.getByRole("textbox", {
    name: "Funcionalidades do usuário",
    exact: true,
  });
  await adminName.fill("Bibliotecário");
  await adminFeatures.fill("Cadastrar livros\nGerenciar empréstimos");
  await userName.fill("Leitor");
  await userFeatures.fill("Consultar catálogo\nReservar livros");
  await selection.selectOption("admin");
  await expect(userName).toHaveCount(0);
  await page.getByRole("button", { name: /^Desfazer/ }).click();
  await expect(userName).toHaveValue("Leitor");
  await page.getByRole("button", { name: /^Refazer/ }).click();
  await expect(selection).toHaveValue("admin");
  await selection.selectOption("ambos");
  await expect(userFeatures).toHaveValue("Consultar catálogo\nReservar livros");
  await page.locator(".project-steps").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath("profile-step.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await next(page);
  await expect(
    page.getByRole("combobox", { name: "Visibilidade", exact: true }),
  ).toHaveValue("privado");
  await step(page, "Sobre o projeto");
  await expect(titleField).toHaveValue(title);
  await next(page);
  await expect(adminName).toHaveValue("Bibliotecário");
  await next(page);
  let features = await openPreview(page, title);
  await expect(
    features.getByRole("heading", { name: "Bibliotecário", exact: true }),
  ).toBeVisible();
  await expect(
    features.getByRole("heading", { name: "Leitor", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Fechar prévia", exact: true })
    .click();
  await step(page, "Perfis e funcionalidades");
  await selection.selectOption("admin");
  await next(page);
  expect(writes).toEqual([]);
  await save(page);
  const rows = await (await page.request.get("/api/admin/projetos")).json();
  const row = rows.find((item) => item.draft.titulo === title);
  expect(row.draft.detalhes.perfis).toEqual([
    {
      categoria: "admin",
      nome: "Bibliotecário",
      funcionalidades: ["Cadastrar livros", "Gerenciar empréstimos"],
    },
  ]);
  expect(row.draft).not.toHaveProperty("_inactiveProfiles");
  expect(row.published).toBeNull();
  // Inactive content survives a save for the rest of this editing session.
  await expect(page.locator("[data-project-step]:visible")).toHaveCount(3);
  await expect(
    page.getByRole("navigation", { name: "Etapas do projeto" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Próximo", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Anterior", exact: true }),
  ).toHaveCount(0);
  await selection.selectOption("ambos");
  await expect(userName).toHaveValue("Leitor");
  await expect(userFeatures).toHaveValue("Consultar catálogo\nReservar livros");
  await page
    .getByRole("combobox", { name: "Visibilidade", exact: true })
    .selectOption("publico");
  await save(page);
  await page.reload();
  await page
    .locator(".admin-list .item-title")
    .getByText(title, { exact: true })
    .click();
  const sections = page.locator("[data-project-step]");
  await expect(page.locator("[data-project-step]:visible")).toHaveCount(3);
  for (let index = 1; index < 3; index++) {
    const previous = await sections.nth(index - 1).boundingBox();
    const current = await sections.nth(index).boundingBox();
    expect(current.y).toBeGreaterThanOrEqual(previous.y + previous.height);
  }
  await page.screenshot({
    path: info.outputPath("continuous-editor.png"),
    fullPage: true,
  });
  await expect(adminName).toHaveValue("Bibliotecário");
  await expect(userFeatures).toHaveValue("Consultar catálogo\nReservar livros");
  await selection.selectOption("admin");
  await selection.selectOption("ambos");
  await expect(
    page.getByRole("button", { name: "Salvar", exact: true }),
  ).toBeDisabled();
  await selection.selectOption("usuario");
  features = await openPreview(page, title);
  await expect(features.locator("h4")).toHaveCount(1);
  await expect(features.locator("li")).toHaveText([
    "Consultar catálogo",
    "Reservar livros",
  ]);
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Fechar prévia", exact: true })
    .click();
  await save(page);
  await page.goto("/");
  await page
    .getByRole("button", { name: `Ver detalhes de ${title}`, exact: true })
    .click();
  features = page.getByRole("dialog").locator(".project-features");
  await expect(features.locator("h4")).toHaveCount(1);
  await expect(features.locator("li")).toHaveCount(2);
  expect(errors).toEqual([]);
});

test("creation and continuous editing validate fields and render default profile names", async ({
  page,
}, info) => {
  await login(page);
  await page.getByRole("button", { name: "Novo projeto", exact: true }).click();
  const title = `Validação por etapa ${info.project.name}`;
  await page.getByRole("textbox", { name: "Título", exact: true }).fill(title);
  await next(page);
  await page
    .getByRole("combobox", {
      name: "Quais perfis a aplicação tem?",
      exact: true,
    })
    .selectOption("ambos");
  const admin = page.getByRole("textbox", {
    name: "Funcionalidades do administrador",
    exact: true,
  });
  const user = page.getByRole("textbox", {
    name: "Funcionalidades do usuário",
    exact: true,
  });
  await admin.fill(Array(61).fill("Administrar").join("\n"));
  await next(page);
  await expect(
    page.getByRole("button", { name: "Perfis e funcionalidades", exact: true }),
  ).toHaveAttribute("aria-current", "step");
  await expect(admin).toBeFocused();
  await admin.fill("Administrar");
  await user.fill("Consultar");
  await next(page);
  let features = await openPreview(page, title);
  await expect(
    features.getByRole("heading", { name: "Administrador", exact: true }),
  ).toBeVisible();
  await expect(
    features.getByRole("heading", { name: "Usuário", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Fechar prévia", exact: true })
    .click();
  await save(page);
  await page.getByRole("textbox", { name: "Título", exact: true }).fill("   ");
  await page
    .getByRole("button", { name: "Salvar projeto", exact: true })
    .click();
  await expect(page.locator("[data-project-step]:visible")).toHaveCount(3);
  await expect(
    page.getByRole("textbox", { name: "Título", exact: true }),
  ).toBeFocused();
  await page.getByRole("textbox", { name: "Título", exact: true }).fill(title);
  await user.fill("");
  features = await openPreview(page, title);
  await expect(features.locator("h4")).toHaveCount(1);
  await expect(features.locator("li")).toHaveText(["Administrar"]);
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Fechar prévia", exact: true })
    .click();
  const link = page.getByRole("textbox", {
    name: "Link do projeto",
    exact: true,
  });
  await link.fill("ftp://example.com");
  await page
    .getByRole("button", { name: "Salvar projeto", exact: true })
    .click();
  await expect(link).toBeFocused();
  await link.fill("https://example.com");
  await save(page);
  await admin.fill("");
  features = await openPreview(page, title);
  await expect(features).toHaveCount(0);
});
