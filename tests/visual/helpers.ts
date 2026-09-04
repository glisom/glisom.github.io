import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { makeComparison } from '../../scripts/make-comparison.mjs';
import {
  canonicalCaptureSpecs,
  canonicalProjects,
  formatMediaDiagnostic,
  mockupControlsToHide,
  requiredVisualFontFaces,
  visualNetworkPolicy,
  type MockupFamily,
  type MediaDiagnostic,
  type VisualProject,
} from '../helpers/visual-contract';

export const comparisonMode = process.env.CAPTURE_COMPARISONS === '1';
const root = join(process.cwd(), 'docs/qa/visual-comparisons');
const localFontFaces = requiredVisualFontFaces().map(
  ([family, weight, style], index) => {
    const slug = family.toLowerCase().replaceAll(' ', '-');
    return {
      family,
      weight,
      style,
      url: `https://fonts.gstatic.com/task-14/${index}.woff2`,
      path: join(
        process.cwd(),
        'node_modules',
        '@fontsource',
        slug,
        'files',
        `${slug}-latin-${weight}-${style}.woff2`,
      ),
    };
  },
);
const localFontCss = localFontFaces
  .map(
    ({ family, weight, style, url }) =>
      `@font-face{font-family:"${family}";font-style:${style};font-weight:${weight};font-display:block;src:url("${url}") format("woff2")}`,
  )
  .join('\n');

const sourceMarkers = new Map([
  [
    'http://127.0.0.1:4173/',
    {
      selector: '#hero-title',
      text: /I build useful things.*and write what I learn/s,
    },
  ],
  [
    'http://127.0.0.1:4174/article-family-approved.html',
    { selector: 'h1', text: /Bringing ListWithMe Back to Life/ },
  ],
  [
    'http://127.0.0.1:4174/index-family-approved.html',
    { selector: '#masthead-title', text: /Things I’ve written/ },
  ],
  [
    'http://127.0.0.1:4174/detail-family-approved.html',
    { selector: '#record-title', text: /ListWithMe/ },
  ],
]);

export async function settle(page: Page, includeAllImages = false) {
  await page.evaluate(
    async ({ includeAllImages, timeout, fontFaces }) => {
      const ready = async () => {
        await document.fonts.ready;
        if (document.fonts.status !== 'loaded')
          throw new Error(`Font readiness ended in ${document.fonts.status}`);
        for (const [family, weight, style] of fontFaces) {
          const shorthand = `${style} ${weight} 16px "${family}"`;
          await document.fonts.load(shorthand, 'Release candidate');
          if (!document.fonts.check(shorthand, 'Release candidate'))
            throw new Error(`Required font face did not load: ${shorthand}`);
        }
        const images = [...document.images].filter((image) => {
          const rect = image.getBoundingClientRect();
          const style = getComputedStyle(image);
          if (
            style.display === 'none' ||
            style.visibility === 'hidden' ||
            rect.width === 0 ||
            rect.height === 0
          )
            return false;
          if (includeAllImages || image.loading !== 'lazy') return true;
          return rect.top < innerHeight && rect.bottom > 0;
        });
        await Promise.all(images.map((image) => image.decode()));
        const broken = images.filter(
          (image) => !image.complete || image.naturalWidth === 0,
        );
        if (broken.length)
          throw new Error(
            `Media readiness failed: ${broken.map((image) => image.currentSrc || image.src).join(', ')}`,
          );
      };
      let timer: ReturnType<typeof setTimeout> | undefined;
      await Promise.race([
        ready(),
        new Promise((_, reject) => {
          timer = setTimeout(() => {
            const status = fontFaces
              .map(([family, weight, style]) => {
                const shorthand = `${style} ${weight} 16px "${family}"`;
                return `${shorthand}=${document.fonts.check(shorthand, 'Release candidate')}`;
              })
              .join(', ');
            const media = [...document.images]
              .map((image) => {
                const context = image.closest(
                  '[data-record], [data-pane], figure, article, section',
                );
                let nearest = '(none)';
                if (context) {
                  if (context.id) nearest = `#${context.id}`;
                  else if (context.hasAttribute('data-record'))
                    nearest = `[data-record="${context.getAttribute('data-record')}"]`;
                  else if (context.hasAttribute('data-pane'))
                    nearest = `[data-pane="${context.getAttribute('data-pane')}"]`;
                  else {
                    const className = [...context.classList].join('.');
                    nearest = `${context.tagName.toLowerCase()}${className ? `.${className}` : ''}`;
                  }
                }
                return `url=${image.src} loading=${image.loading} complete=${image.complete} naturalWidth=${image.naturalWidth} currentSrc=${image.currentSrc} nearest=${nearest}`;
              })
              .join(', ');
            reject(
              new Error(
                `Font/media readiness exceeded ${timeout}ms; ${document.fonts.status}; ${status}; media: ${media}`,
              ),
            );
          }, timeout);
        }),
      ]).finally(() => clearTimeout(timer));
    },
    {
      includeAllImages,
      timeout: 10_000,
      fontFaces: requiredVisualFontFaces(),
    },
  );
}

