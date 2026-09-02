import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import { parseFragment, type DefaultTreeAdapterMap } from 'parse5';
import { describe, expect, it } from 'vitest';
import { migratePost } from '../../scripts/lib/legacy-markdown';
import {
  assertMigrationAllowances,
  serializeMigratedPost,
} from '../../scripts/migrate-jekyll-posts';

const fixture = (name: string) =>
  readFile(new URL(`../fixtures/migration/${name}`, import.meta.url), 'utf8');

const markdown = new MarkdownIt({ html: true });
const APP_STORE_URL = 'https://apps.apple.com/us/app/listwithme/id1224284271';
const NOTION_IMAGE_IDENTITIES = new Map([
  ['/uploads/2023/f159196842.png', '/images/f159196842.png'],
  ['/uploads/2023/fa6c5dfe53.png', '/images/fa6c5dfe53.png'],
  ['/uploads/2023/5fd90bfbf1.png', '/images/5fd90bfbf1.png'],
  ['/uploads/2023/6647450a28.png', '/images/6647450a28.png'],
]);

interface ImageOracleEntry {
  assetKey: string;
  alt: string;
  width: number;
  height: number;
  variant: string;
}

interface BaselineOracle {
  headings: Array<{ id: string; level: number }>;
}

function withoutComponentImports(body: string): string {
  return body.replace(
    /^(?:import (?:EmbedFrame|Figure) from '[^']+';\n)+\n/,
    '',
  );
}

