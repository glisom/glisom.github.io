import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { expect, test } from 'vitest';
import { canonicalBaselineMatrix } from '../helpers/visual-contract';

const root = process.cwd();
const reviewManifestPath = join(
  root,
  'docs/qa/visual-comparisons/manifest.json',
);
const canonicalRoot = join(root, 'docs/design/baselines');
const canonicalManifestPath = join(canonicalRoot, 'manifest.json');
const canonical = await import('../../scripts/lib/canonical-visual.mjs').catch(
  () => ({}) as Record<string, unknown>,
);

const approvedHost = {
  os: 'macOS',
  platform: 'darwin',
  architecture: 'arm64',
  playwrightVersion: '1.62.1',
  chromiumRevision: '1234',
  chromiumVersion: '151.0.7922.34',
};

function sha256(bytes: Buffer) {
  return createHash('sha256').update(bytes).digest('hex');
}

test('canonical visual host rejects any platform or pinned-browser mismatch', () => {
  expect(canonical.assertCanonicalVisualHost).toBeTypeOf('function');
  const assertCanonicalVisualHost = canonical.assertCanonicalVisualHost as (
    actual: typeof approvedHost,
    expected?: typeof approvedHost,
  ) => void;

  expect(() => assertCanonicalVisualHost(approvedHost)).not.toThrow();
  for (const [field, value] of [
    ['platform', 'linux'],
    ['architecture', 'x64'],
    ['playwrightVersion', '1.62.0'],
    ['chromiumRevision', '1233'],
    ['chromiumVersion', '151.0.7922.33'],
  ] as const) {
    expect(() =>
      assertCanonicalVisualHost({ ...approvedHost, [field]: value }),
    ).toThrow(new RegExp(`canonical visual host.*${field}`, 'i'));
  }
});

test('canonical manifest binds all 55 reviewed states to approval, host, route, viewport, state, and source checksum', async () => {
  expect(canonical.buildCanonicalVisualManifest).toBeTypeOf('function');
  const reviewManifest = JSON.parse(await readFile(reviewManifestPath, 'utf8'));
  const manifest = (
    canonical.buildCanonicalVisualManifest as (
      review: unknown,
      host: typeof approvedHost,
    ) => {
      status: string;
      approval: { date: string; context: string };
      host: typeof approvedHost;
      count: number;
      entries: Array<{
        name: string;
        route: string;
        viewport: { width: number; height: number };
        state: string;
        sourceChecksum: string;
        approvedComparisonChecksum: string;
      }>;
    }
  )(reviewManifest, approvedHost);

  expect(manifest.status).toBe('approved-canonical');
  expect(manifest.approval).toEqual({
    date: '2026-09-04',
    context:
      'Grant approved all 55 combined Task 14 Step 6 captures as the canonical macOS arm64 / pinned Playwright Chromium baseline set.',
  });
  expect(manifest.host).toEqual(approvedHost);
  expect(manifest.count).toBe(55);
  expect(manifest.entries).toHaveLength(55);
  expect(manifest.entries.map(({ name }) => name).toSorted()).toEqual(
    canonicalBaselineMatrix()
      .map(({ name, project, mode }) =>
        name.startsWith('interaction-')
          ? `${name}-${mode}.png`
          : `${name}-${project}-${mode}.png`,
      )
      .toSorted(),
  );
  for (const entry of manifest.entries) {
    expect(entry.route).toMatch(/^\//);
    expect(entry.viewport.width).toBeGreaterThan(0);
    expect(entry.viewport.height).toBeGreaterThan(0);
    expect(entry.state).not.toBe('');
    expect(entry.sourceChecksum).toMatch(/^[a-f0-9]{64}$/);
    expect(entry.approvedComparisonChecksum).toMatch(/^[a-f0-9]{64}$/);
  }
  expect(
    manifest.entries.find(
      ({ name }) => name === 'article-listwithme-phone-full-page.png',
    ),
  ).toMatchObject({
    route: '/2026/02/24/listwithme-returns.html',
    viewport: { width: 390, height: 844 },
    state: 'article-default',
    sourceChecksum:
      '9a0a6cbad2f74f4a9cf2b7e46b787eb08adb6c2e7a86ae04de08b5c0d40ae5a7',
    approvedComparisonChecksum:
      '71d97629cc688136eb988473119e6720cf635529b81167839ed8ca7a71d8c619',
  });
  expect(
    manifest.entries.find(
      ({ name }) =>
        name === 'interaction-mobile-browse-open-phone-viewport.png',
    ),
  ).toMatchObject({
    route: '/',
    viewport: { width: 390, height: 844 },
    state: 'mobile-browse-open',
  });
});

test('canonical baseline directory contains only byte-identical approved comparisons and its manifest', async () => {
  const reviewManifest = JSON.parse(await readFile(reviewManifestPath, 'utf8'));
  const canonicalManifest = await readFile(canonicalManifestPath, 'utf8').then(
    JSON.parse,
    () => null,
  );
  expect(canonicalManifest).not.toBeNull();
  expect(canonicalManifest.host).toEqual(approvedHost);

  const expectedNames = reviewManifest.entries
    .map(({ path }: { path: string }) => basename(path))
    .toSorted();
  const actualNames = (await readdir(canonicalRoot))
    .filter((name) => name.endsWith('.png'))
    .toSorted();
  expect(actualNames).toEqual(expectedNames);

  for (const reviewEntry of reviewManifest.entries as Array<{
    path: string;
    sha256: string;
  }>) {
    const approvedBytes = await readFile(join(root, reviewEntry.path));
    const canonicalBytes = await readFile(
      join(canonicalRoot, basename(reviewEntry.path)),
    );
    expect(canonicalBytes.equals(approvedBytes)).toBe(true);
    expect(sha256(canonicalBytes)).toBe(reviewEntry.sha256);
  }
  expect(canonicalManifest.count).toBe(55);
});
