import { readFileSync } from 'node:fs';
import { expect, test } from './fixtures';

const fixture = JSON.parse(
  readFileSync(
    new URL('../fixtures/public-routes.json', import.meta.url),
    'utf8',
  ),
) as { routes: Array<{ canonicalPath: string; outputPath: string }> };
const paths = fixture.routes
  .filter((route) => route.outputPath.endsWith('.html'))
  .map((route) => route.canonicalPath);

for (const path of paths) {
  test(`centered shell geometry and utility typography hold on ${path}`, async ({
    page,
  }) => {
    await page.goto(path);
    const viewport = page.viewportSize()!;
    if (path !== '/') {
      const content = page.locator(
        '.collection-index, .article-page, .detail-page, .utility-page',
      );
      expect((await content.boundingBox())!.width).toBeLessThanOrEqual(720);
      expect(
        await page
          .locator('h1')
          .evaluate((node) => parseFloat(getComputedStyle(node).fontSize)),
      ).toBeLessThanOrEqual(36);
    }
    const header = page.locator('.identity-rail');
    if (viewport.width > 820) {
      await expect(header).toBeVisible();
      const box = await header.boundingBox();
      const main = await page.locator('.site-frame').boundingBox();
      expect(box!.width).toBeLessThanOrEqual(1120);
      expect(Math.abs(box!.x - main!.x)).toBeLessThanOrEqual(1);
      expect(main!.y).toBeGreaterThanOrEqual(box!.y + box!.height);
    } else {
      await expect(header).toBeHidden();
      await expect(page.locator('.mobile-header')).toBeVisible();
    }
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
    expect(
      await page.locator('[data-utility-label]').evaluateAll((nodes) =>
        nodes
          .filter((node) => node.getBoundingClientRect().width > 0)
          .every((node) => {
            const size = Number.parseFloat(getComputedStyle(node).fontSize);
            return size >= 10 && size <= 12;
          }),
      ),
    ).toBe(true);
  });
}

test('mobile navigation, primary keyboard focus, and article TOC expand', async ({
  page,
}) => {
  test.skip(test.info().project.name !== 'phone');
  await page.goto('/listwithme/');
  await page.locator('details.mobile-nav > summary').click();
  await expect(page.locator('details.mobile-nav')).toHaveAttribute('open', '');
  const primary = page.locator('[data-action-role="primary"]');
  await primary.focus();
  await expect(primary).toBeFocused();
  await page.goto('/2026/02/24/listwithme-returns.html');
  const toc = page.locator('details[data-toc-state="disclosure"]');
  await toc.locator('summary').click();
  await expect(toc).toHaveAttribute('open', '');
});

for (const [family, path] of [
  ['Article', '/2026/02/24/listwithme-returns.html'],
  ['Index', '/blog/'],
  ['Detail', '/listwithme/'],
] as const) {
  test(`900px ${family} uses compact semantic flow`, async ({ page }) => {
    test.skip(test.info().project.name !== 'mid-layout');
    await page.goto(path);
    await expect(page.locator('.identity-rail')).toBeVisible();
    await expect(page.locator('.mobile-header')).toBeHidden();
    expect(
      await page
        .locator('.identity-rail')
        .evaluate((node) => node.getBoundingClientRect().width),
    ).toBe(852);
    const mastheadSelector = {
      Article: '.article-masthead',
      Index: '.collection-masthead',
      Detail: '.dossier-head',
    }[family];
    const mastheadGrid = await page
      .locator(mastheadSelector)
      .evaluate((node) => ({
        display: getComputedStyle(node).display,
        columns: getComputedStyle(node).gridTemplateColumns,
      }));
    expect(mastheadGrid.display).toBe('grid');
    expect(mastheadGrid.columns).not.toBe('none');
    expect(mastheadGrid.columns.split(' ')).toHaveLength(1);
    if (family === 'Article') {
      expect(
        await page
          .locator('.article-facts')
          .evaluate((node) => getComputedStyle(node).position),
      ).toBe('static');
      const tocBottom = await page
        .locator('[data-toc-state="disclosure"]')
        .evaluate((node) => node.getBoundingClientRect().bottom);
      const proseTop = await page
        .locator('[data-article-prose]')
        .evaluate((node) => node.getBoundingClientRect().top);
      expect(tocBottom).toBeLessThanOrEqual(proseTop);
    }
    if (family === 'Detail') {
      expect(
        await page
          .locator('.fact-ledger')
          .evaluate((node) => getComputedStyle(node).position),
      ).toBe('static');
      expect(
        await page
          .locator('[data-context-ledger]')
          .evaluate((node) => getComputedStyle(node).position),
      ).not.toBe('sticky');
    }
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
  });
}
