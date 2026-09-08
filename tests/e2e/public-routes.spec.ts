import { readFileSync } from 'node:fs';
import { expect, test } from './fixtures';

const routeFixture = JSON.parse(
  readFileSync(
    new URL('../fixtures/public-routes.json', import.meta.url),
    'utf8',
  ),
) as { routes: Array<{ canonicalPath: string; kind: string }> };
const routes = routeFixture.routes.filter(
  ({ canonicalPath }) => canonicalPath !== '/404.html',
);

test('all 36 non-error public artifacts return their independently expected media type', async ({
  request,
}) => {
  expect(routes).toHaveLength(36);
  for (const route of routes) {
    const response = await request.get(route.canonicalPath);
    expect(response.status(), route.canonicalPath).toBe(200);
    const expected = ['/feed.xml', '/sitemap.xml'].includes(route.canonicalPath)
      ? /xml/
      : route.canonicalPath === '/robots.txt'
        ? /text\/plain/
        : /text\/html/;
    expect(response.headers()['content-type'], route.canonicalPath).toMatch(
      expected,
    );
  }
});

test('direct and genuinely missing 404 paths render the designed error body', async ({
  page,
  diagnostics,
}) => {
  let response = await page.goto('/404.html');
  expect([200, 404]).toContain(response?.status());
  await expect(page.locator('[data-site-404] h1')).toHaveText(
    "That page isn't here.",
  );
  await expect(page.locator('meta[name=robots]')).toHaveAttribute(
    'content',
    /noindex/,
  );
  const designedBody = await page.locator('[data-site-404]').innerText();

  response = await page.goto('/definitely-missing');
  expect(response?.status()).toBe(404);
  await expect(page.locator('[data-site-404] h1')).toHaveText(
    "That page isn't here.",
  );
  expect(await page.locator('[data-site-404]').innerText()).toBe(designedBody);
  await expect(page.locator('[data-home-page]')).toHaveCount(0);
  expect(diagnostics).toHaveLength(1);
  expect(diagnostics[0]).toMatch(
    /^console\.error: Failed to load resource: the server responded with a status of 404 \((?:Not Found)?\)$/,
  );
  diagnostics.length = 0;
});
