import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import {
  Document,
  isMap,
  isScalar,
  Scalar,
  type Pair,
  type Scalar as YamlScalar,
} from 'yaml';
import { validateLegacyHtml } from './lib/legacy-html';
import {
  migratePost,
  type LegacyPageSnapshot,
  type MigratedPost,
} from './lib/legacy-markdown';

const EXPECTED_COUNT = 23;
const DATE_FIELDS = [
  'publishedAt',
  'updatedAt',
  'reviewedAt',
  'originalTimestamp',
] as const;
const FRONTMATTER_KEY_ORDER = [
  'title',
  'slug',
  'canonicalPath',
  'summary',
  'draft',
  'hasDetailPage',
  'featured',
  'homepageSlot',
  'tags',
  'links',
  'relationships',
  'publishedAt',
  'updatedAt',
  'reviewedAt',
  'kind',
  'comments',
  'preservedHeadingIds',
  'numberHeadings',
  'originalTimestamp',
  'titleAccent',
  'featuredArt',
  'relatedProject',
  'socialImage',
] as const;

const APPROVED_MIGRATION_ALLOWANCES = [
  {
    id: 'correct-four-notion-image-paths',
    path: '/2023/01/14/notion-for-software.html',
    field: 'images',
    operation: 'replace-exact',
    replacements: {
      '/uploads/2023/f159196842.png': '/images/f159196842.png',
      '/uploads/2023/fa6c5dfe53.png': '/images/fa6c5dfe53.png',
      '/uploads/2023/5fd90bfbf1.png': '/images/5fd90bfbf1.png',
      '/uploads/2023/6647450a28.png': '/images/6647450a28.png',
    },
    expectedOccurrences: 4,
  },
  {
    id: 'replace-listwithme-placeholder-app-store-link',
    path: '/2026/02/24/listwithme-returns.html',
    field: 'links',
    operation: 'replace-exact',
    before: '#',
    after: 'https://apps.apple.com/us/app/listwithme/id1224284271',
    expectedOccurrences: 1,
  },
  {
    id: 'normalize-playlists-body-h1',
    path: '/2018/11/27/playlists.html',
    field: 'headings',
    operation: 'h1-to-h2',
    expectedOccurrences: 5,
  },
  {
    id: 'normalize-wwdc-day-1-body-h1',
    path: '/2019/06/04/wwdc-day-1.html',
    field: 'headings',
    operation: 'h1-to-h2',
    expectedOccurrences: 5,
  },
  {
    id: 'upgrade-spotify-embeds',
    path: '/2020/02/10/2019-playlists.html',
    field: 'iframeSources',
    operation: 'embed-with-fallback',
    requiredAfter: [
      'title',
      'loading=lazy',
      'fallbackHrefEqualsSource',
      'fallbackText=Open {title}',
      'fallbackMarker=data-embed-fallback',
    ],
    semanticNormalization: 'exclude-only-marked-fallback-from-text-and-links',
    expectedOccurrences: 4,
  },
] as const;

interface FullLegacyPageSnapshot extends LegacyPageSnapshot {
  url: string;
  iframeSources: string[];
}

export interface MigrationRecord {
  canonicalPath: string;
  source: string;
  baseline: FullLegacyPageSnapshot;
  migrated: MigratedPost;
}

interface MigrationAllowance {
  id: string;
  path: string;
  field: string;
  operation: string;
  expectedOccurrences: number;
  replacements?: Record<string, string>;
  before?: string;
  after?: string;
  requiredAfter?: string[];
  semanticNormalization?: string;
}

interface SerializableMigratedPost extends Omit<MigratedPost, 'data'> {
  data: MigratedPost['data'] & {
    updatedAt?: string;
    reviewedAt?: string;
  };
}

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const sourceDirectory = resolve(repositoryRoot, '_posts');
const outputDirectory = resolve(repositoryRoot, 'src/content/blog');
const baselinePath = resolve(
  repositoryRoot,
  'tests/fixtures/legacy-pages.json',
);
const allowancesPath = resolve(
  repositoryRoot,
  'tests/fixtures/migration-allowances.json',
);

function assertCount(label: string, actual: number): void {
  if (actual !== EXPECTED_COUNT) {
    throw new Error(
      `${label} count must be ${EXPECTED_COUNT}; received ${actual}`,
    );
  }
}

function countExact(value: string, needle: string): number {
  return value.split(needle).length - 1;
}

