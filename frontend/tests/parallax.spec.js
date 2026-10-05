import { expect, test } from "@playwright/test";

async function photoOffsets(page) {
  return page
    .locator(
      "#inicio figure:visible .parallax-layer, #sobre figure:visible .parallax-layer",
    )
    .evaluateAll((layers) =>
      layers.map((layer) => {
        const transform = getComputedStyle(layer).transform;
        return transform === "none" ? 0 : new DOMMatrix(transform).m42;
      }),
    );
}

test("photos and decorative layers respond to scrolling without horizontal overflow", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.locator("#projetos .bubble-field .parallax-layer"),
  ).toHaveCount(5);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  const before = await photoOffsets(page);
  await page.evaluate(() => window.scrollTo({ top: 350, behavior: "instant" }));
  if (before.length) {
    await expect
      .poll(async () => (await photoOffsets(page))[0])
      .toBeLessThan(before[0] - 1);
    const after = await photoOffsets(page);
    expect(Math.abs(after[1] - before[1])).toBeGreaterThan(
      Math.abs(after[0] - before[0]),
    );
  } else {
    await expect(page.locator("#inicio figure img")).toHaveCount(1);
    await expect(page.locator("#inicio figure")).toHaveCSS("transform", "none");
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("reduced motion keeps photos stationary and hides bubbles, including preference changes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const stationary = page.viewportSize().width < 768 ? [] : [0, 0];
  await expect(page.locator("#projetos .bubble-field")).toBeHidden();
  expect(await photoOffsets(page)).toEqual(stationary);
  await page.evaluate(() => window.scrollTo({ top: 350, behavior: "instant" }));
  expect(await photoOffsets(page)).toEqual(stationary);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(
    page.locator("#projetos .bubble-field .parallax-layer"),
  ).toHaveCount(5);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("#projetos .bubble-field")).toBeHidden();
  expect(await photoOffsets(page)).toEqual(stationary);
});
