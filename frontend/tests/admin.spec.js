import { expect, test } from "@playwright/test";
import { completeReview } from "./review-helper";

async function projectStep(page, index) {
  const steps = page.getByRole("navigation", { name: "Etapas do projeto" });
  if (!(await steps.count())) return;
  const target = steps.getByRole("button").nth(index);
  if (await target.isDisabled()) await steps.getByRole("button").nth(1).click();
  await target.click();
}

async function login(page) {
  await page.goto("/admin");
  await page.getByLabel("E-mail", { exact: true }).fill("editor@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("browser-test-password");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Projetos", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".admin-list .item-title").first()).toBeVisible();
}
test("project editor accepts missing, null, plain and formatted descriptions", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/admin/projetos", async (route) => {
    const response = await route.fetch();
    const rows = await response.json();
    for (const row of rows) {
      if (row.draft.titulo === "Lector Hub") delete row.draft.descricao;
      if (row.draft.titulo === "Luminar") row.draft.descricao = null;
      if (row.draft.titulo === "Wisen") row.draft.descricao = "Texto simples";
      if (row.draft.titulo === "Snack Point") {
        row.draft.descricao = {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Texto formatado",
                  marks: [{ type: "bold" }],
                },
              ],
            },
          ],
        };
      }
    }
    await route.fulfill({ response, json: rows });
  });
  await login(page);
  for (const [title, text] of [
    ["Lector Hub", ""],
    ["Luminar", ""],
    ["Wisen", "Texto simples"],
    ["Snack Point", "Texto formatado"],
  ]) {
    await page
      .locator(".admin-list .item-title")
      .getByText(title, { exact: true })
      .click();
    const description = page.getByRole("textbox", {
      name: "Descrição",
      exact: true,
    });
    await expect(page.getByLabel("Meu papel", { exact: true })).toHaveCount(0);
    await expect(description).toHaveText(text);
    if (title === "Snack Point") {
      await expect(description.locator("strong")).toHaveText(text);
    }
    await expect(
      page.getByRole("button", { name: /^Desfazer/ }),
    ).toBeDisabled();
    await description.fill("Descrição editada");
    await page.getByRole("button", { name: /^Desfazer/ }).click();
    await expect(description).toHaveText(text);
    await page.locator('.admin-tabs button[aria-current="page"]').click();
    await expect(page.locator(".admin-list")).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("public portfolio imports all three sections and protects preview", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Projetos", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Luminar", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Reconhecimentos", exact: true }),
  ).toBeVisible();
  await expect(page.locator('a[href="https://example.com"]')).toHaveCount(0);
  await page.goto("/admin/preview/projetos/luminar");
  await expect(
    page.getByRole("heading", { name: "Bem-vinda de volta" }),
  ).toBeVisible();
});
test("admin navigation, search and responsive layout", async ({
  page,
}, info) => {
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Bem-vinda de volta" }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath("login.png"), fullPage: true });
  await login(page);
  const initialCount = (
    await (await page.request.get("/api/admin/projetos")).json()
  ).length;
  await page.screenshot({
    path: info.outputPath("content-list.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Filtrar itens", exact: true })
    .click();
  const filters = page.getByRole("dialog", { name: "Filtrar itens" });
  await expect(filters).toBeVisible();
  await filters.getByRole("radio", { name: "Privados", exact: true }).check();
  await page.keyboard.press("Escape");
  await expect(filters).not.toBeVisible();
  await expect(page.locator(".admin-list .item-title")).toHaveCount(
    initialCount,
  );
  await page
    .getByRole("button", { name: "Filtrar itens", exact: true })
    .click();
  await expect(
    filters.getByRole("radio", { name: "Todos", exact: true }),
  ).toBeChecked();
  await filters.getByRole("radio", { name: "Públicos", exact: true }).check();
  await filters.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(filters).not.toBeVisible();
  await expect(page.locator(".item-status").first()).toBeVisible();
  for (const status of await page.locator(".item-status").allTextContents()) {
    expect(status).toContain("Público");
  }
  await page
    .getByRole("button", { name: "Filtrar itens (filtro ativo)", exact: true })
    .click();
  await filters.getByRole("button", { name: "Limpar", exact: true }).click();
  await filters.getByRole("button", { name: "Aplicar filtros" }).click();
  const search = page.getByRole("searchbox", { name: "Buscar itens" });
  await search.fill("luminar");
  await expect(page.locator(".admin-list .item-title")).toHaveCount(1);
  await search.fill("nenhum-titulo-corresponde");
  await expect(
    page.getByRole("heading", { name: "Nenhum resultado" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Limpar busca" }).click();
  await expect(page.locator(".admin-list .item-title")).toHaveCount(
    initialCount,
  );
  await page.locator(".admin-list .item-title").first().click();
  await expect(
    page.getByRole("combobox", { name: "Status do projeto" }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("project-editor.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("textbox", { name: "Título", exact: true })
    .fill("Edição não salva");
  await page.locator('.admin-tabs button[aria-current="page"]').click();
  const discard = page.getByRole("alertdialog", {
    name: "Descartar as alterações?",
  });
  await expect(discard.getByRole("button", { name: "Cancelar" })).toBeFocused();
  await page.screenshot({ path: info.outputPath("discard-dialog.png") });
  await page.keyboard.press("Escape");
  await expect(discard).not.toBeVisible();
  await expect(
    page.locator('.admin-tabs button[aria-current="page"]'),
  ).toBeFocused();
  await expect(
    page.getByRole("textbox", { name: "Título", exact: true }),
  ).toHaveValue("Edição não salva");
  await page.locator('.admin-tabs button[aria-current="page"]').click();
  await discard.getByRole("button", { name: "Confirmar" }).click();
  await expect(page.locator(".admin-list .item-title")).toHaveCount(
    initialCount,
  );
});
test("visual editor, preview, unified saving, visibility and deletion", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await login(page);
  await page
    .getByRole("button", {
      name: /^(Novo projeto|Nova experiência|Novo prêmio)$/,
    })
    .click();
  const title = `Projeto ${info.project.name}`;
  await page.getByRole("textbox", { name: "Título", exact: true }).fill(title);
  await expect(
    page.getByText("Um item por linha.", { exact: true }),
  ).toHaveCount(0);
  for (const name of [
    "O problema",
    "A solução",
    "Diferencial",
    "Ciclo de aprendizado",
    "Modelo de negócio",
    "Resumo do card",
  ]) {
    await expect(page.getByRole("textbox", { name, exact: true })).toHaveCount(
      0,
    );
  }
  await projectStep(page, 2);
  const technologies = page.getByRole("textbox", {
    name: "Tecnologias",
    exact: true,
  });
  await technologies.fill("  JavaScript  ");
  await technologies.press("Enter");
  await expect(
    page.getByRole("button", { name: "Remover JavaScript", exact: true }),
  ).toHaveCount(1);
  await expect(page.getByText("Item salvo.", { exact: true })).toHaveCount(0);
  await technologies.fill("javascript");
  await technologies.press("Enter");
  await expect(page.locator(".technology-chip")).toHaveCount(1);
  await technologies.fill("SQLite");
  await technologies.press("Enter");
  await page.locator(".technology-chip").filter({ hasText: "SQLite" }).hover();
  await page
    .getByRole("button", { name: "Remover SQLite", exact: true })
    .click();
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await expect(page.locator(".technology-chip")).toHaveCount(1);
  await projectStep(page, 0);
  const status = page.getByRole("combobox", { name: "Status do projeto" });
  await expect(status).toHaveValue("EM DESENVOLVIMENTO");
  await status.selectOption("FINALIZADO");
  await page
    .getByRole("textbox", { name: "Descrição", exact: true })
    .fill("Uma descrição com edição visual.");
  await page
    .getByRole("textbox", { name: "Descrição", exact: true })
    .selectText();
  await page
    .locator(".text-editor")
    .first()
    .getByRole("button", { name: "Negrito", exact: true })
    .click();
  await projectStep(page, 2);
  await page
    .getByLabel("Mídias do projeto", { exact: true })
    .setInputFiles("../backend/seed/images/luminar_logo.jpeg");
  await expect(
    page.getByText("Mídias enviadas. Salve o projeto para vinculá-las."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await completeReview(page);
  await expect(page.getByText("Item salvo.", { exact: true })).toBeVisible();
  let rows = await (await page.request.get("/api/projetos")).json();
  expect(rows.some((row) => row.titulo === title)).toBe(false);
  await page.getByRole("button", { name: "Preview" }).click();
  await expect(
    page.getByRole("dialog", { name: "Preview do item", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("dialog").getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: `Ver detalhes de ${title}`, exact: true })
    .click();
  await expect(page.getByRole("dialog").last().locator("strong")).toContainText(
    "Uma descrição com edição visual.",
  );
  await page.goto("/admin");
  await page
    .getByRole("button", { name: new RegExp(`${title} Privado`) })
    .click();
  await projectStep(page, 2);
  await page
    .getByRole("combobox", { name: "Visibilidade", exact: true })
    .selectOption("publico");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await projectStep(page, 0);
  await expect(status).toHaveValue("FINALIZADO");
  await completeReview(page);
  await expect(page.getByText("Item salvo.", { exact: true })).toBeVisible();
  const published = (
    await (await page.request.get("/api/projetos")).json()
  ).find((row) => row.titulo === title);
  expect(published.tecnologias).toEqual(["JavaScript"]);
  expect(published.descricao.content[0].content[0].marks).toContainEqual({
    type: "bold",
  });
  await page
    .getByRole("textbox", { name: "Título", exact: true })
    .fill(`${title} revisado`);
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await completeReview(page);
  await expect(page.getByText("Item salvo.", { exact: true })).toBeVisible();
  rows = await (await page.request.get("/api/projetos")).json();
  expect(rows.some((row) => row.titulo === title)).toBe(false);
  expect(rows.some((row) => row.titulo === `${title} revisado`)).toBe(true);
  await page.screenshot({ path: info.outputPath("admin.png"), fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await projectStep(page, 2);
  await page
    .getByRole("combobox", { name: "Visibilidade", exact: true })
    .selectOption("publico");
  await expect(
    page.getByRole("button", { name: "Salvar", exact: true }),
  ).toBeDisabled();
  await projectStep(page, 2);
  await page
    .getByRole("combobox", { name: "Visibilidade", exact: true })
    .selectOption("privado");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await completeReview(page);
  await expect(page.getByText("Item salvo.", { exact: true })).toBeVisible();
  rows = await (await page.request.get("/api/projetos")).json();
  expect(rows.some((row) => row.titulo === `${title} revisado`)).toBe(false);
  await page.locator('.admin-tabs button[aria-current="page"]').click();
  await page
    .getByRole("button", { name: `Deletar ${title} revisado`, exact: true })
    .click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Excluir" })
    .click();
  await expect(page.getByText("Item excluído.", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
test("experience formatting, ordering, awards PDF, and logout", async ({
  page,
}, info) => {
  await login(page);
  await page
    .getByRole("button", { name: "Experiência", exact: true })
    .click();
  await expect(page.locator(".admin-list .item-title")).toHaveCount(5);
  await page.locator(".admin-list .item-title").first().click();
  await expect(page.locator(".tiptap strong").first()).toBeVisible();
  await page.locator('.admin-tabs button[aria-current="page"]').click();
  const firstTitle = await page
    .locator(".admin-list .item-title strong")
    .first()
    .innerText();
  await page
    .getByRole("button", { name: `Reordenar ${firstTitle}`, exact: true })
    .press("Alt+ArrowDown");
  await expect
    .poll(
      async () =>
        (await (await page.request.get("/api/experiencias")).json())[1].titulo,
    )
    .toBe(firstTitle);
  await expect(page.getByText("Ordem atualizada no site.")).toHaveCount(0);
  await page.getByRole("button", { name: "Prêmios", exact: true }).click();
  await page
    .getByRole("button", {
      name: /^(Novo projeto|Nova experiência|Novo prêmio)$/,
    })
    .click();
  await page
    .getByRole("textbox", { name: "Título", exact: true })
    .fill(`Certificado ${info.project.name}`);
  await page
    .getByLabel("Arquivo da credencial", { exact: true })
    .setInputFiles({
      name: "certificado.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF"),
    });
  await expect(
    page.getByText("Arquivo enviado. Salve o item para vinculá-lo."),
  ).toBeVisible();
  await projectStep(page, 2);
  await page
    .getByRole("combobox", { name: "Visibilidade", exact: true })
    .selectOption("publico");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await completeReview(page);
  await expect(page.getByText("Item salvo.", { exact: true })).toBeVisible();
  const awards = await (await page.request.get("/api/premios")).json();
  const award = awards.find(
    (row) => row.titulo === `Certificado ${info.project.name}`,
  );
  const file = await page.request.get(award.credencialUrl);
  expect(file.headers()["content-type"]).toContain("application/pdf");
  await page.getByRole("button", { name: "Sair", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Bem-vinda de volta" }),
  ).toBeVisible();
});

test("undo restores saved state and preview never saves", async ({ page }) => {
  await login(page);
  await page
    .getByRole("button", { name: "Experiência", exact: true })
    .click();
  await page.locator(".admin-list .item-title").first().click();
  const originalRows = await (
    await page.request.get("/api/admin/experiencias")
  ).json();
  const title = page.getByRole("textbox", { name: "Título", exact: true });
  const originalTitle = await title.inputValue();
  const save = page.getByRole("button", { name: "Salvar", exact: true });
  await title.fill("Título temporário");
  const description = page.getByRole("textbox", {
    name: "Descrição",
    exact: true,
  });
  await description.press("End");
  await description.pressSequentially(" alteração");
  await page.getByRole("button", { name: /^Desfazer/ }).click();
  await expect(save).toBeEnabled();
  await title.fill(originalTitle);
  await expect(save).toBeDisabled();
  await title.fill("Prévia sem salvar");
  const mutations = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/admin/") && request.method() !== "GET")
      mutations.push(request.method());
  });
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Prévia sem salvar", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Fechar prévia", exact: true })
    .click();
  await expect(title).toHaveValue("Prévia sem salvar");
  await expect(save).toBeEnabled();
  expect(
    await (await page.request.get("/api/admin/experiencias")).json(),
  ).toEqual(originalRows);
  expect(mutations).toEqual([]);
});

test("technology chips appear below the input and preserve saved order", async ({
  page,
}, info) => {
  await login(page);
  await page.getByRole("button", { name: "Novo projeto", exact: true }).click();
  const title = `Tecnologias em chips ${info.project.name}`;
  await page.getByRole("textbox", { name: "Título", exact: true }).fill(title);
  await projectStep(page, 2);
  const input = page.getByRole("textbox", { name: "Tecnologias", exact: true });
  for (const technology of ["React", "Node.js", "SQL"]) {
    await input.fill(technology);
    await input.press("Enter");
  }
  const rows = page.locator(".technology-chip");
  const labels = rows.locator(":scope > span");
  await rows.first().scrollIntoViewIfNeeded();
  await expect(page.locator(".technology-list .drag-handle")).toHaveCount(0);
  const inputBox = await input.boundingBox();
  const firstChip = await rows.first().boundingBox();
  const secondChip = await rows.nth(1).boundingBox();
  expect(firstChip.y).toBeGreaterThan(inputBox.y + inputBox.height);
  expect(secondChip.y).toBe(firstChip.y);
  expect(secondChip.x).toBeGreaterThan(firstChip.x + firstChip.width);
  await expect(labels).toHaveText(["React", "Node.js", "SQL"]);
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await completeReview(page);
  await expect(page.getByText("Item salvo.", { exact: true })).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: new RegExp(`${title} Privado`) })
    .click();
  await projectStep(page, 2);
  await expect(labels).toHaveText(["React", "Node.js", "SQL"]);
  await page.getByRole("button", { name: "Remover SQL", exact: true }).click();
  await expect(labels).toHaveText(["React", "Node.js"]);
});

async function dragBetween(page, from, to, touch) {
  if (touch) {
    const client = await page.context().newCDPSession(page);
    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [from],
    });
    for (let step = 1; step <= 12; step++) {
      await client.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          {
            x: from.x + ((to.x - from.x) * step) / 12,
            y: from.y + ((to.y - from.y) * step) / 12,
          },
        ],
      });
      await page.waitForTimeout(20);
    }
    await client.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await client.detach();
  } else {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 15 });
    await page.mouse.up();
  }
}

test("handle-only sorting and list deletion in every section", async ({
  page,
  isMobile,
}, info) => {
  await login(page);
  for (const [kind, label] of [
    ["projetos", "Projetos"],
    ["experiencias", "Experiência"],
    ["premios", "Prêmios"],
  ]) {
    await page.getByRole("button", { name: label, exact: true }).click();
    const rows = page.locator(".admin-list li");
    await expect(rows.first()).toBeVisible();
    const original = await rows.locator(".item-copy strong").allTextContents();
    const first = rows.first();
    await first.evaluate((element) =>
      element.scrollIntoView({ block: "center", behavior: "instant" }),
    );
    const box = await first.boundingBox();
    const second = await rows.nth(1).boundingBox();
    const requests = [];
    const track = (request) => {
      if (
        request.method() === "PUT" &&
        request.url().endsWith(`/${kind}/order`)
      )
        requests.push(request);
    };
    page.on("request", track);
    // Dragging the row's padding must not start sorting.
    await dragBetween(
      page,
      { x: box.x + box.width / 2, y: box.y + 3 },
      { x: box.x + box.width / 2, y: second.y + second.height / 2 },
      false,
    );
    expect(requests).toHaveLength(0);
    await expect(rows.locator(".item-copy strong")).toHaveText(original);
    const handle = first.locator(".drag-handle");
    await first.evaluate((element) =>
      element.scrollIntoView({ block: "center", behavior: "instant" }),
    );
    const grip = await handle.boundingBox();
    const target = await rows.nth(1).boundingBox();
    await dragBetween(
      page,
      { x: grip.x + grip.width / 2, y: grip.y + grip.height / 2 },
      { x: grip.x + grip.width / 2, y: target.y + target.height * 0.8 },
      isMobile,
    );
    await expect(page.getByText("Ordem atualizada no site.")).toHaveCount(0);
    await expect(rows.locator(".item-copy strong").nth(1)).toHaveText(
      original[0],
    );
    await expect.poll(() => requests.length).toBe(1);
    page.off("request", track);
    await expect
      .poll(async () => {
        const saved = await (
          await page.request.get(`/api/admin/${kind}`)
        ).json();
        return saved[1].draft.titulo;
      })
      .toBe(original[0]);
    await rows.nth(1).locator(".drag-handle").press("Alt+ArrowUp");
    await expect(rows.locator(".item-copy strong")).toHaveText(original);
    await expect(rows.first().locator(".drag-handle")).toBeEnabled();
    await page
      .getByRole("button", {
        name: /^(Novo projeto|Nova experiência|Novo prêmio)$/,
      })
      .click();
    await expect(
      page.getByRole("button", { name: "Voltar", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("textbox", { name: "Título", exact: true })
      .fill(`Excluir teste ${kind}`);
    await projectStep(page, 2);
    await page.getByRole("button", { name: "Salvar", exact: true }).click();
    await completeReview(page);
    await expect(page.getByText("Item salvo.", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Voltar", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Excluir", exact: true }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Voltar", exact: true }).click();
    const created = rows.filter({ hasText: `Excluir teste ${kind}` });
    await expect(created.getByRole("button", { name: /^Editar / })).toHaveCSS(
      "color",
      "rgb(104, 104, 104)",
    );
    await expect(created.getByRole("button", { name: /^Deletar / })).toHaveCSS(
      "color",
      "rgb(192, 47, 53)",
    );
    await created.getByRole("button", { name: /^Deletar / }).click();
    const deletion = page.getByRole("alertdialog", {
      name: "Excluir este item?",
    });
    await expect(deletion).toContainText(`Excluir teste ${kind}`);
    await expect(
      deletion.getByRole("button", { name: "Cancelar" }),
    ).toBeFocused();
    await page.screenshot({
      path: info.outputPath(`delete-dialog-${kind}.png`),
    });
    await deletion.getByRole("button", { name: "Cancelar" }).click();
    await expect(created).toHaveCount(1);
    await expect(
      created.getByRole("button", { name: /^Deletar / }),
    ).toBeFocused();
    await created.getByRole("button", { name: /^Deletar / }).click();
    await deletion.getByRole("button", { name: "Excluir" }).click();
    await expect(
      page.getByText("Item excluído.", { exact: true }),
    ).toBeVisible();
    await expect(created).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("sorting stays undimmed while saving and rolls back on failure", async ({
  page,
}) => {
  await login(page);
  const titles = page.locator(".admin-list .item-copy strong");
  const original = await titles.allTextContents();
  let release;
  await page.route("**/api/admin/projetos/order", async (route) => {
    await new Promise((resolve) => {
      release = resolve;
    });
    await route.fulfill({
      status: 500,
      json: { error: "Falha de teste ao salvar a ordem." },
    });
  });
  await page.locator(".drag-handle").first().press("Alt+ArrowDown");
  await expect.poll(() => Boolean(release)).toBe(true);
  await expect(titles.nth(1)).toHaveText(original[0]);
  await expect(page.locator(".admin-list button:disabled")).toHaveCount(0);
  await expect(page.locator(".admin-notice")).toHaveCount(0);
  await expect(page.locator(".item-title").first()).toHaveCSS("opacity", "1");
  release();
  await expect(page.locator(".admin-error")).toHaveText(
    "Falha de teste ao salvar a ordem.",
  );
  await expect(titles).toHaveText(original);
});

test("project month dates persist and prevent reversed ranges", async ({
  page,
}, info) => {
  await login(page);
  await page.getByRole("button", { name: "Novo projeto", exact: true }).click();
  const title = `Datas do projeto ${info.project.name}`;
  await page.getByRole("textbox", { name: "Título", exact: true }).fill(title);
  const start = page.getByRole("button", {
    name: "Início do projeto",
    exact: true,
  });
  const end = page.getByRole("button", { name: "Fim do projeto", exact: true });
  await projectStep(page, 0);
  const status = page.getByRole("combobox", { name: "Status do projeto" });
  await expect(end).toHaveText("Presente");
  await status.selectOption("FINALIZADO");
  await expect(end).toHaveText("mm/yyyy");
  await status.selectOption("EM DESENVOLVIMENTO");
  await expect(end).toHaveText("Presente");
  await expect(start).toHaveText("mm/yyyy");
  await start.click();
  let dialog = page.getByRole("dialog", { name: "Início do projeto" });
  await dialog.getByRole("textbox", { name: "Ano", exact: true }).fill("2026");
  await dialog.getByRole("button", { name: "Fevereiro", exact: true }).click();
  await expect(start).toHaveText("02/2026");
  await expect(start).toBeFocused();
  await end.click();
  dialog = page.getByRole("dialog", { name: "Fim do projeto" });
  await dialog.getByRole("textbox", { name: "Ano", exact: true }).fill("2026");
  await expect(
    dialog.getByRole("button", { name: "Janeiro", exact: true }),
  ).toBeDisabled();
  await dialog.getByRole("button", { name: "Próximo ano" }).click();
  await expect(
    dialog.getByRole("textbox", { name: "Ano", exact: true }),
  ).toHaveValue("2027");
  await dialog.getByRole("button", { name: "Março", exact: true }).click();
  await projectStep(page, 2);
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await completeReview(page);
  await expect(page.getByText("Item salvo.", { exact: true })).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: new RegExp(`${title} Privado`) })
    .click();
  await expect(start).toHaveText("02/2026");
  await expect(end).toHaveText("03/2027");
  await status.selectOption("FINALIZADO");
  await expect(end).toHaveText("03/2027");
  await end.click();
  dialog = page.getByRole("dialog", { name: "Fim do projeto" });
  await expect(
    dialog.getByRole("button", { name: "Presente", exact: true }),
  ).toHaveCount(0);
  await dialog.getByRole("button", { name: "Limpar data" }).click();
  await expect(end).toHaveText("mm/yyyy");
  await status.selectOption("EM DESENVOLVIMENTO");
  await end.click();
  await page
    .getByRole("dialog", { name: "Fim do projeto" })
    .getByRole("button", { name: "Presente", exact: true })
    .click();
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await completeReview(page);
  await expect(page.getByText("Item salvo.", { exact: true })).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: new RegExp(`${title} Privado`) })
    .click();
  await expect(end).toHaveText("Presente");
  await start.click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Início do projeto" }),
  ).not.toBeVisible();
  await expect(start).toHaveText("02/2026");
});

test("item history follows fields, rich text and shortcuts globally", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("button", { name: "Novo projeto", exact: true }).click();
  const undo = page.getByRole("button", { name: /^Desfazer/ });
  const redo = page.getByRole("button", { name: /^Refazer/ });
  const title = page.getByRole("textbox", { name: "Título", exact: true });
  const subtitle = page.getByRole("textbox", {
    name: "Subtítulo",
    exact: true,
  });
  const description = page.getByRole("textbox", {
    name: "Descrição",
    exact: true,
  });
  await expect(undo).toBeDisabled();
  await title.pressSequentially("Histórico");
  await expect(undo).toHaveText("1");
  await subtitle.fill("Subtítulo de teste");
  await description.fill("Texto de teste");
  await expect(undo).toHaveText("3");
  await expect(
    page.locator(".editor-toolbar").getByRole("button", { name: /Desfazer/ }),
  ).toHaveCount(0);

  // Undo from a different field still restores the last change in the item.
  await title.focus();
  await page.keyboard.press("Control+z");
  await expect(description).toHaveText("");
  await expect(title).toHaveValue("Histórico");
  await page.keyboard.press("Control+y");
  await expect(description).toHaveText("Texto de teste");
  await description.focus();
  await page.keyboard.press("Control+a");
  await page
    .getByRole("toolbar", { name: "Formatação: Descrição", exact: true })
    .getByRole("button", { name: "Negrito", exact: true })
    .click();
  await expect(description.locator("strong")).toHaveText("Texto de teste");
  await undo.click();
  await expect(description.locator("strong")).toHaveCount(0);
  await redo.click();
  await expect(description.locator("strong")).toHaveText("Texto de teste");
  await undo.click();
  await undo.click();
  await expect(description).toHaveText("");
  await subtitle.fill("Outra direção");
  await expect(redo).toBeDisabled();

  await page
    .getByRole("combobox", { name: "Status do projeto" })
    .selectOption("FINALIZADO");
  await undo.click();
  await expect(
    page.getByRole("combobox", { name: "Status do projeto" }),
  ).toHaveValue("EM DESENVOLVIMENTO");
  await projectStep(page, 2);
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await completeReview(page);
  await expect(page.getByText("Item salvo.", { exact: true })).toBeVisible();
  await undo.click();
  await projectStep(page, 0);
  await expect(subtitle).toHaveValue("Subtítulo de teste");
  await expect(
    page.getByRole("button", { name: "Salvar", exact: true }),
  ).toBeEnabled();
  await page.locator('.admin-tabs button[aria-current="page"]').click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Confirmar", exact: true })
    .click();
  await page.getByRole("button", { name: "Novo projeto", exact: true }).click();
  await expect(undo).toBeDisabled();
  await expect(redo).toBeDisabled();
  await page.locator('.admin-tabs button[aria-current="page"]').click();
  await page
    .getByRole("button", { name: "Deletar Histórico", exact: true })
    .click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Excluir", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Deletar Histórico", exact: true }),
  ).toHaveCount(0);
});

