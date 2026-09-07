import { expect, test } from './fixtures';

test('detail registry spacing survives the shared utility cascade', async ({
  page,
}) => {
  await page.goto('/listwithme/');
  const expectedMargin = test.info().project.name === 'phone' ? 48 : 70;
  expect(
    await page
      .locator('.dossier-head .registry-line')
      .evaluate((node) =>
        Number.parseFloat(getComputedStyle(node).marginBottom),
      ),
  ).toBe(expectedMargin);
});
