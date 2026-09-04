export type CrawlPolicy =
  | { path: string; mode: 'legacy-post'; allowanceIds: readonly string[] }
  | { path: string; mode: 'legal-parity'; fixtureKey: 'support' | 'privacy' }
  | { path: string; mode: 'redesigned-existing' }
  | { path: string; mode: 'new-route' }
  | {
      path: string;
      mode: 'discovery';
      baselineStatus: 200 | 404;
      expectedContentType: string;
    }
  | { path: string; mode: 'preserved-asset'; expectedSha256: string }
  | {
      path: string;
      mode: 'repaired-asset';
      expectedSha256: string;
      aliasOf: string;
    };

export interface CrawlDifference {
  path: string;
  policy: CrawlPolicy['mode'];
  field: string;
  baseline: unknown;
  candidate: unknown;
  message: string;
}

interface RouteInput {
  canonicalPath: string;
  kind: 'page' | 'post' | 'utility';
}

interface AssetInput {
  path: string;
  sha256: string;
  aliasOf?: string;
}

interface MigrationAllowance {
  id: string;
  path: string;
  field: string;
  operation: string;
  expectedOccurrences: number;
}

interface PolicyGroups {
  redesignedExisting: string[];
  legalParity: Record<string, 'support' | 'privacy'>;
  newRoutes: string[];
  discovery: Record<
    string,
    { baselineStatus: 200 | 404; expectedContentType: string }
  >;
}

interface CrawlRecord {
  requestedPath: string;
  status: number;
  finalUrl: string;
  canonical: string | null;
  contentType: string;
  articleSemantic: Record<string, unknown> | null;
  embedContracts: Array<Record<string, unknown>>;
  legalSemantic: unknown;
  bodySha256: string;
}

interface CompareContext {
  policies: readonly CrawlPolicy[];
  legalFixtures: Record<string, unknown>;
}

const KNOWN_ALLOWANCES = new Set([
  'correct-four-notion-image-paths',
  'replace-listwithme-placeholder-app-store-link',
  'normalize-playlists-body-h1',
  'normalize-wwdc-day-1-body-h1',
  'upgrade-spotify-embeds',
]);
const NOTION_REPLACEMENTS: Record<string, string> = {
  '/uploads/2023/f159196842.png': '/images/f159196842.png',
  '/uploads/2023/fa6c5dfe53.png': '/images/fa6c5dfe53.png',
  '/uploads/2023/5fd90bfbf1.png': '/images/5fd90bfbf1.png',
  '/uploads/2023/6647450a28.png': '/images/6647450a28.png',
};
const APP_STORE_URL = 'https://apps.apple.com/us/app/listwithme/id1224284271';