test("visibility is a saved field with history and the editor has four top actions", async ({
  page,
}, info) => {
  await login(page);
  await page.getByRole("button", { name: "Novo projeto", exact: true }).click();
  const title = `Visibilidade ${info.project.name}`;
  await page.getByRole("textbox", { name: "Título", exact: true }).fill(title);
  await projectStep(page, 2);
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await completeReview(page);
  await expect(page.getByText("Item salvo.", { exact: true })).toBeVisible();
  await page.reload();
  await page
    .locator(".admin-list .item-title")
    .getByText(title, { exact: true })
    .click();
  await projectStep(page, 2);
  const visibility = page.getByRole("combobox", {
    name: "Visibilidade",
    exact: true,
  });
  await expect(visibility).toHaveValue("privado");
  await expect(page.locator(".admin-savebar button")).toHaveText([
    "0",
    "0",
    "",
    "",
  ]);
  const save = page.getByRole("button", { name: "Salvar", exact: true });
  await expect(save).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Excluir", exact: true }),
  ).toHaveCount(0);
  await visibility.selectOption("publico");
  await expect(save).toBeEnabled();
  await page.getByRole("button", { name: /^Desfazer/ }).click();
  await expect(visibility).toHaveValue("privado");
  await expect(save).toBeDisabled();
  await page.getByRole("button", { name: /^Refazer/ }).click();
  await expect(visibility).toHaveValue("publico");
  await expect(save).toBeEnabled();
  await page.locator('.admin-tabs button[aria-current="page"]').click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Cancelar", exact: true })
    .click();
  await expect(visibility).toHaveValue("publico");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await completeReview(page);
  await expect(page.getByText("Item salvo.", { exact: true })).toBeVisible();
  await expect(save).toBeDisabled();
  await projectStep(page, 0);
  const titleField = page.getByRole("textbox", { name: "Título", exact: true });
  await titleField.fill(`${title} alterado`);
  await expect(save).toBeEnabled();
  await titleField.fill(title);
  await expect(save).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Excluir", exact: true }),
  ).toHaveCount(0);
  const publicItems = () =>
    page.request.get("/api/projetos").then((r) => r.json());
  expect((await publicItems()).some((item) => item.titulo === title)).toBe(
    true,
  );
  await projectStep(page, 2);
  await visibility.selectOption("privado");
  expect((await publicItems()).some((item) => item.titulo === title)).toBe(
    true,
  );
  await page.route("**/api/admin/projetos/*", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Falha ao salvar para teste." }),
    }),
  );
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Falha ao salvar para teste." }),
  ).toBeVisible();
  await expect(visibility).toHaveValue("privado");
  await expect(
    page.getByRole("button", { name: "Salvar", exact: true }),
  ).toBeEnabled();
  expect((await publicItems()).some((item) => item.titulo === title)).toBe(
    true,
  );
  await page.unroute("**/api/admin/projetos/*");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await completeReview(page);
  await expect(page.getByText("Item salvo.", { exact: true })).toBeVisible();
  expect((await publicItems()).some((item) => item.titulo === title)).toBe(
    false,
  );
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Preview do item", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Fechar prévia", exact: true })
    .click();
  await page.locator('.admin-tabs button[aria-current="page"]').click();
  await page
    .getByRole("button", { name: `Deletar ${title}`, exact: true })
    .click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Excluir", exact: true })
    .click();
  await expect(page.getByText("Item excluído.", { exact: true })).toBeVisible();
});

