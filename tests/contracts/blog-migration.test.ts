import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import matter from 'gray-matter';
import { describe, expect, it } from 'vitest';
import {
  firstPlainTextParagraph,
  migratePost,
  normalizeSummary,
} from '../../scripts/lib/legacy-markdown';
import {
  assertMigrationAllowances,
  serializeMigratedPost,
} from '../../scripts/migrate-jekyll-posts';

const fixture = (name: string) =>
  readFile(new URL(`../fixtures/migration/${name}`, import.meta.url), 'utf8');

describe('Jekyll post migration', () => {
  it('serializes stable frontmatter and preserves date-like fields as strings', () => {
    const migrated = migratePost(
      '---\ntitle: Dated post\nexcerpt: Summary\ndate: 2026-01-02 03:04:05 +0000\n---\nBody\n',
      '2026-01-02-dated-post.md',
      { headings: [] },
    );
    const serialized = serializeMigratedPost({
      ...migrated,
      data: {
        ...migrated.data,
        updatedAt: '2026-01-03',
        reviewedAt: '2026-01-04',
      },
    });
    expect(serialized).toMatch(
      /^---\ntitle: Dated post\nslug: dated-post\ncanonicalPath: \/2026\/01\/02\/dated-post\.html\nsummary: Summary\n/,
    );
    expect(serialized).toContain('publishedAt: "2026-01-02"');
    expect(serialized).toContain('updatedAt: "2026-01-03"');
    expect(serialized).toContain('reviewedAt: "2026-01-04"');
    expect(serialized).toContain(
      'originalTimestamp: "2026-01-02T03:04:05.000Z"',
    );
    expect(serialized.endsWith('---\nBody\n')).toBe(true);
  });

  it('uses the filename date and keeps the underscore slug', () => {
    const result = migratePost(
      '---\ntitle: Apps\nexcerpt: Hello\n---\nBody',
      '2020-05-23-mac_apps.md',
      { headings: [] },
    );
    expect(result.data.publishedAt).toBe('2020-05-23');
    expect(result.data.slug).toBe('mac_apps');
    expect(result.data.canonicalPath).toBe('/2020/05/23/mac_apps.html');
    expect(typeof result.data.publishedAt).toBe('string');
  });

  it('normalizes scalar tags and defaults kind without inferring from tags', () => {
    const result = migratePost(
      '---\ntitle: Example\nexcerpt: Summary\ntags: ios swift\n---\nBody',
      '2026-01-02-example.md',
      { headings: [] },
    );
    expect(result.data.tags).toEqual(['ios', 'swift']);
    expect(result.data.kind).toBe('Post');
  });

  it('uses the first plain-text paragraph when excerpt is absent', async () => {
    const input = await fixture('no-headings.md');
    const expected = await fixture('no-headings.expected.md');
    const result = migratePost(input, '2018-04-02-reading-list.md', {
      headings: [],
    });
    expect(result.data.summary).toBe(
      'Starting with last year, I have been trying to keep track of the books I read.',
    );
    expect(result.body).toBe(expected);
  });

  it('converts Spotify markup into an MDX EmbedFrame', async () => {
    const input = await fixture('spotify.md');
    const expected = await fixture('spotify.expected.md');
    const result = migratePost(input, '2020-02-10-2019-playlists.md', {
      headings: [],
    });
    expect(result.extension).toBe('.mdx');
    expect(result.body).toBe(expected);
    expect(result.body).toContain(
      "import EmbedFrame from '../../components/editorial/EmbedFrame.astro';",
    );
    expect(result.body).toContain('title="Spotify playlist: 2019 Playlists"');
    expect(result.body).not.toContain('<iframe');
  });

  it('converts an empty-alt legacy book cover into an accessible Figure', async () => {
    const input = await fixture('portrait-images.md');
    const expected = await fixture('portrait-images.expected.md');
    const result = migratePost(input, '2023-01-02-mustread-books-for.md', {
      headings: [{ id: 'build' }],
    });
    expect(result.extension).toBe('.mdx');
    expect(result.body).toBe(expected.replace('## Build', '## Build {#build}'));
    expect(result.body).toContain(
      "import Figure from '../../components/editorial/Figure.astro';",
    );
    expect(result.body).toContain('src="/images/ec18f32904.jpg"');
    expect(result.body).toContain('assetKey="legacy/ec18f32904.jpg"');
    expect(result.body).toContain('alt="Cover of Build by Tony Fadell"');
    expect(result.body).toContain('variant="portrait"');
    expect(result.body).not.toContain('alt=""');
  });

  it('corrects all four Notion image identities before Figure conversion', async () => {
    const input = await fixture('notion-images.md');
    const expected = await fixture('notion-images.expected.md');
    const result = migratePost(input, '2023-01-14-notion-for-software.md', {
      headings: [],
    });
    expect(result.body).toBe(expected);
    expect(result.body).not.toContain('/uploads/2023/');
  });

  it('requires exactly four Notion corrections on only the approved path', async () => {
    const input = await fixture('notion-images.md');
    const missing = input.replace(
      '![](/uploads/2023/6647450a28.png)',
      'No fourth image.',
    );
    const duplicate = `${input}![](/uploads/2023/6647450a28.png)\n`;
    expect(() =>
      migratePost(missing, '2023-01-14-notion-for-software.md', {
        headings: [],
      }),
    ).toThrow(/expected 4 Notion image occurrences; received 3/);
    expect(() =>
      migratePost(duplicate, '2023-01-14-notion-for-software.md', {
        headings: [],
      }),
    ).toThrow(/expected 4 Notion image occurrences; received 5/);
    expect(() =>
      migratePost(input, '2023-01-15-another-post.md', { headings: [] }),
    ).toThrow(/only approved.*notion-for-software/i);
  });

  it('replaces the one approved ListWithMe placeholder and no other hash link', async () => {
    const input = await fixture('listwithme-action.md');
    const expected = await fixture('listwithme-action.expected.md');
    const result = migratePost(input, '2026-02-24-listwithme-returns.md', {
      headings: [],
    });
    expect(result.body).toBe(expected);
    expect(result.body).toContain(
      '[App Store](https://apps.apple.com/us/app/listwithme/id1224284271)',
    );
    expect(result.body).not.toContain('](#)');
  });

  it('requires exactly one scoped ListWithMe placeholder occurrence', () => {
    const listWithMeWithoutPlaceholder =
      '---\ntitle: ListWithMe Returns\nexcerpt: Update\n---\nNo App Store action here.';
    const listWithMeWithTwoPlaceholders =
      '---\ntitle: ListWithMe Returns\nexcerpt: Update\n---\n[App Store](#) and [App Store](#)';
    expect(() =>
      migratePost(
        listWithMeWithoutPlaceholder,
        '2026-02-24-listwithme-returns.md',
        { headings: [] },
      ),
    ).toThrow(/expected 1 App Store placeholder; received 0/);
    expect(() =>
      migratePost(
        listWithMeWithTwoPlaceholders,
        '2026-02-24-listwithme-returns.md',
        { headings: [] },
      ),
    ).toThrow(/expected 1 App Store placeholder; received 2/);
  });

  it('preserves fenced and indented code exactly', async () => {
    const input = await fixture('fenced-and-indented.md');
    const expected = await fixture('fenced-and-indented.expected.md');
    const result = migratePost(input, '2023-02-01-expo-app-config.md', {
      headings: [],
    });
    expect(result.body).toBe(expected);
  });

  it('demotes body H1s and applies captured IDs in document order', async () => {
    const input = await fixture('body-h1.md');
    const expected = await fixture('body-h1.expected.md');
    const result = migratePost(input, '2018-11-27-playlists.md', {
      headings: [{ id: 'deployed-2018' }, { id: 'deployed-2017' }],
    });
    expect(result.body).toBe(expected);
    expect(result.data.preservedHeadingIds).toEqual([
      'deployed-2018',
      'deployed-2017',
    ]);
  });

  it('converts kramdown button markup without changing other links', async () => {
    const input = await fixture('kramdown-button.md');
    const expected = await fixture('kramdown-button.expected.md');
    const result = migratePost(input, '2020-01-01-button.md', {
      headings: [],
    });
    expect(result.body).toBe(expected);
  });

  it('preserves frontmatter and migration invariants across all 23 posts', async () => {
    const repositoryRoot = resolve(new URL('../..', import.meta.url).pathname);
    const sourceDirectory = resolve(repositoryRoot, '_posts');
    const outputDirectory = resolve(repositoryRoot, 'src/content/blog');
    const sourceFiles = (await readdir(sourceDirectory))
      .filter((name) => name.endsWith('.md'))
      .sort();
    const outputFiles = (await readdir(outputDirectory))
      .filter((name) => /\.(?:md|mdx)$/.test(name))
      .sort();
    const baselines = JSON.parse(
      await readFile(
        resolve(repositoryRoot, 'tests/fixtures/legacy-pages.json'),
        'utf8',
      ),
    ) as Array<{
      url: string;
      headings: Array<{ id: string }>;
    }>;
    const baselineByPath = new Map(
      baselines.map((baseline) => [new URL(baseline.url).pathname, baseline]),
    );

    expect(sourceFiles).toHaveLength(23);
    expect(outputFiles).toHaveLength(23);
    expect(baselines).toHaveLength(23);

    const canonicalPaths: string[] = [];
    const allBodies: string[] = [];
    const migratedByPath = new Map<
      string,
      { data: Record<string, unknown>; body: string }
    >();

    for (const sourceFileName of sourceFiles) {
      const source = matter(
        await readFile(resolve(sourceDirectory, sourceFileName), 'utf8'),
      );
      const fileMatch = /^(\d{4})-(\d{2})-(\d{2})-(.+)\.md$/.exec(
        sourceFileName,
      );
      expect(fileMatch).not.toBeNull();
      if (!fileMatch) continue;
      const canonicalPath = `/${fileMatch[1]}/${fileMatch[2]}/${fileMatch[3]}/${fileMatch[4]}.html`;
      const baseline = baselineByPath.get(canonicalPath);
      expect(baseline, canonicalPath).toBeDefined();
      if (!baseline) continue;

      const expected = migratePost(
        await readFile(resolve(sourceDirectory, sourceFileName), 'utf8'),
        sourceFileName,
        baseline,
      );
      const outputFile = `${fileMatch[4]}${expected.extension}`;
      expect(outputFiles).toContain(outputFile);
      const migrated = matter(
        await readFile(resolve(outputDirectory, outputFile), 'utf8'),
      );

      canonicalPaths.push(String(migrated.data.canonicalPath));
      allBodies.push(migrated.content);
      migratedByPath.set(canonicalPath, {
        data: migrated.data,
        body: migrated.content,
      });
      expect(migrated.data.title).toBe(source.data.title);
      expect(migrated.data.publishedAt).toBe(sourceFileName.slice(0, 10));
      expect(typeof migrated.data.publishedAt).toBe('string');
      expect(migrated.data.summary).toBe(
        normalizeSummary(
          source.data.excerpt ?? firstPlainTextParagraph(source.content),
        ),
      );
      expect(migrated.data.tags).toEqual(
        Array.isArray(source.data.tags)
          ? source.data.tags
          : typeof source.data.tags === 'string'
            ? source.data.tags.split(/\s+/).filter(Boolean)
            : [],
      );
      expect(migrated.data.comments).toBe(source.data.comments ?? true);
      expect(migrated.data.preservedHeadingIds).toEqual(
        baseline.headings.map((heading) => heading.id),
      );
      expect(migrated.content).toBe(expected.body);
      expect(migrated.content).not.toMatch(/!\[\]\(/);
      expect(migrated.content).not.toContain('alt=""');
    }

    expect(canonicalPaths).toContain('/2020/05/23/mac_apps.html');
    expect(new Set(canonicalPaths).size).toBe(23);
    const listWithMe = migratedByPath.get(
      '/2026/02/24/listwithme-returns.html',
    );
    expect(listWithMe?.body).toContain(
      'https://apps.apple.com/us/app/listwithme/id1224284271',
    );
    expect(listWithMe?.body).not.toContain('](#)');

    const allFigureAssetKeys = allBodies.flatMap((body) =>
      [...body.matchAll(/<Figure\b[^>]* assetKey="([^"]+)"/g)].map(
        (match) => match[1],
      ),
    );
    const importedLegacyAssets = new Set(
      (await readdir(resolve(repositoryRoot, 'src/assets/legacy'))).map(
        (name) => `legacy/${name}`,
      ),
    );
    expect(
      allFigureAssetKeys.every((assetKey) =>
        importedLegacyAssets.has(assetKey),
      ),
    ).toBe(true);
    expect(allFigureAssetKeys).toHaveLength(16);
    expect(new Set(allFigureAssetKeys).size).toBe(16);
  });

  it('accounts for exactly the five structured migration allowances', async () => {
    const repositoryRoot = resolve(new URL('../..', import.meta.url).pathname);
    const baselines = JSON.parse(
      await readFile(
        resolve(repositoryRoot, 'tests/fixtures/legacy-pages.json'),
        'utf8',
      ),
    ) as Array<{
      url: string;
      headings: Array<{ id: string; level: number }>;
      iframeSources: string[];
    }>;
    const allowances = JSON.parse(
      await readFile(
        resolve(repositoryRoot, 'tests/fixtures/migration-allowances.json'),
        'utf8',
      ),
    );
    const records: Parameters<typeof assertMigrationAllowances>[1] = [];
    for (const baseline of baselines) {
      const path = new URL(baseline.url).pathname;
      const sourceFile = `${path.slice(1, 11).replaceAll('/', '-')}-${path.slice(12, -5)}.md`;
      const source = await readFile(
        resolve(repositoryRoot, '_posts', sourceFile),
        'utf8',
      );
      records.push({
        canonicalPath: path,
        source,
        baseline,
        migrated: migratePost(source, sourceFile, baseline),
      });
    }
    expect(() => assertMigrationAllowances(allowances, records)).not.toThrow();
    expect(() =>
      assertMigrationAllowances(allowances.slice(0, 4), records),
    ).toThrow(/exactly 5/);
  });
});
