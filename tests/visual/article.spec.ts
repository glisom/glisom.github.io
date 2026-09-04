import {
  baseline,
  captureBeforeAfter,
  capturePair,
  comparisonMode,
  prepareApprovedMockup,
  test,
} from './helpers';

const article = '/2026/02/24/listwithme-returns.html';
baseline('article-listwithme', article);

const expandArticleToc = async (target: Parameters<typeof capturePair>[0]) =>
  target.locator('details[data-toc-state="disclosure"] > summary').click();

baseline('interaction-expanded-toc-phone', article, expandArticleToc);

test('capture approved article comparison', async ({ page }, testInfo) => {
  test.skip(!comparisonMode);
  await capturePair(
    page,
    `article-listwithme-${testInfo.project.name}`,
    'http://127.0.0.1:4174/article-family-approved.html',
    article,
    async (reference) =>
      prepareApprovedMockup(reference, {
        family: 'article',
        project: testInfo.project.name as 'desktop' | 'tablet' | 'phone',
      }),
    undefined,
    { includeFullPage: true },
  );
});

test('capture expanded article TOC comparison', async ({ page }, testInfo) => {
  test.skip(!comparisonMode || testInfo.project.name !== 'phone');
  await captureBeforeAfter(
    page,
    'interaction-expanded-toc-phone',
    article,
    expandArticleToc,
    'details[data-toc-state="disclosure"] > summary',
  );
});