async function revealLazyMediaAndRestore(page: Page) {
  const saved = await page.evaluate(() => ({ x: scrollX, y: scrollY }));
  const images = page.locator('img');
  for (let index = 0; index < (await images.count()); index += 1) {
    const image = images.nth(index);
    const rendered = await image.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        rect.width > 0 &&
        rect.height > 0
      );
    });
    if (!rendered) continue;
    await image.scrollIntoViewIfNeeded();
    try {
      await expect
        .poll(
          () =>
            image.evaluate((node) => {
              const candidate = node as HTMLImageElement;
              return candidate.complete && candidate.naturalWidth > 0
                ? candidate.naturalWidth
                : 0;
            }),
          { message: `Rendered lazy image ${index + 1} did not load` },
        )
        .toBeGreaterThan(0);
    } catch (error) {
      const diagnostic = await image.evaluate((node): MediaDiagnostic => {
        const candidate = node as HTMLImageElement;
        const nearest = candidate.closest(
          '[data-record], [data-pane], figure, article, section',
        );
        let nearestSelector = '(none)';
        if (nearest) {
          if (nearest.id) nearestSelector = `#${nearest.id}`;
          else if (nearest.hasAttribute('data-record'))
            nearestSelector = `[data-record="${nearest.getAttribute('data-record')}"]`;
          else if (nearest.hasAttribute('data-pane'))
            nearestSelector = `[data-pane="${nearest.getAttribute('data-pane')}"]`;
          else {
            const className = [...nearest.classList].join('.');
            nearestSelector = `${nearest.tagName.toLowerCase()}${className ? `.${className}` : ''}`;
          }
        }
        return {
          url: candidate.src,
          loading: candidate.loading,
          complete: candidate.complete,
          naturalWidth: candidate.naturalWidth,
          currentSrc: candidate.currentSrc,
          nearest: nearestSelector,
        };
      });
      throw new Error(
        `Rendered lazy image ${index + 1} did not load: ${formatMediaDiagnostic(diagnostic)}`,
        { cause: error },
      );
    }
    await image.evaluate((node) => (node as HTMLImageElement).decode());
  }
  await settle(page, true);
  await page.evaluate(({ x, y }) => scrollTo(x, y), saved);
  await expect
    .poll(() => page.evaluate(() => ({ x: scrollX, y: scrollY })))
    .toEqual(saved);
}

async function installVisualNetworkBoundary(page: Page) {
  await page.route(/^https?:\/\//, async (route) => {
    const url = new URL(route.request().url());
    if (visualNetworkPolicy(url.href) === 'continue') {
      await route.continue();
      return;
    }
    if (url.hostname === 'fonts.googleapis.com') {
      await route.fulfill({
        status: 200,
        contentType: 'text/css; charset=utf-8',
        body: localFontCss,
      });
      return;
    }
    if (url.hostname === 'fonts.gstatic.com') {
      const face = localFontFaces.find(
        ({ url: fontUrl }) => fontUrl === url.href,
      );
      if (!face) throw new Error(`Unexpected local font request: ${url.href}`);
      await route.fulfill({
        status: 200,
        contentType: 'font/woff2',
        body: await readFile(face.path),
      });
      return;
    }
    if (url.hostname === 'utteranc.es') {
      await route.fulfill({
        status: 200,
        contentType: 'text/javascript',
        body: '',
      });
      return;
    }
    if (url.hostname === 'open.spotify.com') {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!doctype html><title>Intercepted Spotify embed</title>',
      });
      return;
    }
    throw new Error(`Unexpected cross-origin visual request: ${url.href}`);
  });
}

export async function captureBeforeAfter(
  page: Page,
  name: string,
  implementationPath: string,
  prepareOpen: (page: Page) => Promise<void>,
  anchorSelector?: string,
) {
  await installVisualNetworkBoundary(page);
  const raw = join(root, 'raw');
  const combined = join(root, 'combined');
  await Promise.all([
    mkdir(raw, { recursive: true }),
    mkdir(combined, { recursive: true }),
  ]);
  await page.goto(implementationPath);
  await settle(page);
  let anchorTop: number | undefined;
  if (anchorSelector) {
    const anchor = page.locator(anchorSelector);
    await anchor.scrollIntoViewIfNeeded();
    anchorTop = await anchor.evaluate(
      (node) => node.getBoundingClientRect().top,
    );
  }
  const closed = join(raw, `${name}-viewport-closed.png`);
  const open = join(raw, `${name}-viewport-open.png`);
  await page.screenshot({ path: closed });
  await prepareOpen(page);
  if (anchorSelector && anchorTop !== undefined) {
    const currentTop = await page
      .locator(anchorSelector)
      .evaluate((node) => node.getBoundingClientRect().top);
    await page.evaluate((delta) => scrollBy(0, delta), currentTop - anchorTop);
    await expect
      .poll(() =>
        page
          .locator(anchorSelector)
          .evaluate((node) => node.getBoundingClientRect().top),
      )
      .toBeCloseTo(anchorTop, 0);
  }
  await settle(page);
  await page.screenshot({ path: open });
  await makeComparison(closed, open, join(combined, `${name}-viewport.png`), {
    labels: { left: 'CLOSED', right: 'OPEN' },
  });
}

