import { expect, test } from './fixtures';

test('detail registry spacing survives the shared utility cascade', async ({
  page,
}) => {
  await page.goto('/listwithme/');
  const expectedMargin = 24;
  expect(
    await page
      .locator('.dossier-head .registry-line')
      .evaluate((node) =>
        Number.parseFloat(getComputedStyle(node).marginBottom),
      ),
  ).toBe(expectedMargin);
});
