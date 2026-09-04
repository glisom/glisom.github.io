import { createHash } from 'node:crypto';
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';

export const approvedCanonicalVisualHost = Object.freeze({
  os: 'macOS',
  platform: 'darwin',
  architecture: 'arm64',
  playwrightVersion: '1.62.1',
  chromiumRevision: '1234',
  chromiumVersion: '151.0.7922.34',
});

export const canonicalVisualApproval = Object.freeze({
  date: '2026-09-04',
  context:
    'Grant approved all 55 combined Task 14 Step 6 captures as the canonical macOS arm64 / pinned Playwright Chromium baseline set.',
});

export const approvedReviewManifestChecksum =
  '2fcbaf1d1113287735efe933326becb847ff1110ea3caf294a0d11b6fe6f715f';
export const approvedCombinedListChecksum =
  '6c4d4505600cff0be629de6bf010bda01ad1484e707148de65ad89fe579e07f7';

export const canonicalSnapshotDirectories = Object.freeze([
  'tests/visual/article.spec.ts-snapshots',
  'tests/visual/detail.spec.ts-snapshots',
  'tests/visual/homepage.spec.ts-snapshots',
  'tests/visual/index.spec.ts-snapshots',
]);

const reviewManifestRelativePath = 'docs/qa/visual-comparisons/manifest.json';

const viewports = Object.freeze({
  desktop: { width: 1586, height: 992 },
  tablet: { width: 1024, height: 768 },
  phone: { width: 390, height: 844 },
});

const approvedStates = Object.freeze([
  {
    name: 'homepage',
    route: '/',
    state: 'homepage-default',
    projects: ['desktop', 'tablet', 'phone'],
  },
  {
    name: 'article-listwithme',
    route: '/2026/02/24/listwithme-returns.html',
    state: 'article-default',
    projects: ['desktop', 'tablet', 'phone'],
  },
  {
    name: 'index-blog',
    route: '/blog/',
    state: 'blog-index',
    projects: ['desktop', 'tablet', 'phone'],
  },
  {
    name: 'index-app-library',
    route: '/app-library/',
    state: 'used-app-index',
    projects: ['desktop', 'phone'],
  },
  {
    name: 'index-my-apps',
    route: '/projects/',
    state: 'authored-app-index',
    projects: ['desktop', 'phone'],
  },
  {
    name: 'index-skill-library',
    route: '/skill-library/',
    state: 'used-skill-index',
    projects: ['desktop', 'phone'],
  },
  {
    name: 'index-my-skills',
    route: '/skills/',
    state: 'authored-skill-index',
    projects: ['desktop', 'phone'],
  },
  {
    name: 'detail-my-app',
    route: '/listwithme/',
    state: 'authored-app-detail',
    projects: ['desktop', 'tablet', 'phone'],
  },
  {
    name: 'detail-used-app',
    route: '/app-library/obsidian/',
    state: 'used-app-detail',
    projects: ['desktop', 'phone'],
  },
  {
    name: 'detail-used-skill',
    route: '/skill-library/deep-research/',
    state: 'used-skill-detail',
    projects: ['desktop', 'phone'],
  },
  {
    name: 'detail-my-skill',
    route: '/skills/write-like-grant/',
    state: 'authored-skill-detail',
    projects: ['desktop', 'phone'],
  },
  {
    name: 'interaction-mobile-browse-open-phone',
    route: '/',
    state: 'mobile-browse-open',
    projects: ['phone'],
    interaction: true,
  },
  {
    name: 'interaction-keyboard-focus-desktop',
    route: '/',
    state: 'primary-action-focused',
    projects: ['desktop'],
    interaction: true,
  },
  {
    name: 'interaction-expanded-toc-phone',
    route: '/2026/02/24/listwithme-returns.html',
    state: 'mobile-toc-expanded',
    projects: ['phone'],
    interaction: true,
  },
]);

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function sorted(values) {
  return [...values].sort((left, right) =>
    left < right ? -1 : left > right ? 1 : 0,
  );
}

function snapshotSuite(name) {
  if (name.startsWith('article-') || name === 'interaction-expanded-toc-phone')
    return 'article';
  if (name.startsWith('detail-')) return 'detail';
  if (name.startsWith('index-')) return 'index';
  if (name === 'homepage' || name.startsWith('interaction-')) return 'homepage';
  throw new Error(`No visual snapshot suite owns ${name}.`);
}

function approvedArtifactMatrix() {
  return approvedStates.flatMap((state) =>
    state.projects.flatMap((project) => {
      const modes = state.interaction
        ? ['viewport']
        : ['viewport', 'full-page'];
      return modes.map((mode) => ({
        ...state,
        project,
        mode,
        artifactName: state.interaction
          ? `${state.name}-${mode}.png`
          : `${state.name}-${project}-${mode}.png`,
        snapshotPath: `tests/visual/${snapshotSuite(state.name)}.spec.ts-snapshots/${state.name}-${mode}-${project}-darwin.png`,
      }));
    }),
  );
}