async function assertSourceMarker(page: Page, sourceUrl: string) {
  const key = new URL(sourceUrl);
  key.hash = '';
  const marker = sourceMarkers.get(key.href);
  if (!marker) throw new Error(`No approved source marker for ${key.href}`);
  await expect(page.locator(marker.selector).first()).toContainText(
    marker.text,
  );
}

export async function prepareApprovedMockup(
  page: Page,
  {
    family,
    project,
    variant,
  }: { family: MockupFamily; project: VisualProject; variant?: string },
) {
  if (family === 'index') {
    const selector = `${project === 'phone' ? '.mobile-collection-switcher' : '.side-nav'} [data-view="${variant ?? 'blog'}"]`;
    const button = page.locator(selector);
    await button.click();
    await expect(button).toHaveClass(/\bactive\b/);
    await expect(
      page.locator(`[data-pane="${variant ?? 'blog'}"].active`),
    ).toBeVisible();
  }
  if (family === 'detail') {
    const button = page.locator(`[data-detail="${variant ?? 'my-app'}"]`);
    await button.click();
    await expect(button).toHaveClass(/\bactive\b/);
    const expectedTitle = {
      'my-app': 'ListWithMe',
      'used-app': 'Obsidian',
      'used-skill': 'Deep Research',
      'my-skill': 'write-like-grant',
    }[variant ?? 'my-app'];
    await expect(page.locator('#record-title')).toContainText(expectedTitle!);
  }
  const controls = mockupControlsToHide(family, project);
  await page.locator(controls.join(', ')).evaluateAll((nodes) => {
    for (const node of nodes)
      (node as HTMLElement).style.setProperty('display', 'none', 'important');
  });
  for (const selector of controls)
    await expect(page.locator(selector)).toBeHidden();
}

export async function capturePair(
  page: Page,
  name: string,
  sourceUrl: string,
  implementationPath: string,
  prepareSource?: (page: Page) => Promise<void>,
  prepareImplementation?: (page: Page) => Promise<void>,
  { includeFullPage = false }: { includeFullPage?: boolean } = {},
) {
  await installVisualNetworkBoundary(page);
  const raw = join(root, 'raw');
  const combined = join(root, 'combined');
  await Promise.all([
    mkdir(raw, { recursive: true }),
    mkdir(combined, { recursive: true }),
  ]);
  const modes = includeFullPage
    ? (['viewport', 'full-page'] as const)
    : (['viewport'] as const);
  const sourcePaths = Object.fromEntries(
    modes.map((mode) => [mode, join(raw, `${name}-${mode}-reference.png`)]),
  ) as Record<(typeof modes)[number], string>;
  const implementationPaths = Object.fromEntries(
    modes.map((mode) => [
      mode,
      join(raw, `${name}-${mode}-implementation.png`),
    ]),
  ) as Record<(typeof modes)[number], string>;
  await page.goto(sourceUrl);
  await assertSourceMarker(page, sourceUrl);
  if (prepareSource) await prepareSource(page);
  await settle(page);
  for (const mode of modes) {
    if (mode === 'full-page') await revealLazyMediaAndRestore(page);
    await page.screenshot({
      path: sourcePaths[mode],
      fullPage: mode === 'full-page',
    });
  }
  await page.goto(implementationPath);
  if (prepareImplementation) await prepareImplementation(page);
  await settle(page);
  for (const mode of modes) {
    if (mode === 'full-page') await revealLazyMediaAndRestore(page);
    await page.screenshot({
      path: implementationPaths[mode],
      fullPage: mode === 'full-page',
    });
  }
  for (const mode of modes) {
    await makeComparison(
      sourcePaths[mode],
      implementationPaths[mode],
      join(combined, `${name}-${mode}.png`),
      { allowDimensionPadding: mode === 'full-page' },
    );
  }
}

export function baseline(
  name: string,
  path: string,
  prepare?: (page: Page) => Promise<void>,
) {
  test(`canonical ${name}`, async ({ page }, testInfo) => {
    test.skip(
      comparisonMode,
      'Comparison capture does not accept canonical baselines.',
    );
    test.skip(
      !canonicalProjects(name).includes(
        testInfo.project.name as 'desktop' | 'tablet' | 'phone',
      ),
      'This viewport is not part of the approved comparison matrix.',
    );
    expect(
      `${process.platform}-${process.arch}`,
      'Pixel baselines are canonical only on macOS arm64.',
    ).toBe('darwin-arm64');
    await installVisualNetworkBoundary(page);
    await page.goto(path);
    if (prepare) await prepare(page);
    await settle(page);
    for (const capture of canonicalCaptureSpecs(name)) {
      if (capture.preloadAllMedia) await revealLazyMediaAndRestore(page);
      await expect(page).toHaveScreenshot(capture.name, {
        animations: 'disabled',
        fullPage: capture.fullPage,
      });
    }
  });
}

export { expect, test };
