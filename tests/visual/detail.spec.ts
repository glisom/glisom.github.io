import {
  baseline,
  capturePair,
  comparisonMode,
  prepareApprovedMockup,
  test,
} from './helpers';

const variants = [['my-app', '/listwithme/']] as const;

for (const [variant, path] of variants) baseline(`detail-${variant}`, path);

for (const [variant, path] of variants) {
  test(`capture ${variant} detail comparison`, async ({ page }, testInfo) => {
    test.skip(!comparisonMode);
    await capturePair(
      page,
      `detail-${variant}-${testInfo.project.name}`,
      'http://127.0.0.1:4174/detail-family-approved.html',
      path,
      async (reference) =>
        prepareApprovedMockup(reference, {
          family: 'detail',
          project: testInfo.project.name as 'desktop' | 'tablet' | 'phone',
          variant,
        }),
      undefined,
      { includeFullPage: true },
    );
  });
}