function combinedListChecksum(reviewManifest) {
  const entries = [...reviewManifest.entries].sort((left, right) =>
    left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
  );
  return sha256(
    `${entries.map((entry) => `${entry.sha256}  ${entry.path}`).join('\n')}\n`,
  );
}

function parseApprovedReviewManifest(reviewBytes) {
  const bytes = Buffer.isBuffer(reviewBytes)
    ? reviewBytes
    : Buffer.from(reviewBytes);
  const checksum = sha256(bytes);
  if (checksum !== approvedReviewManifestChecksum) {
    throw new Error(
      `Canonical visual review manifest checksum mismatch. Expected ${approvedReviewManifestChecksum}; received ${checksum}. Grant's approval cannot be replayed against another review manifest.`,
    );
  }
  const reviewManifest = JSON.parse(bytes.toString('utf8'));
  const listChecksum = combinedListChecksum(reviewManifest);
  if (listChecksum !== approvedCombinedListChecksum) {
    throw new Error(
      `Approved combined-list checksum mismatch. Expected ${approvedCombinedListChecksum}; received ${listChecksum}.`,
    );
  }
  return reviewManifest;
}

export function assertCanonicalVisualHost(
  actual,
  expected = approvedCanonicalVisualHost,
) {
  const fields = [
    'os',
    'platform',
    'architecture',
    'playwrightVersion',
    'chromiumRevision',
    'chromiumVersion',
  ];
  const mismatches = fields.filter(
    (field) => actual[field] !== expected[field],
  );
  if (mismatches.length) {
    throw new Error(
      `Canonical visual host mismatch (${mismatches.join(', ')}). Expected ${JSON.stringify(expected)}; received ${JSON.stringify(actual)}. These pixel baselines may only run on the approved macOS arm64 host with the pinned Playwright Chromium revision.`,
    );
  }
}

export async function currentCanonicalVisualHost(root = process.cwd()) {
  const [packageJson, browsersJson] = await Promise.all([
    readFile(join(root, 'node_modules/@playwright/test/package.json'), 'utf8'),
    readFile(join(root, 'node_modules/playwright-core/browsers.json'), 'utf8'),
  ]).then((values) => values.map(JSON.parse));
  const chromium = browsersJson.browsers.find(
    (browser) => browser.name === 'chromium',
  );
  if (!chromium)
    throw new Error('Pinned Playwright Chromium metadata missing.');
  return {
    os: process.platform === 'darwin' ? 'macOS' : process.platform,
    platform: process.platform,
    architecture: process.arch,
    playwrightVersion: packageJson.version,
    chromiumRevision: chromium.revision,
    chromiumVersion: chromium.browserVersion,
  };
}

export async function assertCurrentCanonicalVisualHost(
  manifestPath = join(process.cwd(), 'docs/design/baselines/manifest.json'),
  root = process.cwd(),
) {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (manifest.status !== 'approved-canonical') {
    throw new Error(
      `Canonical visual manifest is not approved: ${manifest.status ?? '(missing status)'}`,
    );
  }
  assertCanonicalVisualHost(manifest.host);
  const current = await currentCanonicalVisualHost(root);
  assertCanonicalVisualHost(current);
}

