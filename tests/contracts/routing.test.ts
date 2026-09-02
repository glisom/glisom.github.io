import { describe, expect, it } from 'vitest';
import { canonicalPathToOutputPath } from '../../src/lib/content/routes';

describe('canonicalPathToOutputPath', () => {
  it.each([
    ['/', 'index.html'],
    ['/projects/hermes-ios/', 'projects/hermes-ios/index.html'],
    ['/2020/05/23/mac_apps.html', '2020/05/23/mac_apps.html'],
    ['/feed.xml', 'feed.xml'],
    ['/404.html', '404.html'],
  ])('maps %s to %s', (canonicalPath, outputPath) => {
    expect(canonicalPathToOutputPath(canonicalPath)).toBe(outputPath);
  });
});
