import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { makeComparison } from '../../scripts/make-comparison.mjs';

export const comparisonMode = process.env.CAPTURE_COMPARISONS === '1';
const root = join(process.cwd(), 'docs/qa/visual-comparisons');

export async function settle(page: Page) {
  await page.evaluate(async () => {
    await Promise.race([
      Promise.all([
        document.fonts.ready,
        Promise.all(
          [...document.images].map((image) =>
            image.complete ? undefined : image.decode().catch(() => undefined),
          ),
        ),
      ]),
      new Promise((resolve) => setTimeout(resolve, 2_000)),
    ]);
  });
}

export async function capturePair(
  page: Page,
  name: string,
  sourceUrl: string,
  implementationPath: string,
  prepareSource?: (page: Page) => Promise<void>,
  prepareImplementation?: (page: Page) => Promise<void>,
) {
  const raw = join(root, 'raw');
  const combined = join(root, 'combined');
  await Promise.all([
    mkdir(raw, { recursive: true }),
    mkdir(combined, { recursive: true }),
  ]);
  const sourcePath = join(raw, `${name}-reference.png`);
  const implementation = join(raw, `${name}-implementation.png`);
  await page.goto(sourceUrl);
  if (prepareSource) await prepareSource(page);
  await settle(page);
  await page.screenshot({ path: sourcePath });
  await page.goto(implementationPath);
  if (prepareImplementation) await prepareImplementation(page);
  await settle(page);
  await page.screenshot({ path: implementation });
  await makeComparison(
    sourcePath,
    implementation,
    join(combined, `${name}.png`),
  );
}

export function baseline(
  name: string,
  path: string,
  prepare?: (page: Page) => Promise<void>,
) {
  test(`canonical ${name}`, async ({ page }) => {
    test.skip(
      comparisonMode,
      'Comparison capture does not accept canonical baselines.',
    );
    expect(
      `${process.platform}-${process.arch}`,
      'Pixel baselines are canonical only on macOS arm64.',
    ).toBe('darwin-arm64');
    await page.goto(path);
    if (prepare) await prepare(page);
    await settle(page);
    await expect(page).toHaveScreenshot(`${name}.png`, {
      animations: 'disabled',
    });
  });
}

export { test };
