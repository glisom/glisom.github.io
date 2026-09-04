import { baseline, capturePair, comparisonMode, test } from './helpers';

const article = '/2026/02/24/listwithme-returns.html';
baseline('article-listwithme', article);

test('capture approved article comparison', async ({ page }, testInfo) => {
  test.skip(!comparisonMode);
  await capturePair(
    page,
    `article-listwithme-${testInfo.project.name}`,
    'http://127.0.0.1:4174/article-family-approved.html',
    article,
  );
});

test('capture keyboard-focus comparison', async ({ page }, testInfo) => {
  test.skip(!comparisonMode || testInfo.project.name !== 'desktop');
  const focus = async (target: typeof page) => target.keyboard.press('Tab');
  await capturePair(
    page,
    'interaction-keyboard-focus-desktop',
    'http://127.0.0.1:4174/article-family-approved.html',
    article,
    focus,
    focus,
  );
});

test('capture expanded article TOC comparison', async ({ page }, testInfo) => {
  test.skip(!comparisonMode || testInfo.project.name !== 'phone');
  await capturePair(
    page,
    'interaction-expanded-toc-phone',
    'http://127.0.0.1:4174/article-family-approved.html',
    article,
    undefined,
    async (candidate) =>
      candidate
        .locator('details[data-toc-state="disclosure"] > summary')
        .click(),
  );
});
