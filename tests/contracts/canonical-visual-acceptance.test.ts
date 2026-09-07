import { createHash } from 'node:crypto';
import {
  access,
  copyFile,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
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
const approvedReviewManifestChecksum =
  '2fcbaf1d1113287735efe933326becb847ff1110ea3caf294a0d11b6fe6f715f';
const approvedCombinedListChecksum =
  '6c4d4505600cff0be629de6bf010bda01ad1484e707148de65ad89fe579e07f7';
const snapshotDirectories = [
  'tests/visual/article.spec.ts-snapshots',
  'tests/visual/detail.spec.ts-snapshots',
  'tests/visual/homepage.spec.ts-snapshots',
  'tests/visual/index.spec.ts-snapshots',
];
const temporaryRoots: string[] = [];
const platformDescriptor = Object.getOwnPropertyDescriptor(process, 'platform');
const architectureDescriptor = Object.getOwnPropertyDescriptor(process, 'arch');

if (!platformDescriptor || !architectureDescriptor) {
  throw new Error('Node process host descriptors are unavailable.');
}

beforeAll(() => {
  Object.defineProperty(process, 'platform', {
    ...platformDescriptor,
    value: 'linux',
  });
  Object.defineProperty(process, 'arch', {
    ...architectureDescriptor,
    value: 'x64',
  });
});

afterAll(() => {
  Object.defineProperty(process, 'platform', platformDescriptor);
  Object.defineProperty(process, 'arch', architectureDescriptor);
});

afterEach(async () => {
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

function sha256(bytes: Buffer) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function temporaryRoot() {
  const directory = await mkdtemp(join(tmpdir(), 'task-14-canonical-'));
  temporaryRoots.push(directory);
  return directory;
}

async function pathExists(path: string) {
  return access(path).then(
    () => true,
    () => false,
  );
}

async function withApprovedProcessHost<T>(operation: () => Promise<T>) {
  const currentPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
  const currentArchitecture = Object.getOwnPropertyDescriptor(process, 'arch');
  if (!currentPlatform || !currentArchitecture) {
    throw new Error('Node process host descriptors are unavailable.');
  }
  Object.defineProperty(process, 'platform', {
    ...currentPlatform,
    value: approvedHost.platform,
  });
  Object.defineProperty(process, 'arch', {
    ...currentArchitecture,
    value: approvedHost.architecture,
  });
  try {
    return await operation();
  } finally {
    Object.defineProperty(process, 'platform', currentPlatform);
    Object.defineProperty(process, 'arch', currentArchitecture);
  }
}

async function linkApprovedSources(fixtureRoot: string) {
  await mkdir(join(fixtureRoot, 'docs/qa'), { recursive: true });
  await symlink(
    join(root, 'docs/qa/visual-comparisons'),
    join(fixtureRoot, 'docs/qa/visual-comparisons'),
    'dir',
  );
  await symlink(join(root, 'node_modules'), join(fixtureRoot, 'node_modules'));
  for (const directory of snapshotDirectories) {
    await mkdir(join(fixtureRoot, directory, '..'), { recursive: true });
    await symlink(join(root, directory), join(fixtureRoot, directory), 'dir');
  }
}

async function snapshotState(paths: string[]) {
  return Promise.all(
    paths.map(async (path) => {
      const [bytes, metadata] = await Promise.all([
        readFile(path),
        stat(path, { bigint: true }),
      ]);
      return {
        path,
        sha256: sha256(bytes),
        modified: metadata.mtimeNs,
      };
    }),
  );
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
  const reviewBytes = await readFile(reviewManifestPath);
  const manifest = (
    canonical.buildCanonicalVisualManifest as (
      review: Buffer,
      host: typeof approvedHost,
    ) => {
      status: string;
      approval: { date: string; context: string };
      host: typeof approvedHost;
      count: number;
      reviewManifestChecksum: string;
      approvedCombinedListChecksum: string;
      snapshotDirectories: string[];
      entries: Array<{
        name: string;
        route: string;
        viewport: { width: number; height: number };
        state: string;
        sourceChecksum: string;
        approvedComparisonChecksum: string;
        implementationPath: string;
        implementationChecksum: string;
        snapshotPath: string;
        snapshotChecksum: string;
      }>;
    }
  )(reviewBytes, approvedHost);

  expect(manifest.status).toBe('approved-canonical');
  expect(manifest.approval).toEqual({
    date: '2026-09-04',
    context:
      'Grant approved all 55 combined Task 14 Step 6 captures as the canonical macOS arm64 / pinned Playwright Chromium baseline set.',
  });
  expect(manifest.host).toEqual(approvedHost);
  expect(manifest.reviewManifestChecksum).toBe(approvedReviewManifestChecksum);
  expect(manifest.approvedCombinedListChecksum).toBe(
    approvedCombinedListChecksum,
  );
  expect(manifest.snapshotDirectories).toEqual(snapshotDirectories);
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
    expect(entry.implementationPath).toMatch(
      /^docs\/qa\/visual-comparisons\/raw\/.+\.png$/,
    );
    expect(entry.implementationChecksum).toMatch(/^[a-f0-9]{64}$/);
    expect(entry.snapshotPath).toMatch(
      /^tests\/visual\/(article|detail|homepage|index)\.spec\.ts-snapshots\/.+-darwin\.png$/,
    );
    expect(entry.snapshotChecksum).toBe(entry.implementationChecksum);
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
    implementationPath:
      'docs/qa/visual-comparisons/raw/article-listwithme-phone-full-page-implementation.png',
    implementationChecksum:
      '169e70567f4d26422d26eb8ebcc0c787849097c042cb4d2907c6482c38c38d64',
    snapshotPath:
      'tests/visual/article.spec.ts-snapshots/article-listwithme-full-page-phone-darwin.png',
    snapshotChecksum:
      '169e70567f4d26422d26eb8ebcc0c787849097c042cb4d2907c6482c38c38d64',
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

  expect(() =>
    (
      canonical.buildCanonicalVisualManifest as (
        review: Buffer,
        host: typeof approvedHost,
      ) => unknown
    )(Buffer.concat([reviewBytes, Buffer.from(' ')]), approvedHost),
  ).toThrow(/review manifest checksum/i);
});

test('runtime rejects snapshot rewrite modes and binds every snapshot byte to its approved implementation capture', async () => {
  expect(canonical.assertCanonicalVisualRuntime).toBeTypeOf('function');
  const assertCanonicalVisualRuntime =
    canonical.assertCanonicalVisualRuntime as (options: {
      root?: string;
      updateSnapshots?: 'all' | 'changed' | 'missing' | 'none';
    }) => Promise<void>;

  await expect(
    assertCanonicalVisualRuntime({ root, updateSnapshots: 'all' }),
  ).rejects.toThrow(/snapshot update mode.*not authorized/i);
  await expect(
    assertCanonicalVisualRuntime({ root, updateSnapshots: 'changed' }),
  ).rejects.toThrow(/snapshot update mode.*not authorized/i);
  await expect(
    assertCanonicalVisualRuntime({ root, updateSnapshots: 'none' }),
  ).rejects.toThrow(/canonical visual host mismatch.*platform.*architecture/i);
  await withApprovedProcessHost(() =>
    expect(
      assertCanonicalVisualRuntime({ root, updateSnapshots: 'missing' }),
    ).resolves.toBeUndefined(),
  );
});

test('runtime rejects an altered or extra snapshot without changing approved sources', async () => {
  expect(canonical.assertCanonicalVisualArtifacts).toBeTypeOf('function');
  const assertCanonicalVisualArtifacts =
    canonical.assertCanonicalVisualArtifacts as (options?: {
      root?: string;
    }) => Promise<void>;
  const fixtureRoot = await temporaryRoot();
  await mkdir(join(fixtureRoot, 'docs/design'), { recursive: true });
  await symlink(
    canonicalRoot,
    join(fixtureRoot, 'docs/design/baselines'),
    'dir',
  );
  await mkdir(join(fixtureRoot, 'docs/qa'), { recursive: true });
  await symlink(
    join(root, 'docs/qa/visual-comparisons'),
    join(fixtureRoot, 'docs/qa/visual-comparisons'),
    'dir',
  );
  for (const directory of snapshotDirectories) {
    await mkdir(join(fixtureRoot, directory), { recursive: true });
    for (const name of await readdir(join(root, directory))) {
      await copyFile(
        join(root, directory, name),
        join(fixtureRoot, directory, name),
      );
    }
  }

  const alteredSnapshot = join(
    fixtureRoot,
    'tests/visual/article.spec.ts-snapshots/article-listwithme-full-page-phone-darwin.png',
  );
  await writeFile(alteredSnapshot, 'unreviewed pixels');
  await expect(
    assertCanonicalVisualArtifacts({ root: fixtureRoot }),
  ).rejects.toThrow(/snapshot.*approved implementation/i);

  await copyFile(
    join(
      root,
      'tests/visual/article.spec.ts-snapshots/article-listwithme-full-page-phone-darwin.png',
    ),
    alteredSnapshot,
  );
  await writeFile(
    join(
      fixtureRoot,
      'tests/visual/article.spec.ts-snapshots/unapproved-extra-darwin.png',
    ),
    'extra pixels',
  );
  await expect(
    assertCanonicalVisualArtifacts({ root: fixtureRoot }),
  ).rejects.toThrow(/unapproved snapshot/i);
});

test('acceptance rejects an unapproved review-manifest checksum before creating output', async () => {
  expect(canonical.acceptCanonicalVisualBaselines).toBeTypeOf('function');
  const acceptCanonicalVisualBaselines =
    canonical.acceptCanonicalVisualBaselines as (options?: {
      root?: string;
      reviewManifestPath?: string;
      canonicalRoot?: string;
    }) => Promise<unknown>;
  const fixtureRoot = await temporaryRoot();
  const wrongReview = join(fixtureRoot, 'review-manifest.json');
  const output = join(fixtureRoot, 'baselines');
  await writeFile(
    wrongReview,
    `${await readFile(reviewManifestPath, 'utf8')} `,
  );

  await withApprovedProcessHost(() =>
    expect(
      acceptCanonicalVisualBaselines({
        root,
        reviewManifestPath: wrongReview,
        canonicalRoot: output,
      }),
    ).rejects.toThrow(/review manifest checksum/i),
  );
  expect(await pathExists(output)).toBe(false);
});

test('acceptance prevalidates a late corrupt source without leaving partial output', async () => {
  expect(canonical.acceptCanonicalVisualBaselines).toBeTypeOf('function');
  const acceptCanonicalVisualBaselines =
    canonical.acceptCanonicalVisualBaselines as (options?: {
      root?: string;
      canonicalRoot?: string;
    }) => Promise<unknown>;
  const fixtureRoot = await temporaryRoot();
  await mkdir(join(fixtureRoot, 'docs/qa/visual-comparisons/combined'), {
    recursive: true,
  });
  await symlink(
    join(root, 'docs/qa/visual-comparisons/raw'),
    join(fixtureRoot, 'docs/qa/visual-comparisons/raw'),
    'dir',
  );
  await copyFile(
    reviewManifestPath,
    join(fixtureRoot, 'docs/qa/visual-comparisons/manifest.json'),
  );
  const reviewManifest = JSON.parse(await readFile(reviewManifestPath, 'utf8'));
  const corruptName = 'interaction-mobile-browse-open-phone-viewport.png';
  for (const entry of reviewManifest.entries as Array<{ path: string }>) {
    const name = basename(entry.path);
    const destination = join(
      fixtureRoot,
      'docs/qa/visual-comparisons/combined',
      name,
    );
    if (name === corruptName) await writeFile(destination, 'corrupt source');
    else await symlink(join(root, entry.path), destination);
  }
  await symlink(join(root, 'node_modules'), join(fixtureRoot, 'node_modules'));
  for (const directory of snapshotDirectories) {
    await mkdir(join(fixtureRoot, directory, '..'), { recursive: true });
    await symlink(join(root, directory), join(fixtureRoot, directory), 'dir');
  }
  const output = join(fixtureRoot, 'docs/design/baselines');

  await withApprovedProcessHost(() =>
    expect(
      acceptCanonicalVisualBaselines({
        root: fixtureRoot,
        canonicalRoot: output,
      }),
    ).rejects.toThrow(/approved comparison.*checksum/i),
  );
  expect(await pathExists(output)).toBe(false);
  expect(
    (await readdir(join(fixtureRoot, 'docs/design')).catch(() => [])).filter(
      (name) => name.includes('accept'),
    ),
  ).toEqual([]);
});

test('acceptance permits only an exact no-write idempotent rerun once output exists', async () => {
  expect(canonical.acceptCanonicalVisualBaselines).toBeTypeOf('function');
  const acceptCanonicalVisualBaselines =
    canonical.acceptCanonicalVisualBaselines as (options?: {
      root?: string;
      canonicalRoot?: string;
    }) => Promise<unknown>;
  const trackedPaths = [
    canonicalManifestPath,
    join(canonicalRoot, 'homepage-desktop-viewport.png'),
    join(
      root,
      'tests/visual/homepage.spec.ts-snapshots/homepage-viewport-desktop-darwin.png',
    ),
  ];
  const before = await snapshotState(trackedPaths);
  await withApprovedProcessHost(() => acceptCanonicalVisualBaselines({ root }));
  expect(await snapshotState(trackedPaths)).toEqual(before);

  const fixtureRoot = await temporaryRoot();
  await linkApprovedSources(fixtureRoot);
  const corruptOutput = join(fixtureRoot, 'docs/design/baselines');
  await mkdir(corruptOutput, { recursive: true });
  const corruptPath = join(corruptOutput, 'homepage-desktop-viewport.png');
  await writeFile(corruptPath, 'existing corrupt bytes');
  const corruptBefore = await readFile(corruptPath);

  await withApprovedProcessHost(() =>
    expect(
      acceptCanonicalVisualBaselines({
        root: fixtureRoot,
        canonicalRoot: corruptOutput,
      }),
    ).rejects.toThrow(
      /existing canonical output is not an exact approved set/i,
    ),
  );
  expect(await readFile(corruptPath)).toEqual(corruptBefore);
  expect(await readdir(corruptOutput)).toEqual([
    'homepage-desktop-viewport.png',
  ]);
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
