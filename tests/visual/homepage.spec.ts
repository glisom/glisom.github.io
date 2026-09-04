import { baseline, capturePair, comparisonMode, test } from './helpers';

baseline('homepage', '/');

test('capture homepage reference comparison', async ({ page }, testInfo) => {
  test.skip(!comparisonMode);
  await capturePair(
    page,
    `homepage-${testInfo.project.name}`,
    'http://127.0.0.1:4173/#top',
    '/',
  );
});

test('capture mobile Browse open comparison', async ({ page }, testInfo) => {
  test.skip(!comparisonMode || testInfo.project.name !== 'phone');
  await capturePair(
    page,
    'interaction-mobile-browse-open-phone',
    'http://127.0.0.1:4173/#top',
    '/',
    undefined,
    async (candidate) =>
      candidate.locator('details.mobile-nav > summary').click(),
  );
});
