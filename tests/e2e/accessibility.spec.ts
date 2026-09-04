import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { expect, interceptThirdParties, test } from './fixtures';

const representativePages = [
  '/',
  '/blog/',
  '/2026/02/24/listwithme-returns.html',
  '/listwithme/',
  '/listwithme/support/',
];
const routeFixture = JSON.parse(
  readFileSync(
    new URL('../fixtures/public-routes.json', import.meta.url),
    'utf8',
  ),
) as { routes: Array<{ canonicalPath: string; kind: string }> };

for (const path of representativePages) {
  test(`axe finds no A/AA or best-practice violations on ${path}`, async ({
    page,
  }) => {
    await interceptThirdParties(page);
    await page.goto(path);
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'])
      .analyze();
    expect(
      result.violations,
      JSON.stringify(result.violations, null, 2),
    ).toEqual([]);
  });
}

test('keyboard order reaches skip link, identity, and primary content in document order', async ({
  page,
}) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Skip to content' }),
  ).toBeFocused();
  await page.keyboard.press('Tab');
  const focusedName = await page.locator(':focus').getAttribute('aria-label');
  const focusedText = (await page.locator(':focus').innerText()).trim();
  expect(`${focusedName ?? ''} ${focusedText}`).toContain('Grant Isom');
});

test('paper, blue, lime, and black surfaces retain visible computed focus indicators', async ({
  page,
}) => {
  const cases = [
    [
      '/blog/',
      test.info().project.name === 'phone'
        ? 'details.mobile-nav > summary'
        : '.identity-rail a[href="/blog/"]',
    ],
    ['/listwithme/', '[data-action-role="primary"]'],
    ['/', '.home-hero .primary-action'],
    ['/', '[data-surface="black"] a'],
  ] as const;
  for (const [path, selector] of cases) {
    await page.goto(path);
    const target = page.locator(selector).first();
    await target.focus();
    const indicator = await target.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        width: Number.parseFloat(style.outlineWidth),
        style: style.outlineStyle,
        color: style.outlineColor,
      };
    });
    expect(indicator.width, `${path} ${selector}`).toBeGreaterThanOrEqual(2);
    expect(indicator.style).not.toBe('none');
    expect(indicator.color).not.toBe('rgba(0, 0, 0, 0)');
  }
});

test('every emitted caption is semantically associated with its figure', async ({
  page,
}) => {
  let total = 0;
  for (const path of [
    '/',
    '/2026/02/24/listwithme-returns.html',
    '/listwithme/',
  ]) {
    await interceptThirdParties(page);
    await page.goto(path);
    const associations = await page
      .locator('figcaption')
      .evaluateAll((captions) =>
        captions.map((caption) => ({
          parent: caption.parentElement?.tagName,
          figures: caption.closest('figure') ? 1 : 0,
        })),
      );
    total += associations.length;
    expect(
      associations.every(
        ({ parent, figures }) => parent === 'FIGURE' && figures === 1,
      ),
      path,
    ).toBe(true);
  }
  expect(total).toBeGreaterThan(0);
});

test('touch-width controls expose labels without hover', async ({ page }) => {
  test.skip(test.info().project.name !== 'phone');
  for (const path of ['/', '/blog/', '/listwithme/']) {
    await page.goto(path);
    const names = await page
      .locator('a:visible, button:visible, summary:visible')
      .evaluateAll((nodes) =>
        nodes.map((node) =>
          (node.getAttribute('aria-label') || node.textContent || '').trim(),
        ),
      );
    expect(names.length, path).toBeGreaterThan(0);
    expect(names.every(Boolean), `${path}: ${JSON.stringify(names)}`).toBe(
      true,
    );
  }
});

test('every phone control, including prose links, renders a 44px hit rectangle', async ({
  page,
}) => {
  test.skip(test.info().project.name !== 'phone');
  const paths = routeFixture.routes
    .filter(
      ({ kind, canonicalPath }) =>
        ['page', 'post'].includes(kind) && canonicalPath !== '/404.html',
    )
    .map(({ canonicalPath }) => canonicalPath);
  const failures: string[] = [];
  for (const path of paths) {
    await interceptThirdParties(page);
    await page.goto(path);
    const undersized = await page
      .locator('a, button, summary, input, select, textarea')
      .evaluateAll((nodes) =>
        nodes.flatMap((node) => {
          const style = getComputedStyle(node);
          const rect = node.getBoundingClientRect();
          if (
            style.display === 'none' ||
            style.visibility === 'hidden' ||
            rect.width === 0 ||
            rect.height === 0
          )
            return [];
          return rect.width + 0.01 >= 44 && rect.height + 0.01 >= 44
            ? []
            : [
                `${node.tagName.toLowerCase()}[${node.getAttribute('href') ?? node.textContent?.trim().slice(0, 30) ?? ''}] ${rect.width.toFixed(1)}×${rect.height.toFixed(1)}`,
              ];
        }),
      );
    failures.push(...undersized.map((failure) => `${path} ${failure}`));
  }
  expect(failures, failures.join('\n')).toEqual([]);
});

test('reduced motion computes zero durations and disables smooth scrolling', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const path of ['/', '/2019/05/30/listwithme.html']) {
    await page.goto(path);
    const failures = await page.locator('*').evaluateAll((nodes) => {
      const nonzero = (value: string) =>
        value.split(',').some((part) => Number.parseFloat(part) !== 0);
      return nodes.flatMap((node) => {
        const style = getComputedStyle(node);
        return nonzero(style.animationDuration) ||
          nonzero(style.transitionDuration)
          ? [
              `${node.tagName}.${node.className}: animation ${style.animationDuration}, transition ${style.transitionDuration}`,
            ]
          : [];
      });
    });
    expect(failures, failures.join('\n')).toEqual([]);
    expect(
      await page
        .locator('html')
        .evaluate((node) => getComputedStyle(node).scrollBehavior),
    ).not.toBe('smooth');
  }
});

test('comments request is lazy and occurs exactly once near the comments region', async ({
  page,
}) => {
  const requests: string[] = [];
  await page.route('https://utteranc.es/**', async (route) => {
    requests.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: 'text/javascript',
      body: '',
    });
  });
  await page.goto('/2019/05/30/listwithme.html');
  await expect(page.locator('[data-comments]')).toHaveCount(1);
  expect(requests).toEqual([]);
  await expect(
    page.locator(
      '[data-utterances-mount] script[src="https://utteranc.es/client.js"]',
    ),
  ).toHaveCount(0);
  await page.locator('[data-comments]').scrollIntoViewIfNeeded();
  await expect.poll(() => requests.length).toBe(1);
  await expect(
    page.locator(
      '[data-utterances-mount] script[src="https://utteranc.es/client.js"]',
    ),
  ).toHaveCount(1);
  await page.locator('[data-comments]').scrollIntoViewIfNeeded();
  expect(requests).toHaveLength(1);
});

test('every authored migrated iframe is lazy and has a source-equal linked fallback', async ({
  page,
}) => {
  await interceptThirdParties(page);
  await page.goto('/2020/02/10/2019-playlists.html');
  const embeds = page.locator('figure[data-migrated-embed]');
  await expect(embeds).toHaveCount(4);
  for (const embed of await embeds.all()) {
    const iframe = embed.locator('iframe');
    await expect(iframe).toHaveAttribute('loading', 'lazy');
    const source = await iframe.getAttribute('src');
    await expect(embed.locator('[data-embed-fallback] a')).toHaveAttribute(
      'href',
      source!,
    );
  }
});
