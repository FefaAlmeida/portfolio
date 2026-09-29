import { expect } from "@playwright/test";

export async function completeReview(page) {
  await expect(page.locator(".admin-notice")).toContainText(
    /Item salvo\.|Rascunho salvo/,
  );
  const dialog = page.getByRole("dialog", {
    name: "Revisar traduções",
    exact: true,
  });
  if (!(await dialog.count())) return;
  await dialog
    .getByRole("button", { name: "Aprovar todas as propostas", exact: true })
    .click();
  await dialog
    .getByRole("button", {
      name: /Concluir (e publicar nos dois idiomas|revisão do rascunho)/,
    })
    .click();
  await expect(dialog).toHaveCount(0);
}