function proseTokens(body: string) {
  const tokens = markdown.parse(withoutComponentImports(body), {});
  return tokens.flatMap((token, tokenIndex) => {
    if (token.type !== 'inline') return [];
    const isHeading = tokens[tokenIndex - 1]?.type === 'heading_open';
    const containsImage = token.children?.some(
      (child) => child.type === 'image',
    );
    const lastTextIndex = token.children?.findLastIndex(
      (child) => child.type === 'text',
    );
    return (token.children ?? []).flatMap((child, childIndex) => {
      if (child.type === 'image' || child.type === 'html_inline') return [];
      if (child.type === 'softbreak' || child.type === 'hardbreak') {
        return [{ type: child.type, content: '\n' }];
      }
      if (child.type !== 'text' && child.type !== 'code_inline') return [];
      if (
        containsImage &&
        child.type === 'text' &&
        child.content.trim() === ''
      ) {
        return [];
      }
      const content =
        isHeading && childIndex === lastTextIndex
          ? child.content.replace(/ \{#[^}\s]+\}$/, '')
          : child.content;
      return [{ type: child.type, content }];
    });
  });
}

function links(body: string): string[] {
  return markdown
    .parse(withoutComponentImports(body), {})
    .flatMap((token) => token.children ?? [])
    .filter((token) => token.type === 'link_open')
    .map((token) => token.attrGet('href'))
    .filter((href): href is string => href !== null);
}

function codeBlocks(body: string) {
  return markdown
    .parse(withoutComponentImports(body), {})
    .filter((token) => token.type === 'fence' || token.type === 'code_block')
    .map((token) => ({
      type: token.type,
      info: token.info,
      content: token.content,
    }));
}

function comments(body: string): string[] {
  return markdown
    .parse(withoutComponentImports(body), {})
    .flatMap((token) =>
      token.type === 'html_block'
        ? [token]
        : token.type === 'inline'
          ? (token.children ?? []).filter(
              (child) => child.type === 'html_inline',
            )
          : [],
    )
    .map((token) => token.content)
    .filter((html) => html.startsWith('<!--'));
}

function headings(body: string) {
  const tokens = markdown.parse(withoutComponentImports(body), {});
  return tokens.flatMap((token, index) => {
    if (token.type !== 'heading_open') return [];
    const inline = tokens[index + 1];
    const marker = / \{#([^}\s]+)\}$/.exec(inline.content);
    return [
      {
        level: Number(token.tag.slice(1)),
        text: inline.content.replace(/ \{#[^}\s]+\}$/, ''),
        id: marker?.[1],
      },
    ];
  });
}

function markdownImages(body: string) {
  return markdown
    .parse(body, {})
    .flatMap((token) => token.children ?? [])
    .filter((token) => token.type === 'image')
    .map((token) => ({ src: token.attrGet('src') ?? '', alt: token.content }));
}

function figureComponents(body: string) {
  return [
    ...body.matchAll(
      /<Figure src="([^"]+)" assetKey="([^"]+)" alt="([^"]*)" width=\{(\d+)\} height=\{(\d+)\} variant="([^"]+)" \/>/g,
    ),
  ].map((match) => ({
    src: match[1],
    assetKey: match[2],
    alt: match[3],
    width: Number(match[4]),
    height: Number(match[5]),
    variant: match[6],
  }));
}

function isElement(
  node: DefaultTreeAdapterMap['node'],
): node is DefaultTreeAdapterMap['element'] {
  return 'tagName' in node;
}

function spotifyIframeSources(body: string): string[] {
  const sources: string[] = [];
  const visit = (node: DefaultTreeAdapterMap['node']) => {
    if (isElement(node) && node.tagName === 'iframe') {
      const src = node.attrs.find(
        (attribute) => attribute.name === 'src',
      )?.value;
      if (src?.startsWith('https://open.spotify.com/')) sources.push(src);
    }
    if ('childNodes' in node) node.childNodes.forEach(visit);
  };
  for (const token of markdown.parse(body, {})) {
    const htmlTokens =
      token.type === 'html_block'
        ? [token]
        : token.type === 'inline'
          ? (token.children ?? []).filter(
              (child) => child.type === 'html_inline',
            )
          : [];
    htmlTokens.forEach((htmlToken) =>
      parseFragment(htmlToken.content).childNodes.forEach(visit),
    );
  }
  return sources;
}

function embedComponents(body: string, title: string) {
  return [
    ...body.matchAll(/<EmbedFrame src="([^"]+)" title="([^"]+)" \/>/g),
  ].map((match) => ({ src: match[1], title: match[2] || title }));
}

function expectedBodyTokens(
  source: string,
  canonicalPath: string,
  title: string,
  baseline: BaselineOracle,
  imageOracle: Record<string, ImageOracleEntry>,
) {
  const sourceHeadings = headings(source);
  const images = markdownImages(source).map(({ src, alt }) => {
    let migratedSrc = src;
    for (const [before, after] of NOTION_IMAGE_IDENTITIES) {
      if (src === before || src === `https://grantisom.com${before}`) {
        migratedSrc = after;
      }
    }
    const enrichment = imageOracle[migratedSrc];
    if (!enrichment)
      throw new Error(`Independent image oracle missing ${migratedSrc}`);
    return { src: migratedSrc, ...enrichment, alt: alt || enrichment.alt };
  });
  const expectedLinks = links(source).map((href) =>
    canonicalPath === '/2026/02/24/listwithme-returns.html' && href === '#'
      ? APP_STORE_URL
      : href,
  );
  const sourceEmbeds = spotifyIframeSources(source);
  return {
    prose: proseTokens(source),
    links: expectedLinks,
    code: codeBlocks(source),
    comments: comments(source),
    headings: sourceHeadings.map((heading, index) => ({
      ...heading,
      level:
        heading.level === 1 &&
        (canonicalPath === '/2018/11/27/playlists.html' ||
          canonicalPath === '/2019/06/04/wwdc-day-1.html')
          ? 2
          : heading.level,
      id: baseline.headings[index]?.id,
    })),
    images,
    embeds: sourceEmbeds.map((src) => ({
      src,
      title: `Spotify playlist: ${title}`,
    })),
  };
}

function actualBodyTokens(output: string, title: string) {
  return {
    prose: proseTokens(output),
    links: links(output),
    code: codeBlocks(output),
    comments: comments(output),
    headings: headings(output),
    images: figureComponents(output),
    embeds: embedComponents(output, title),
  };
}

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

  it('requires exactly four Spotify embeds on only the approved path', async () => {
    const input = await fixture('spotify.md');
    const missing = input.replace(
      /\n<iframe src="https:\/\/open\.spotify\.com\/embed\/playlist\/jkl"[^\n]+\n/,
      '\n',
    );
    expect(() =>
      migratePost(missing, '2020-02-10-2019-playlists.md', { headings: [] }),
    ).toThrow(/expected 4 Spotify iframes; received 3/);
    expect(() =>
      migratePost(input, '2020-02-11-another-playlists.md', { headings: [] }),
    ).toThrow(/Spotify.*only approved.*2019-playlists/i);
    expect(() =>
      migratePost(
        `${input}\n<EmbedFrame src="https://open.spotify.com/embed/playlist/preexisting" title="Preexisting" />\n`,
        '2020-02-10-2019-playlists.md',
        { headings: [] },
      ),
    ).toThrow(/expected 4 migrated Spotify embeds; received 5/);
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
    expect(() =>
      migratePost(
        `${input}![](/images/6647450a28.png)\n`,
        '2023-01-14-notion-for-software.md',
        { headings: [] },
      ),
    ).toThrow(/expected 0 source and 1 migrated occurrence.*received 0\/2/);
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
    expect(result.body.match(/\[App Store\]\(#\)/g)).toHaveLength(9);
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
    expect(() =>
      migratePost(
        '---\ntitle: Other\nexcerpt: Update\n---\n[App Store](#)',
        '2026-02-25-other.md',
        { headings: [] },
      ),
    ).toThrow(/App Store placeholder.*only approved/i);
    expect(() =>
      migratePost(
        '---\ntitle: ListWithMe Returns\nexcerpt: Update\n---\n[App Store](#) and [App Store](https://apps.apple.com/us/app/listwithme/id1224284271)',
        '2026-02-24-listwithme-returns.md',
        { headings: [] },
      ),
    ).toThrow(/expected 1 migrated App Store link; received 2/);
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
      headings: [
        { id: 'deployed-2018' },
        { id: 'deployed-2017' },
        { id: 'deployed-2016' },
        { id: 'deployed-2015' },
        { id: 'deployed-2014' },
      ],
    });
    expect(result.body).toBe(expected);
    expect(result.data.preservedHeadingIds).toEqual([
      'deployed-2018',
      'deployed-2017',
      'deployed-2016',
      'deployed-2015',
      'deployed-2014',
    ]);
  });

  it('requires exactly five body H1s on only the two approved paths', () => {
    const oneH1 = '---\ntitle: Headed\nexcerpt: Summary\n---\n# One heading\n';
    expect(() =>
      migratePost(oneH1, '2018-11-27-playlists.md', {
        headings: [{ id: 'one-heading' }],
      }),
    ).toThrow(/expected 5 body H1 headings; received 1/);
    expect(() =>
      migratePost(oneH1, '2020-01-01-unapproved.md', {
        headings: [{ id: 'one-heading' }],
      }),
    ).toThrow(/Body H1.*only approved/i);
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
      headings: Array<{ id: string; level: number }>;
    }>;
    const imageOracle = JSON.parse(
      await readFile(
        resolve(repositoryRoot, 'tests/fixtures/migration/image-oracle.json'),
        'utf8',
      ),
    ) as Record<string, ImageOracleEntry>;
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

      const candidateOutputs = [
        `${fileMatch[4]}.md`,
        `${fileMatch[4]}.mdx`,
      ].filter((name) => outputFiles.includes(name));
      expect(candidateOutputs, canonicalPath).toHaveLength(1);
      const outputFile = candidateOutputs[0];
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
      expect(source.data.excerpt, canonicalPath).toBeDefined();
      expect(migrated.data.summary).toBe(
        String(source.data.excerpt).replace(/\s+/g, ' ').trim(),
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
      expect(actualBodyTokens(migrated.content, source.data.title)).toEqual(
        expectedBodyTokens(
          source.content,
          canonicalPath,
          source.data.title,
          baseline,
          imageOracle,
        ),
      );
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

  it('independent token oracle detects prose, link, code, comment, heading, image, and embed drift', async () => {
    const imageOracle = JSON.parse(
      await fixture('image-oracle.json'),
    ) as Record<string, ImageOracleEntry>;
    const source = [
      'Paragraph with a [link](https://example.com).',
      '',
      '## Heading',
      '',
      '```text',
      'code',
      '```',
      '',
      '<!-- note -->',
      '',
      '![](/images/logo.png)',
    ].join('\n');
    const output = [
      'Paragraph with changed prose and a [link](https://changed.example.com).',
      '',
      '## Changed heading {#wrong-id}',
      '',
      '```text',
      'changed code',
      '```',
      '',
      '<!-- changed note -->',
      '',
      '<Figure src="/images/logo.png" assetKey="legacy/logo.png" alt="Wrong" width={1} height={1} variant="portrait" />',
      '',
      '<EmbedFrame src="https://open.spotify.com/embed/playlist/unexpected" title="Wrong" />',
    ].join('\n');
    const expected = expectedBodyTokens(
      source,
      '/2020/01/01/example.html',
      'Example',
      { headings: [{ id: 'heading', level: 2 }] },
      imageOracle,
    );
    const actual = actualBodyTokens(output, 'Example');
    expect(actual.prose).not.toEqual(expected.prose);
    expect(actual.links).not.toEqual(expected.links);
    expect(actual.code).not.toEqual(expected.code);
    expect(actual.comments).not.toEqual(expected.comments);
    expect(actual.headings).not.toEqual(expected.headings);
    expect(actual.images).not.toEqual(expected.images);
    expect(actual.embeds).not.toEqual(expected.embeds);
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
    const changed = structuredClone(allowances);
    changed[0].replacements['/uploads/2023/unreviewed.png'] =
      '/images/unreviewed.png';
    expect(() => assertMigrationAllowances(changed, records)).toThrow(
      /exactly match the reviewed identities/,
    );
    const changedSemanticRule = structuredClone(allowances);
    changedSemanticRule[4].semanticNormalization = 'trust-new-fallbacks';
    expect(() =>
      assertMigrationAllowances(changedSemanticRule, records),
    ).toThrow(/exactly match the reviewed identities/);
  });
});