export function buildCrawlPolicies(
  routes: readonly RouteInput[],
  assets: readonly AssetInput[],
  config: {
    groups: PolicyGroups;
    migrationAllowances: readonly MigrationAllowance[];
  },
): readonly CrawlPolicy[] {
  const routePaths = new Set(routes.map(({ canonicalPath }) => canonicalPath));
  const postPaths = new Set(
    routes
      .filter(({ kind }) => kind === 'post')
      .map(({ canonicalPath }) => canonicalPath),
  );
  const allowancesByPath = new Map<string, string[]>();
  const allowanceIds = new Set<string>();
  for (const allowance of config.migrationAllowances) {
    if (allowanceIds.has(allowance.id)) {
      throw new Error(`Duplicate migration allowance id: ${allowance.id}`);
    }
    if (!KNOWN_ALLOWANCES.has(allowance.id)) {
      throw new Error(`Unknown migration allowance id: ${allowance.id}`);
    }
    if (!postPaths.has(allowance.path)) {
      throw new Error(`Unknown migration allowance path: ${allowance.path}`);
    }
    allowanceIds.add(allowance.id);
    allowancesByPath.set(allowance.path, [
      ...(allowancesByPath.get(allowance.path) ?? []),
      allowance.id,
    ]);
  }

  const policies = new Map<string, CrawlPolicy>();
  const addRoute = (path: string, policy: CrawlPolicy) => {
    if (!routePaths.has(path)) throw new Error(`Unknown policy path: ${path}`);
    if (policies.has(path)) throw new Error(`Duplicate policy path: ${path}`);
    policies.set(path, policy);
  };

  for (const path of postPaths) {
    addRoute(path, {
      path,
      mode: 'legacy-post',
      allowanceIds: (allowancesByPath.get(path) ?? []).toSorted(),
    });
  }
  for (const path of config.groups.redesignedExisting) {
    addRoute(path, { path, mode: 'redesigned-existing' });
  }
  for (const [path, fixtureKey] of Object.entries(config.groups.legalParity)) {
    addRoute(path, { path, mode: 'legal-parity', fixtureKey });
  }
  for (const path of config.groups.newRoutes) {
    addRoute(path, { path, mode: 'new-route' });
  }
  for (const [path, discovery] of Object.entries(config.groups.discovery)) {
    addRoute(path, { path, mode: 'discovery', ...discovery });
  }
  const uncovered = [...routePaths].filter((path) => !policies.has(path));
  if (uncovered.length) {
    throw new Error(
      `Uncovered policy path(s): ${uncovered.toSorted().join(', ')}`,
    );
  }

  for (const asset of assets) {
    if (routePaths.has(asset.path) || policies.has(asset.path)) {
      throw new Error(`Duplicate policy path: ${asset.path}`);
    }
    policies.set(
      asset.path,
      asset.aliasOf
        ? {
            path: asset.path,
            mode: 'repaired-asset',
            expectedSha256: asset.sha256,
            aliasOf: asset.aliasOf,
          }
        : {
            path: asset.path,
            mode: 'preserved-asset',
            expectedSha256: asset.sha256,
          },
    );
  }
  if (policies.size !== routes.length + assets.length) {
    throw new Error(
      `Expected ${routes.length + assets.length} unique policies, received ${policies.size}`,
    );
  }
  return [...policies.values()].toSorted((left, right) =>
    left.path.localeCompare(right.path),
  );
}

function contentType(value: string): string {
  return value.split(';', 1)[0].trim().toLowerCase();
}

function pathIdentity(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, 'https://grantisom.com');
    return `${decodeURIComponent(url.pathname)}${url.search}${decodeURIComponent(url.hash)}`;
  } catch {
    return value;
  }
}