export function assertMigrationAllowances(
  value: unknown,
  records: MigrationRecord[],
): void {
  if (!Array.isArray(value) || value.length !== 5) {
    throw new Error('Migration allowances must contain exactly 5 entries');
  }
  if (JSON.stringify(value) !== JSON.stringify(APPROVED_MIGRATION_ALLOWANCES)) {
    throw new Error(
      'Migration allowances must exactly match the reviewed identities',
    );
  }
  const allowances =
    APPROVED_MIGRATION_ALLOWANCES as unknown as MigrationAllowance[];
  const recordByPath = new Map(
    records.map((record) => [record.canonicalPath, record] as const),
  );

  for (const allowance of allowances) {
    const record = recordByPath.get(allowance.path);
    if (!record) {
      throw new Error(`Migration allowance has no source: ${allowance.path}`);
    }
    switch (allowance.id) {
      case 'correct-four-notion-image-paths': {
        if (
          allowance.field !== 'images' ||
          allowance.operation !== 'replace-exact'
        ) {
          throw new Error('Notion migration allowance shape changed');
        }
        const occurrences = Object.entries(allowance.replacements ?? {}).reduce(
          (total, [before, after]) => {
            const expectedAfter = `/images/${before.split('/').at(-1)}`;
            if (after !== expectedAfter) {
              throw new Error(`Unexpected Notion image replacement: ${before}`);
            }
            return (
              total + countExact(record.migrated.body, `<Figure src="${after}"`)
            );
          },
          0,
        );
        if (occurrences !== allowance.expectedOccurrences) {
          throw new Error(
            `Notion allowance expected ${allowance.expectedOccurrences} outputs; received ${occurrences}`,
          );
        }
        break;
      }
      case 'replace-listwithme-placeholder-app-store-link': {
        if (
          allowance.field !== 'links' ||
          allowance.operation !== 'replace-exact' ||
          allowance.before !== '#' ||
          !allowance.after
        ) {
          throw new Error('ListWithMe migration allowance shape changed');
        }
        const occurrences = countExact(record.migrated.body, allowance.after);
        if (occurrences !== allowance.expectedOccurrences) {
          throw new Error(
            `ListWithMe allowance expected ${allowance.expectedOccurrences} outputs; received ${occurrences}`,
          );
        }
        break;
      }
      case 'normalize-playlists-body-h1':
      case 'normalize-wwdc-day-1-body-h1': {
        if (
          allowance.field !== 'headings' ||
          allowance.operation !== 'h1-to-h2'
        ) {
          throw new Error(`${allowance.id} migration allowance shape changed`);
        }
        const occurrences = record.baseline.headings.filter(
          (heading) => heading.level === 1,
        ).length;
        if (occurrences !== allowance.expectedOccurrences) {
          throw new Error(
            `${allowance.id} expected ${allowance.expectedOccurrences} H1 headings; received ${occurrences}`,
          );
        }
        if (/^# [^#]/m.test(record.migrated.body)) {
          throw new Error(`${allowance.id} left a body H1 in migrated content`);
        }
        break;
      }
      case 'upgrade-spotify-embeds': {
        if (
          allowance.field !== 'iframeSources' ||
          allowance.operation !== 'embed-with-fallback' ||
          allowance.requiredAfter?.join('|') !==
            [
              'title',
              'loading=lazy',
              'fallbackHrefEqualsSource',
              'fallbackText=Open {title}',
              'fallbackMarker=data-embed-fallback',
            ].join('|')
        ) {
          throw new Error('Spotify migration allowance shape changed');
        }
        const sourceOccurrences = record.baseline.iframeSources.length;
        const outputOccurrences = countExact(
          record.migrated.body,
          '<EmbedFrame src=',
        );
        if (
          sourceOccurrences !== allowance.expectedOccurrences ||
          outputOccurrences !== allowance.expectedOccurrences
        ) {
          throw new Error(
            `Spotify allowance expected ${allowance.expectedOccurrences} embeds; received ${sourceOccurrences}/${outputOccurrences}`,
          );
        }
        break;
      }
    }
  }
}

function orderedData(data: Record<string, unknown>): Record<string, unknown> {
  const ordered: Record<string, unknown> = {};
  for (const key of FRONTMATTER_KEY_ORDER) {
    if (data[key] !== undefined) ordered[key] = data[key];
  }
  const unsupported = Object.keys(data).filter(
    (key) =>
      data[key] !== undefined &&
      !(FRONTMATTER_KEY_ORDER as readonly string[]).includes(key),
  );
  if (unsupported.length > 0) {
    throw new Error(
      `Unsupported generated frontmatter fields: ${unsupported.join(', ')}`,
    );
  }
  return ordered;
}

function quoteDateScalars(document: Document): void {
  if (!isMap(document.contents)) {
    throw new Error('Generated frontmatter must be a YAML map');
  }
  for (const pair of document.contents.items as Pair[]) {
    if (!isScalar(pair.key) || typeof pair.key.value !== 'string') continue;
    if (!(DATE_FIELDS as readonly string[]).includes(pair.key.value)) continue;
    if (!isScalar(pair.value) || typeof pair.value.value !== 'string') {
      throw new Error(`${pair.key.value} must serialize as a string`);
    }
    (pair.value as YamlScalar).type = Scalar.QUOTE_DOUBLE;
  }
}

