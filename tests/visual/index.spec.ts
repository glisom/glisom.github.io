import {
  baseline,
  capturePair,
  comparisonMode,
  prepareApprovedMockup,
  test,
} from './helpers';

const variants = [
  ['blog', '/blog/'],
  ['app-library', '/app-library/'],
  ['my-apps', '/projects/'],
  ['skill-library', '/skill-library/'],
  ['my-skills', '/skills/'],
] as const;

for (const [variant, path] of variants) baseline(`index-${variant}`, path);

for (const [variant, path] of variants) {
  test(`capture ${variant} index comparison`, async ({ page }, testInfo) => {
    test.skip(
      !comparisonMode ||
        (variant !== 'blog' && testInfo.project.name === 'tablet'),
    );
    await capturePair(
      page,
      `index-${variant}-${testInfo.project.name}`,
      'http://127.0.0.1:4174/index-family-approved.html',
      path,
      async (reference) =>
        prepareApprovedMockup(reference, {
          family: 'index',
          project: testInfo.project.name as 'desktop' | 'tablet' | 'phone',
          variant,
        }),
      undefined,
      { includeFullPage: true },
    );
  });
}