function same(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function normalizedImage(value: string): string {
  const url = new URL(value, 'https://grantisom.com');
  return url.origin === 'https://grantisom.com' ? url.pathname : url.href;
}

function transformedBaselineArticle(
  semantic: Record<string, unknown>,
  allowanceIds: readonly string[],
  add: (
    field: string,
    baseline: unknown,
    candidate: unknown,
    message: string,
  ) => void,
): Record<string, unknown> {
  const transformed = clone(semantic);
  for (const allowanceId of allowanceIds) {
    if (allowanceId === 'correct-four-notion-image-paths') {
      const images = (transformed.images as string[]).map(normalizedImage);
      let count = 0;
      transformed.images = images.map((image) => {
        const replacement = NOTION_REPLACEMENTS[image];
        if (replacement) count += 1;
        return replacement ?? image;
      });
      if (count !== 4)
        add('allowances', 4, count, 'Notion allowance occurrence drift');
    } else if (
      allowanceId === 'replace-listwithme-placeholder-app-store-link'
    ) {
      let count = 0;
      transformed.links = (transformed.links as string[]).map((link) => {
        if (link === '#') {
          count += 1;
          return APP_STORE_URL;
        }
        return link;
      });
      if (count !== 1)
        add('allowances', 1, count, 'ListWithMe allowance occurrence drift');
    } else if (
      allowanceId === 'normalize-playlists-body-h1' ||
      allowanceId === 'normalize-wwdc-day-1-body-h1'
    ) {
      let count = 0;
      transformed.headings = (
        transformed.headings as Array<Record<string, unknown>>
      ).map((heading) => {
        if (heading.level !== 1) return heading;
        count += 1;
        return { ...heading, level: 2 };
      });
      if (count !== 5)
        add('allowances', 5, count, 'Heading allowance occurrence drift');
    } else if (allowanceId !== 'upgrade-spotify-embeds') {
      add('allowances', allowanceId, null, 'Unknown allowance id');
    }
  }
  transformed.images = (transformed.images as string[]).map(normalizedImage);
  return transformed;
}

export function compareCrawls(
  baseline: readonly CrawlRecord[],
  candidate: readonly CrawlRecord[],
  context: CompareContext,
): readonly CrawlDifference[] {
  const differences: CrawlDifference[] = [];
  const baselineByPath = new Map<string, CrawlRecord>();
  const candidateByPath = new Map<string, CrawlRecord>();
  const addGlobal = (
    path: string,
    policy: CrawlPolicy['mode'],
    field: string,
    left: unknown,
    right: unknown,
    message: string,
  ) =>
    differences.push({
      path,
      policy,
      field,
      baseline: left,
      candidate: right,
      message,
    });

  for (const record of baseline) {
    if (baselineByPath.has(record.requestedPath)) {
      addGlobal(
        record.requestedPath,
        'redesigned-existing',
        'baseline.requestedPath',
        'unique',
        'duplicate',
        'Duplicate baseline crawl record',
      );
    }
    baselineByPath.set(record.requestedPath, record);
  }
  for (const record of candidate) {
    if (candidateByPath.has(record.requestedPath)) {
      addGlobal(
        record.requestedPath,
        'redesigned-existing',
        'candidate.requestedPath',
        'unique',
        'duplicate',
        'Duplicate candidate crawl record',
      );
    }
    candidateByPath.set(record.requestedPath, record);
  }

  for (const policy of context.policies) {
    const before = baselineByPath.get(policy.path);
    const after = candidateByPath.get(policy.path);
    const add = (
      field: string,
      left: unknown,
      right: unknown,
      message: string,
    ) => addGlobal(policy.path, policy.mode, field, left, right, message);
    if (!before || !after) {
      add(
        'requestedPath',
        Boolean(before),
        Boolean(after),
        'Missing crawl record',
      );
      continue;
    }
    const requireStatus = (
      record: CrawlRecord,
      expected: number,
      side: 'baseline' | 'candidate',
    ) => {
      if (record.status !== expected)
        add(
          `${side}.status`,
          expected,
          record.status,
          `${side} status mismatch`,
        );
    };
    const requireHtml = (record: CrawlRecord, side: string) => {
      if (contentType(record.contentType) !== 'text/html')
        add(
          `${side}.contentType`,
          'text/html',
          record.contentType,
          `${side} is not HTML`,
        );
    };
    const requireCandidateCanonical = () => {
      const expected = `https://grantisom.com${policy.path}`;
      if (after.canonical !== expected)
        add(
          'candidate.canonical',
          expected,
          after.canonical,
          'Candidate canonical mismatch',
        );
    };

    if (policy.mode === 'legacy-post') {
      requireStatus(before, 200, 'baseline');
      requireStatus(after, 200, 'candidate');
      requireHtml(before, 'baseline');
      requireHtml(after, 'candidate');
      if (pathIdentity(before.finalUrl) !== policy.path)
        add(
          'baseline.finalUrl',
          policy.path,
          before.finalUrl,
          'Baseline final path drift',
        );
      if (pathIdentity(after.finalUrl) !== policy.path)
        add(
          'candidate.finalUrl',
          policy.path,
          after.finalUrl,
          'Candidate final path drift',
        );
      if (pathIdentity(before.canonical) !== policy.path)
        add(
          'baseline.canonical',
          policy.path,
          before.canonical,
          'Baseline canonical path drift',
        );
      requireCandidateCanonical();
      if (!before.articleSemantic || !after.articleSemantic) {
        add('articleSemantic', true, false, 'Missing article semantics');
        continue;
      }
      const transformed = transformedBaselineArticle(
        before.articleSemantic,
        policy.allowanceIds,
        add,
      );
      const normalizedCandidate = clone(after.articleSemantic);
      normalizedCandidate.images = (normalizedCandidate.images as string[]).map(
        normalizedImage,
      );
      for (const field of [
        'headings',
        'text',
        'links',
        'images',
        'codeBlocks',
        'iframeSources',
      ]) {
        if (!same(transformed[field], normalizedCandidate[field])) {
          add(
            `articleSemantic.${field}`,
            transformed[field],
            normalizedCandidate[field],
            `Legacy article ${field} drift`,
          );
        }
      }
      const spotify = policy.allowanceIds.includes('upgrade-spotify-embeds');
      if (spotify) {
        if (after.embedContracts.length !== 4) {
          add(
            'embedContracts.length',
            4,
            after.embedContracts.length,
            'Expected exactly four marked Spotify fallbacks',
          );
        }
        for (const embed of after.embedContracts) {
          if (
            embed.marked !== true ||
            typeof embed.title !== 'string' ||
            !embed.title ||
            embed.loading !== 'lazy' ||
            embed.fallbackHref !== embed.src ||
            embed.fallbackText !== `Open ${embed.title}` ||
            embed.fallbackCount !== 1 ||
            embed.fallbackLinkCount !== 1
          ) {
            add(
              'embedContracts',
              'valid marked fallback',
              embed,
              'Invalid Spotify fallback contract',
            );
          }
        }
      } else if (after.embedContracts.length) {
        add(
          'embedContracts.length',
          0,
          after.embedContracts.length,
          'Unexpected marked embed fallback',
        );
      }
      continue;
    }

    if (policy.mode === 'legal-parity') {
      requireStatus(before, 200, 'baseline');
      requireStatus(after, 200, 'candidate');
      requireHtml(before, 'baseline');
      requireHtml(after, 'candidate');
      requireCandidateCanonical();
      const expected = context.legalFixtures[policy.fixtureKey];
      if (!same(after.legalSemantic, expected))
        add(
          'legalSemantic',
          expected,
          after.legalSemantic,
          'Legal semantic parity drift',
        );
    } else if (policy.mode === 'redesigned-existing') {
      requireStatus(before, 200, 'baseline');
      requireStatus(after, 200, 'candidate');
      requireHtml(before, 'baseline');
      requireHtml(after, 'candidate');
      requireCandidateCanonical();
    } else if (policy.mode === 'new-route') {
      requireStatus(before, 404, 'baseline');
      requireStatus(after, 200, 'candidate');
      requireHtml(after, 'candidate');
      requireCandidateCanonical();
    } else if (policy.mode === 'discovery') {
      requireStatus(before, policy.baselineStatus, 'baseline');
      requireStatus(after, 200, 'candidate');
      if (contentType(after.contentType) !== policy.expectedContentType)
        add(
          'candidate.contentType',
          policy.expectedContentType,
          after.contentType,
          'Discovery media type drift',
        );
    } else if (policy.mode === 'preserved-asset') {
      requireStatus(before, 200, 'baseline');
      requireStatus(after, 200, 'candidate');
      if (before.bodySha256 !== policy.expectedSha256)
        add(
          'baseline.bodySha256',
          policy.expectedSha256,
          before.bodySha256,
          'Production compatibility hash drift',
        );
      if (after.bodySha256 !== policy.expectedSha256)
        add(
          'candidate.bodySha256',
          policy.expectedSha256,
          after.bodySha256,
          'Candidate compatibility hash drift',
        );
    } else {
      requireStatus(before, 404, 'baseline');
      requireStatus(after, 200, 'candidate');
      if (after.bodySha256 !== policy.expectedSha256)
        add(
          'candidate.bodySha256',
          policy.expectedSha256,
          after.bodySha256,
          `Repaired alias differs from ${policy.aliasOf}`,
        );
    }
  }

  return differences.toSorted((left, right) =>
    `${left.path}\0${left.field}`.localeCompare(
      `${right.path}\0${right.field}`,
    ),
  );
}
