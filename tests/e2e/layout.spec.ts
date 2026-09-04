import { expect, test } from './fixtures';

const paths = ['/', '/2019/05/30/listwithme.html', '/blog/', '/listwithme/'];

for (const path of paths) {
  test(`shell geometry and utility typography hold on ${path}`, async ({
    page,
  }) => {
    await page.goto(path);
    const viewport = page.viewportSize()!;
    const expectedRailWidth =
      viewport.width >= 1220 ? 250 : viewport.width >= 821 ? 210 : 0;
    const actualRailWidth = await page
      .locator('.identity-rail')
      .evaluate((node) => {
        const style = getComputedStyle(node);
        return style.display === 'none'
          ? 0
          : node.getBoundingClientRect().width;
      });
    const actualPrimaryLeft = await page
      .locator('.site-frame')
      .evaluate((node) => node.getBoundingClientRect().left);
    expect(Math.abs(actualRailWidth - expectedRailWidth)).toBeLessThanOrEqual(
      1,
    );
    expect(Math.abs(actualPrimaryLeft - expectedRailWidth)).toBeLessThanOrEqual(
      4,
    );
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
    expect(
      await page.locator('[data-utility-label]').evaluateAll((nodes) =>
        nodes.every((node) => {
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
    ).toBe(210);
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
        .locator('[data-toc-state="ledger"]')
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
