import {
  baseline,
  captureBeforeAfter,
  capturePair,
  comparisonMode,
  expect,
  test,
} from './helpers';

baseline('homepage', '/');

const focusPrimaryAction = async (
  target: Parameters<typeof capturePair>[0],
) => {
  const action = target.locator('.primary-action').first();
  await action.focus();
  await expect(action).toBeFocused();
};

const openMobileBrowse = async (target: Parameters<typeof capturePair>[0]) =>
  target.locator('details.mobile-nav > summary').click();

baseline('interaction-keyboard-focus-desktop', '/', focusPrimaryAction);
baseline('interaction-mobile-browse-open-phone', '/', openMobileBrowse);

test('capture homepage reference comparison', async ({ page }, testInfo) => {
  test.skip(!comparisonMode);
  await capturePair(
    page,
    `homepage-${testInfo.project.name}`,
    'http://127.0.0.1:4173/#top',
    '/',
    undefined,
    undefined,
    { includeFullPage: true },
  );
});

test('capture keyboard focus on homepage primary action comparison', async ({
  page,
}, testInfo) => {
  test.skip(!comparisonMode || testInfo.project.name !== 'desktop');
  await capturePair(
    page,
    'interaction-keyboard-focus-desktop',
    'http://127.0.0.1:4173/#top',
    '/',
    focusPrimaryAction,
    focusPrimaryAction,
  );
});

test('capture mobile Browse open comparison', async ({ page }, testInfo) => {
  test.skip(!comparisonMode || testInfo.project.name !== 'phone');
  await captureBeforeAfter(
    page,
    'interaction-mobile-browse-open-phone',
    '/',
    openMobileBrowse,
  );
});