test("experience month dates preserve legacy periods and persist edits", async ({
  page,
}) => {
  await login(page);
  await page
    .getByRole("button", { name: "Experiência", exact: true })
    .click();
  const session = await (await page.request.get("/api/auth/session")).json();
  const headers = {
    origin: "http://localhost:3100",
    "x-csrf-token": session.csrf,
  };
  const created = await page.request.post("/api/admin/experiencias", {
    headers,
    data: { titulo: `Período legado ${Date.now()}`, periodo: "Desde 2020" },
  });
  expect(created.status()).toBe(201);
  const legacy = await created.json();
  await page.reload();
  await page
    .getByRole("button", { name: "Experiência", exact: true })
    .click();
  const title = legacy.draft.titulo;
  await page
    .locator(".admin-list .item-title")
    .getByText(title, { exact: true })
    .click();
  await expect(
    page.getByText(
      "Confira o Preview e salve o conteúdo com a visibilidade desejada.",
    ),
  ).toHaveCount(0);
  await expect(page.getByText(/^Período cadastrado:/)).toBeVisible();
  const start = page.getByRole("button", {
    name: "Início da experiência",
    exact: true,
  });
  const end = page.getByRole("button", {
    name: "Fim da experiência",
    exact: true,
  });
  await start.click();
  let dialog = page.getByRole("dialog", { name: "Início da experiência" });
  await dialog.getByRole("textbox", { name: "Ano", exact: true }).fill("2024");
  await dialog.getByRole("button", { name: "Fevereiro", exact: true }).click();
  await end.click();
  dialog = page.getByRole("dialog", { name: "Fim da experiência" });
  await dialog.getByRole("textbox", { name: "Ano", exact: true }).fill("2024");
  await expect(
    dialog.getByRole("button", { name: "Janeiro", exact: true }),
  ).toBeDisabled();
  await dialog.getByRole("button", { name: "Dezembro", exact: true }).click();
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await completeReview(page);
  await expect(page.getByText("Item salvo.", { exact: true })).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "Experiência", exact: true })
    .click();
  await page
    .locator(".admin-list .item-title")
    .getByText(title, { exact: true })
    .click();
  await expect(start).toHaveText("02/2024");
  await expect(end).toHaveText("12/2024");
  const rows = await (await page.request.get("/api/admin/experiencias")).json();
  expect(rows.find((item) => item.draft.titulo === title).draft.periodo).toBe(
    "02/2024 – 12/2024",
  );
  const updated = rows.find((item) => item.id === legacy.id);
  const removed = await page.request.delete(
    `/api/admin/experiencias/${legacy.id}`,
    { headers, data: { revision: updated.revision } },
  );
  expect(removed.ok()).toBe(true);
});
