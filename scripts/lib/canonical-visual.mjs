import { createHash } from 'node:crypto';
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  writeFile,
} from 'node:fs/promises';
import { basename, join } from 'node:path';

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
      }));
    }),
  );
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
) {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (manifest.status !== 'approved-canonical') {
    throw new Error(
      `Canonical visual manifest is not approved: ${manifest.status ?? '(missing status)'}`,
    );
  }
  assertCanonicalVisualHost(manifest.host);
  const current = await currentCanonicalVisualHost();
  assertCanonicalVisualHost(current);
}

export function buildCanonicalVisualManifest(
  reviewManifest,
  host = approvedCanonicalVisualHost,
) {
  assertCanonicalVisualHost(host);
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
      !/^[a-f0-9]{64}$/.test(reviewEntry.left?.sha256)
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
    entries,
  };
}

export async function acceptCanonicalVisualBaselines({
  root = process.cwd(),
  reviewManifestPath = join(root, 'docs/qa/visual-comparisons/manifest.json'),
  canonicalRoot = join(root, 'docs/design/baselines'),
} = {}) {
  const host = await currentCanonicalVisualHost(root);
  assertCanonicalVisualHost(host);
  const reviewBytes = await readFile(reviewManifestPath);
  const reviewManifest = JSON.parse(reviewBytes.toString('utf8'));
  const manifest = buildCanonicalVisualManifest(reviewManifest, host);

  await mkdir(canonicalRoot, { recursive: true });
  const existing = await readdir(canonicalRoot);
  if (
    existing.some((name) => name !== 'manifest.json' && !name.endsWith('.png'))
  ) {
    throw new Error(
      `Canonical baseline directory contains an unexpected file: ${existing.join(', ')}`,
    );
  }

  for (const entry of manifest.entries) {
    const source = join(root, entry.approvedComparisonPath);
    const destination = join(canonicalRoot, entry.name);
    await copyFile(source, destination);
    const [sourceBytes, destinationBytes] = await Promise.all([
      readFile(source),
      readFile(destination),
    ]);
    if (
      !sourceBytes.equals(destinationBytes) ||
      sha256(destinationBytes) !== entry.approvedComparisonChecksum
    ) {
      throw new Error(
        `Canonical copy differs from approved bytes: ${entry.name}`,
      );
    }
  }

  const acceptedNames = new Set(manifest.entries.map((entry) => entry.name));
  const unexpectedPngs = (await readdir(canonicalRoot)).filter(
    (name) => name.endsWith('.png') && !acceptedNames.has(name),
  );
  if (unexpectedPngs.length) {
    throw new Error(
      `Canonical baseline directory contains unapproved PNGs: ${unexpectedPngs.join(', ')}`,
    );
  }

  const withIdentity = {
    ...manifest,
    reviewManifestPath: 'docs/qa/visual-comparisons/manifest.json',
    reviewManifestChecksum: sha256(reviewBytes),
  };
  await writeFile(
    join(canonicalRoot, 'manifest.json'),
    `${JSON.stringify(withIdentity, null, 2)}\n`,
  );
  return withIdentity;
}