function assertDateRoundTrip(serialized: string): void {
  const reparsed = matter(serialized).data as Record<string, unknown>;
  for (const field of DATE_FIELDS) {
    if (reparsed[field] !== undefined && typeof reparsed[field] !== 'string') {
      throw new Error(
        `Generated ${field} changed type after YAML round trip: ${typeof reparsed[field]}`,
      );
    }
  }
}

export function serializeMigratedPost(
  migrated: SerializableMigratedPost,
): string {
  const document = new Document(
    orderedData({ ...migrated.data } as Record<string, unknown>),
  );
  quoteDateScalars(document);
  const yaml = document.toString({ lineWidth: 0 }).replace(/\r\n?/g, '\n');
  const normalizedBody = migrated.body.replace(/\r\n?/g, '\n');
  const withFinalNewline = normalizedBody.endsWith('\n')
    ? normalizedBody
    : `${normalizedBody}\n`;
  const serialized = `---\n${yaml}---\n${withFinalNewline}`;
  assertDateRoundTrip(serialized);
  return serialized;
}

async function currentOutputFiles(): Promise<string[]> {
  return (await readdir(outputDirectory))
    .filter((name) => /\.(?:md|mdx)$/.test(name))
    .sort();
}

async function generatePosts(check: boolean): Promise<void> {
  const sourceFiles = (await readdir(sourceDirectory))
    .filter((name) => name.endsWith('.md'))
    .sort();
  assertCount('Jekyll input', sourceFiles.length);

  const baselines = JSON.parse(
    await readFile(baselinePath, 'utf8'),
  ) as FullLegacyPageSnapshot[];
  assertCount('Production baseline', baselines.length);
  const baselineByPath = new Map(
    baselines.map(
      (baseline) => [new URL(baseline.url).pathname, baseline] as const,
    ),
  );
  if (baselineByPath.size !== EXPECTED_COUNT) {
    throw new Error(
      `Production baseline paths must be unique; received ${baselineByPath.size}`,
    );
  }

  const allowances = JSON.parse(await readFile(allowancesPath, 'utf8'));
  const generated = new Map<string, string>();
  const records: MigrationRecord[] = [];
  for (const sourceFile of sourceFiles) {
    const source = await readFile(resolve(sourceDirectory, sourceFile), 'utf8');
    const fileMatch = /^(\d{4})-(\d{2})-(\d{2})-(.+)\.md$/.exec(sourceFile);
    if (!fileMatch)
      throw new Error(`Invalid Jekyll post filename: ${sourceFile}`);
    const canonicalPath = `/${fileMatch[1]}/${fileMatch[2]}/${fileMatch[3]}/${fileMatch[4]}.html`;
    const baseline = baselineByPath.get(canonicalPath);
    if (!baseline) {
      throw new Error(`Missing production baseline for ${canonicalPath}`);
    }
    const migrated = migratePost(source, sourceFile, baseline);
    validateLegacyHtml(migrated.body);
    records.push({ canonicalPath, source, baseline, migrated });
    const targetName = `${migrated.data.slug}${migrated.extension}`;
    if (generated.has(targetName)) {
      throw new Error(`Duplicate generated output: ${targetName}`);
    }
    generated.set(targetName, serializeMigratedPost(migrated));
  }
  assertMigrationAllowances(allowances, records);
  assertCount('Generated output', generated.size);

  const existing = await currentOutputFiles();
  if (check) {
    assertCount('Committed output', existing.length);
  } else {
    const unexpected = existing.filter((name) => !generated.has(name));
    if (unexpected.length > 0) {
      throw new Error(
        `Unexpected generated blog outputs require review: ${unexpected.join(', ')}`,
      );
    }
  }

  const drift: string[] = [];
  for (const [targetName, content] of generated) {
    const targetPath = resolve(outputDirectory, targetName);
    if (check) {
      let existingContent: string | undefined;
      try {
        existingContent = await readFile(targetPath, 'utf8');
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      }
      if (existingContent !== content) drift.push(targetName);
    } else {
      await writeFile(targetPath, content, 'utf8');
    }
  }

  if (check && drift.length > 0) {
    throw new Error(`Generated blog content has drift: ${drift.join(', ')}`);
  }
  if (!check)
    assertCount('Written output', (await currentOutputFiles()).length);

  console.log(
    check
      ? `Verified ${EXPECTED_COUNT} migrated blog posts without drift.`
      : `Wrote ${EXPECTED_COUNT} migrated blog posts.`,
  );
}

const isMain =
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  generatePosts(process.argv.includes('--check')).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
