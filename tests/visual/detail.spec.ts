import { baseline, capturePair, comparisonMode, test } from './helpers';

const variants = [
  ['my-app', '/listwithme/'],
  ['used-app', '/app-library/obsidian/'],
  ['used-skill', '/skill-library/deep-research/'],
  ['my-skill', '/skills/write-like-grant/'],
] as const;

for (const [variant, path] of variants) baseline(`detail-${variant}`, path);

for (const [variant, path] of variants) {
  test(`capture ${variant} detail comparison`, async ({ page }, testInfo) => {
    test.skip(
      !comparisonMode ||
        (variant !== 'my-app' && testInfo.project.name === 'tablet'),
    );
    await capturePair(
      page,
      `detail-${variant}-${testInfo.project.name}`,
      'http://127.0.0.1:4174/detail-family-approved.html',
      path,
      variant === 'my-app'
        ? undefined
        : async (reference) =>
            reference.locator(`[data-detail="${variant}"]`).click(),
    );
  });
}