export function buildCanonicalVisualManifest(
  reviewBytes,
  host = approvedCanonicalVisualHost,
) {
  assertCanonicalVisualHost(host);
  const reviewManifest = parseApprovedReviewManifest(reviewBytes);
  if (
    reviewManifest.status !== 'review-candidate-noncanonical' ||
    reviewManifest.count !== 55 ||
    !Array.isArray(reviewManifest.entries) ||
    reviewManifest.entries.length !== 55
  ) {
    throw new Error(
      'Canonical visual acceptance requires the approved 55-entry review-candidate manifest.',
    );
  }
  const approved = new Map(
    approvedArtifactMatrix().map((entry) => [entry.artifactName, entry]),
  );
  const reviewNames = reviewManifest.entries.map((entry) =>
    basename(entry.path),
  );
  if (
    new Set(reviewNames).size !== approved.size ||
    reviewNames.some((name) => !approved.has(name))
  ) {
    throw new Error(
      'Review manifest does not exactly match the approved 55-state visual matrix.',
    );
  }

  const entries = reviewManifest.entries.map((reviewEntry) => {
    const name = basename(reviewEntry.path);
    const state = approved.get(name);
    if (!state) throw new Error(`Unapproved comparison artifact: ${name}`);
    if (
      !/^[a-f0-9]{64}$/.test(reviewEntry.sha256) ||
      !/^[a-f0-9]{64}$/.test(reviewEntry.left?.sha256) ||
      !/^[a-f0-9]{64}$/.test(reviewEntry.right?.sha256)
    ) {
      throw new Error(`Missing approved checksums for ${name}`);
    }
    return {
      name,
      path: `docs/design/baselines/${name}`,
      route: state.route,
      viewport: viewports[state.project],
      state: state.state,
      mode: state.mode,
      sourceRole: reviewEntry.leftRole,
      sourcePath: reviewEntry.left.path,
      sourceChecksum: reviewEntry.left.sha256,
      implementationRole: reviewEntry.rightRole,
      implementationPath: reviewEntry.right.path,
      implementationChecksum: reviewEntry.right.sha256,
      snapshotPath: state.snapshotPath,
      snapshotChecksum: reviewEntry.right.sha256,
      approvedComparisonPath: reviewEntry.path,
      approvedComparisonChecksum: reviewEntry.sha256,
      width: reviewEntry.width,
      height: reviewEntry.height,
    };
  });

  return {
    status: 'approved-canonical',
    count: entries.length,
    approval: canonicalVisualApproval,
    host: { ...host },
    reviewManifestPath: reviewManifestRelativePath,
    reviewManifestChecksum: approvedReviewManifestChecksum,
    approvedCombinedListChecksum,
    snapshotDirectories: [...canonicalSnapshotDirectories],
    entries,
  };
}

function manifestBytes(manifest) {
  return Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
}

async function pathExists(path) {
  return stat(path).then(
    () => true,
    () => false,
  );
}

async function assertDirectoryMembers(directory, expected, label) {
  const actual = sorted(await readdir(directory));
  const wanted = sorted(expected);
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    const unexpected = actual.filter((name) => !wanted.includes(name));
    const missing = wanted.filter((name) => !actual.includes(name));
    throw new Error(
      `${label} directory membership mismatch; missing: ${missing.join(', ') || '(none)'}; unexpected: ${unexpected.join(', ') || '(none)'}.`,
    );
  }
}

async function loadAndValidateApprovedReview({
  root,
  reviewManifestPath,
  host,
}) {
  const reviewBytes = await readFile(reviewManifestPath);
  const reviewManifest = parseApprovedReviewManifest(reviewBytes);
  const manifest = buildCanonicalVisualManifest(reviewBytes, host);

  await assertDirectoryMembers(
    join(root, 'docs/qa/visual-comparisons/combined'),
    reviewManifest.entries.map((entry) => basename(entry.path)),
    'Approved combined comparison',
  );
  await assertDirectoryMembers(
    join(root, 'docs/qa/visual-comparisons/raw'),
    reviewManifest.entries.flatMap((entry) => [
      basename(entry.left.path),
      basename(entry.right.path),
    ]),
    'Approved raw comparison',
  );

  const reviewByName = new Map(
    reviewManifest.entries.map((entry) => [basename(entry.path), entry]),
  );
  for (const entry of manifest.entries) {
    const reviewEntry = reviewByName.get(entry.name);
    const [comparisonBytes, sourceBytes, implementationBytes] =
      await Promise.all([
        readFile(join(root, entry.approvedComparisonPath)),
        readFile(join(root, entry.sourcePath)),
        readFile(join(root, entry.implementationPath)),
      ]);
    if (sha256(comparisonBytes) !== entry.approvedComparisonChecksum) {
      throw new Error(
        `Approved comparison checksum mismatch: ${entry.approvedComparisonPath}`,
      );
    }
    if (sha256(sourceBytes) !== entry.sourceChecksum) {
      throw new Error(`Approved source checksum mismatch: ${entry.sourcePath}`);
    }
    if (sha256(implementationBytes) !== entry.implementationChecksum) {
      throw new Error(
        `Approved implementation checksum mismatch: ${entry.implementationPath}`,
      );
    }
    if (
      reviewEntry.right.path !== entry.implementationPath ||
      reviewEntry.right.sha256 !== entry.implementationChecksum
    ) {
      throw new Error(
        `Approved implementation identity mismatch: ${entry.name}`,
      );
    }
  }

  const visualDirectoryEntries = await readdir(join(root, 'tests/visual'));
  const actualSnapshotDirectories = visualDirectoryEntries
    .filter((name) => name.endsWith('.spec.ts-snapshots'))
    .map((name) => `tests/visual/${name}`);
  if (
    JSON.stringify(sorted(actualSnapshotDirectories)) !==
    JSON.stringify(sorted(canonicalSnapshotDirectories))
  ) {
    throw new Error(
      `Canonical snapshot directory membership mismatch; expected ${canonicalSnapshotDirectories.join(', ')}; received ${actualSnapshotDirectories.join(', ')}.`,
    );
  }
  for (const directory of canonicalSnapshotDirectories) {
    await assertDirectoryMembers(
      join(root, directory),
      manifest.entries
        .filter((entry) => dirname(entry.snapshotPath) === directory)
        .map((entry) => basename(entry.snapshotPath)),
      'Unapproved snapshot',
    );
  }
  for (const entry of manifest.entries) {
    const [snapshotBytes, implementationBytes] = await Promise.all([
      readFile(join(root, entry.snapshotPath)),
      readFile(join(root, entry.implementationPath)),
    ]);
    if (
      !snapshotBytes.equals(implementationBytes) ||
      sha256(snapshotBytes) !== entry.snapshotChecksum
    ) {
      throw new Error(
        `Canonical snapshot differs from approved implementation capture: ${entry.snapshotPath}`,
      );
    }
  }

  return { manifest, reviewManifest };
}

