import { expect, test } from './fixtures';

test('primary authored navigation paths work', async ({ page }) => {
  await page.goto('/');
  const article = page
    .locator('a[href="/2026/02/24/listwithme-returns.html"]')
    .first();
  await expect(article).toBeVisible();
  await article.click();
  await expect(page).toHaveURL(/\/2026\/02\/24\/listwithme-returns\.html$/);

  const desktopRail = page.locator(
    '.identity-rail[aria-label="Site navigation"]',
  );
  if (await desktopRail.isVisible()) {
    await desktopRail.getByRole('link', { name: 'Blog' }).click();
  } else {
    await page.locator('details.mobile-nav > summary').click();
    await page
      .locator('details.mobile-nav')
      .getByRole('link', { name: 'Blog' })
      .click();
  }
  await expect(page).toHaveURL(/\/blog\/$/);
});

test('article previous/next and feed destinations resolve', async ({
  page,
  request,
}) => {
  await page.goto('/2019/05/30/listwithme.html');
  const cards = page.locator('[data-post-navigation] a');
  expect(await cards.count()).toBeGreaterThan(0);
  for (const card of await cards.all()) {
    const href = await card.getAttribute('href');
    expect((await request.get(href!)).status()).toBe(200);
  }
  const rss = await request.get('/feed.xml');
  expect(rss.status()).toBe(200);
  expect(rss.headers()['content-type']).toMatch(/xml/);
});

test('ListWithMe utility links resolve to Support and Privacy', async ({
  page,
}) => {
  await page.goto('/listwithme/');
  const utility = page.locator('[data-utility-navigation]');
  await expect(utility.getByRole('link', { name: 'Support' })).toHaveAttribute(
    'href',
    '/listwithme/support/',
  );
  await expect(utility.getByRole('link', { name: 'Privacy' })).toHaveAttribute(
    'href',
    '/listwithme/privacy/',
  );
});

test('desktop rail marks the current collection', async ({ page }) => {
  test.skip(test.info().project.name === 'phone');
  await page.goto('/blog/');
  await expect(
    page.locator('.identity-rail').getByRole('link', { name: 'Blog' }),
  ).toHaveAttribute('aria-current', 'page');
});

test('phone Browse opens by keyboard and touch', async ({ page }) => {
  test.skip(test.info().project.name !== 'phone');
  await page.goto('/');
  const summary = page.locator('details.mobile-nav > summary');
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('details.mobile-nav')).toHaveAttribute('open', '');
  await summary.tap();
  await expect(page.locator('details.mobile-nav')).not.toHaveAttribute(
    'open',
    '',
  );
  await summary.tap();
  await expect(page.locator('details.mobile-nav')).toHaveAttribute('open', '');
});