async function assertCanonicalOutput({ root, canonicalRoot, manifest }) {
  await assertDirectoryMembers(
    canonicalRoot,
    ['manifest.json', ...manifest.entries.map((entry) => entry.name)],
    'Canonical baseline',
  );
  const actualManifestBytes = await readFile(
    join(canonicalRoot, 'manifest.json'),
  );
  if (!actualManifestBytes.equals(manifestBytes(manifest))) {
    throw new Error(
      'Canonical manifest does not exactly match the approved review identity.',
    );
  }
  for (const entry of manifest.entries) {
    const [canonicalBytes, approvedBytes] = await Promise.all([
      readFile(join(canonicalRoot, entry.name)),
      readFile(join(root, entry.approvedComparisonPath)),
    ]);
    if (
      !canonicalBytes.equals(approvedBytes) ||
      sha256(canonicalBytes) !== entry.approvedComparisonChecksum
    ) {
      throw new Error(
        `Canonical comparison differs from approved bytes: ${entry.name}`,
      );
    }
  }
}

export async function assertCanonicalVisualArtifacts({
  root = process.cwd(),
  reviewManifestPath = join(root, reviewManifestRelativePath),
  canonicalRoot = join(root, 'docs/design/baselines'),
} = {}) {
  const { manifest } = await loadAndValidateApprovedReview({
    root,
    reviewManifestPath,
    host: approvedCanonicalVisualHost,
  });
  await assertCanonicalOutput({ root, canonicalRoot, manifest });
}

export function assertCanonicalSnapshotUpdateMode(updateSnapshots = 'missing') {
  if (updateSnapshots === 'all' || updateSnapshots === 'changed') {
    throw new Error(
      `Canonical snapshot update mode ${updateSnapshots} is not authorized. Approved snapshots are immutable and may only be established from explicitly reviewed implementation artifacts.`,
    );
  }
}

export async function assertCanonicalVisualRuntime({
  root = process.cwd(),
  updateSnapshots = 'missing',
} = {}) {
  assertCanonicalSnapshotUpdateMode(updateSnapshots);
  const canonicalManifestPath = join(
    root,
    'docs/design/baselines/manifest.json',
  );
  await assertCurrentCanonicalVisualHost(canonicalManifestPath, root);
  await assertCanonicalVisualArtifacts({ root });
}

export async function acceptCanonicalVisualBaselines({
  root = process.cwd(),
  reviewManifestPath = join(root, reviewManifestRelativePath),
  canonicalRoot = join(root, 'docs/design/baselines'),
} = {}) {
  const host = await currentCanonicalVisualHost(root);
  assertCanonicalVisualHost(host);
  const { manifest } = await loadAndValidateApprovedReview({
    root,
    reviewManifestPath,
    host,
  });

  if (await pathExists(canonicalRoot)) {
    try {
      await assertCanonicalOutput({ root, canonicalRoot, manifest });
    } catch (error) {
      throw new Error(
        'Existing canonical output is not an exact approved set; acceptance is idempotent and will not overwrite or repair it.',
        { cause: error },
      );
    }
    return manifest;
  }

  await mkdir(dirname(canonicalRoot), { recursive: true });
  const stagingRoot = await mkdtemp(
    join(dirname(canonicalRoot), `.${basename(canonicalRoot)}-accept-`),
  );
  try {
    for (const entry of manifest.entries) {
      await copyFile(
        join(root, entry.approvedComparisonPath),
        join(stagingRoot, entry.name),
      );
    }
    await writeFile(
      join(stagingRoot, 'manifest.json'),
      manifestBytes(manifest),
    );
    await assertCanonicalOutput({
      root,
      canonicalRoot: stagingRoot,
      manifest,
    });
    await rename(stagingRoot, canonicalRoot);
  } finally {
    await rm(stagingRoot, { recursive: true, force: true });
  }
  return manifest;
}
