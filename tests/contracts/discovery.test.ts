import { execFile } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { load, type CheerioAPI } from 'cheerio';
import fg from 'fast-glob';
import matter from 'gray-matter';
import { markdownToMdast, mdxToMdast } from 'satteri';
import sharp from 'sharp';
import { beforeAll, describe, expect, it } from 'vitest';
import { resolveCanonicalUrl } from '../../src/lib/discovery/canonical';
import { renderRssBody } from '../../src/lib/discovery/rss';
import { escapeXml } from '../../src/lib/discovery/xml';

const execFileAsync = promisify(execFile);
const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));
const distRoot = join(repositoryRoot, 'dist');
const siteOrigin = 'https://grantisom.com';
const releaseDate = '2026-09-02';

interface RouteFixture {
  expectedArtifactCount: number;
  expectedSitemapCount: number;
  routes: Array<{
    canonicalPath: string;
    outputPath: string;
    kind: 'page' | 'post' | 'utility';
    inSitemap: boolean;
  }>;
}

interface SourceRecord {
  canonicalPath: string;
  title: string;
  summary: string;
  draft: boolean;
  socialImage?: string;
  canonicalOverride?: string;
  publishedAt?: string;
  updatedAt?: string;
  reviewedAt?: string;
  originalTimestamp?: string;
  collection: string;
}

interface BuiltDocument {
  route: RouteFixture['routes'][number];
  html: string;
  $: CheerioAPI;
}

const routeFixture = JSON.parse(
  await readFile(
    new URL('../fixtures/public-routes.json', import.meta.url),
    'utf8',
  ),
) as RouteFixture;

const expectedSitemapUrls = routeFixture.routes
  .filter((route) => route.inSitemap)
  .map((route) => new URL(route.canonicalPath, siteOrigin).href)
  .toSorted();

const expectedFeedTitles = [
  "Vampire: The Hard Part Isn't Keeping the Mac Awake",
  'skill-thief: Steal the Ideas, Not the Install',
  'Bringing ListWithMe Back to Life',
  'HealthQL Now Supports React Native',
  'HealthQL: SQL for Apple HealthKit',
  'Accessibility Testing in Maestro',
  'Using Act to Run Github Actions Locally',
  'Expo App Config Setup for Multiple Environments',
  'Notion 101 for Software Engineers',
  '9 Must-Read Books for Software Engineers in 2023',
] as const;

let sourceRecords: SourceRecord[] = [];
let recordsByCanonical = new Map<string, SourceRecord>();
let documents: BuiltDocument[] = [];
let feedXml = '';
let sitemapXml = '';
let robotsText = '';

async function readSourceRecords(): Promise<SourceRecord[]> {
  const paths = await fg('src/content/**/*.{md,mdx}', {
    cwd: repositoryRoot,
    absolute: true,
  });
  return Promise.all(
    paths.map(async (path) => {
      const parsed = matter(await readFile(path, 'utf8'));
      const collection = path.split('/src/content/')[1]?.split('/')[0] ?? '';
      return { ...parsed.data, collection } as SourceRecord;
    }),
  );
}

async function readBuiltDocument(
  route: RouteFixture['routes'][number],
): Promise<BuiltDocument> {
  const html = await readFile(join(distRoot, route.outputPath), 'utf8');
  return { route, html, $: load(html) };
}

function rssItems(xml: string) {
  const $ = load(xml, { xmlMode: true });
  return $('channel > item')
    .map((_, element) => {
      const item = $(element);
      return {
        title: item.children('title').text(),
        link: item.children('link').text(),
        guid: item.children('guid').text(),
        pubDate: item.children('pubDate').text(),
        description: item.children('description').text(),
        content: item.children('content\\:encoded').text(),
      };
    })
    .get();
}

function mdastNodeTypes(node: unknown): string[] {
  if (!node || typeof node !== 'object' || !('type' in node)) return [];
  const record = node as { type: string; children?: unknown[] };
  return [
    record.type,
    ...(record.children ?? []).flatMap((child) => mdastNodeTypes(child)),
  ];
}

beforeAll(async () => {
  await execFileAsync('npm', ['run', 'build'], {
    cwd: repositoryRoot,
    maxBuffer: 10 * 1024 * 1024,
  });

  sourceRecords = await readSourceRecords();
  recordsByCanonical = new Map(
    sourceRecords.map((record) => [record.canonicalPath, record]),
  );
  documents = await Promise.all(
    routeFixture.routes
      .filter((route) => route.outputPath.endsWith('.html'))
      .map(readBuiltDocument),
  );
  feedXml = await readFile(join(distRoot, 'feed.xml'), 'utf8');
  sitemapXml = await readFile(join(distRoot, 'sitemap.xml'), 'utf8');
  robotsText = await readFile(join(distRoot, 'robots.txt'), 'utf8');
}, 90_000);

describe('canonical discovery helpers', () => {
  it('resolves inferred and authored HTTPS canonical URLs', () => {
    expect(resolveCanonicalUrl('/projects/hermes-ios/')).toBe(
      'https://grantisom.com/projects/hermes-ios/',
    );
    expect(
      resolveCanonicalUrl(
        '/2026/09/01/vampire.html',
        'https://example.com/original',
      ),
    ).toBe('https://example.com/original');
  });

  it('escapes every XML-sensitive character', () => {
    expect(escapeXml(`Grant & <notes> \"today\" 'here'`)).toBe(
      'Grant &amp; &lt;notes&gt; &quot;today&quot; &apos;here&apos;',
    );
  });
});

describe('RSS body rendering', () => {
  it('converts generated embeds and figures while preserving semantic order', () => {
    const rendered = renderRssBody(
      `import EmbedFrame from '../../components/editorial/EmbedFrame.astro';
import Figure from '../../components/editorial/Figure.astro';

Before.

<EmbedFrame src="https://open.spotify.com/embed/playlist/abc" title="Spotify playlist: Notes" />

<Figure src="/images/book.jpg" assetKey="legacy/book.jpg" alt="Cover of Book" width={250} height={382} variant="portrait" />

After.`,
      'Notes',
      'mdx',
    );
    const $ = load(rendered);

    expect($('p').first().text()).toBe('Before.');
    expect($('a').attr('href')).toBe(
      'https://open.spotify.com/embed/playlist/abc',
    );
    expect($('a').text()).toBe('Spotify playlist: Notes');
    expect($('img').attr('src')).toBe('https://grantisom.com/images/book.jpg');
    expect($('img').attr('alt')).toBe('Cover of Book');
    expect($.text()).toContain('After.');
    expect(rendered).not.toMatch(/(?:EmbedFrame|Figure|assetKey|^import )/m);
  });

  it('separates a generated Figure from an adjacent authored HTML image', () => {
    const rendered = renderRssBody(
      `<img src="/images/authored.png" alt="Authored" />
<Figure src="/images/generated.png" alt="Generated" />`,
      'Adjacent HTML',
      'mdx',
    );
    const $ = load(rendered);
    const bodyChildren = $('body').children();

    expect(bodyChildren.map((_, element) => element.tagName).get()).toEqual([
      'img',
      'p',
    ]);
    expect(bodyChildren.eq(0).attr('src')).toBe(
      'https://grantisom.com/images/authored.png',
    );
    expect(bodyChildren.eq(1).find('img').attr('src')).toBe(
      'https://grantisom.com/images/generated.png',
    );
  });

  it('keeps a generated Figure between adjacent prose as its own flow block', () => {
    const rendered = renderRssBody(
      `Before.
<Figure src="/images/between.png" alt="Between" />
After.`,
      'Between prose',
      'mdx',
    );
    const $ = load(rendered);
    const paragraphs = $('body > p');

    expect(paragraphs).toHaveLength(3);
    expect(paragraphs.eq(0).text()).toBe('Before.');
    expect(paragraphs.eq(1).find('img').attr('src')).toBe(
      'https://grantisom.com/images/between.png',
    );
    expect(paragraphs.eq(2).text()).toBe('After.');
  });

  it('renders consecutive generated components as separate ordered flow blocks', () => {
    const rendered = renderRssBody(
      `<Figure src="/images/first.png" alt="First" />
<EmbedFrame src="https://open.spotify.com/embed/playlist/abc" title="Second" />
<Figure src="/images/third.png" alt="Third" />`,
      'Consecutive components',
      'mdx',
    );
    const $ = load(rendered);
    const paragraphs = $('body > p');

    expect(paragraphs).toHaveLength(3);
    expect(paragraphs.eq(0).find('img').attr('alt')).toBe('First');
    expect(paragraphs.eq(1).find('a').text()).toBe('Second');
    expect(paragraphs.eq(1).find('a').attr('href')).toBe(
      'https://open.spotify.com/embed/playlist/abc',
    );
    expect(paragraphs.eq(2).find('img').attr('alt')).toBe('Third');
  });

  it('removes explicit IDs from real headings without touching prose or fenced code', () => {
    const rendered = renderRssBody(
      `## First heading \\{#first-heading}

### Escaped heading \\{#escaped-heading\\}

#### 2018 \\{#2018}

Literal prose \\{#not-a-heading}.

\`\`\`tsx
import { HealthQL } from 'react-native-healthql';
<EmbedFrame src="/keep/code" title="Keep code" />
## Code heading {#keep-code-marker}
\`\`\``,
      'HealthQL',
      'mdx',
    );
    const $ = load(rendered);
    const code = $('pre code').text();

    expect($('h2').text()).toBe('First heading');
    expect($('h3').text()).toBe('Escaped heading');
    expect($('h4').text()).toBe('2018');
    expect($.text()).toContain('Literal prose {#not-a-heading}.');
    expect(code).toContain("import { HealthQL } from 'react-native-healthql';");
    expect(code).toContain('<EmbedFrame src="/keep/code"');
    expect(code).toContain('## Code heading {#keep-code-marker}');
  });

  it('preserves four-space and tab-indented code without applying MDX transforms', () => {
    const rendered = renderRssBody(
      `    import Figure from '../../components/editorial/Figure.astro';
    <Figure src="/images/keep.png" assetKey="legacy/keep.png" alt="Keep figure source" width={250} height={382} variant="portrait" />
\timport EmbedFrame from '../../components/editorial/EmbedFrame.astro';
\t<EmbedFrame src="/keep/embed" title="Keep embed source" />`,
      'Indented examples',
      'mdx',
    );
    const $ = load(rendered);
    const code = $('pre code').text();

    expect(code).toBe(
      `import Figure from '../../components/editorial/Figure.astro';
<Figure src="/images/keep.png" assetKey="legacy/keep.png" alt="Keep figure source" width={250} height={382} variant="portrait" />
import EmbedFrame from '../../components/editorial/EmbedFrame.astro';
<EmbedFrame src="/keep/embed" title="Keep embed source" />\n`,
    );
    expect($('img')).toHaveLength(0);
    expect($('a')).toHaveLength(0);
  });

  it('consumes legitimate multiline top-level MDX import declarations', () => {
    const rendered = renderRssBody(
      `import {
  EmbedFrame,

  Figure,
} from '../../components/editorial/index.ts';

Visible article prose.`,
      'Multiline imports',
      'mdx',
    );
    const $ = load(rendered);

    expect($('p').text()).toBe('Visible article prose.');
    expect($.text()).not.toMatch(/(?:import|EmbedFrame|Figure|index\.ts)/);
  });

  it('pins source-format decisions to the Satteri parser used by Astro MDX', () => {
    const nodeTypes = (tree: ReturnType<typeof mdxToMdast>) => {
      expect(tree.type).toBe('root');
      return tree.type === 'root'
        ? tree.children.map((child) => child.type)
        : [];
    };

    expect(
      nodeTypes(
        mdxToMdast(
          `import\tFigure from './keyword-tab.astro'

Visible.`,
          { position: true },
        ),
      ),
    ).toEqual(['mdxjsEsm', 'paragraph']);
    expect(
      nodeTypes(
        mdxToMdast(
          `import
Figure from './bare-newline.astro'

Visible.`,
          { position: true },
        ),
      ),
    ).toEqual(['paragraph', 'paragraph']);
    expect(
      nodeTypes(
        mdxToMdast(
          `\timport Figure from './leading-tab.astro'

Visible.`,
          { position: true },
        ),
      ),
    ).toEqual(['paragraph', 'paragraph']);
    expect(
      nodeTypes(
        markdownToMdast(
          `import Figure from './plain-markdown.astro'

Visible.`,
          { position: true },
        ),
      ),
    ).toEqual(['paragraph', 'paragraph']);
  });

  it('removes a true ESM node nested inside an MDX JSX wrapper', () => {
    const source = `<Wrapper>
import Figure from './nested.astro'

Visible inside.
</Wrapper>`;
    const tree = mdxToMdast(source, { position: true });

    expect(mdastNodeTypes(tree)).toEqual([
      'root',
      'mdxJsxFlowElement',
      'mdxjsEsm',
      'paragraph',
      'text',
    ]);

    const $ = load(renderRssBody(source, 'Nested ESM', 'mdx'));
    expect($.text().trim()).toBe('Visible inside.');
    expect($.text()).not.toMatch(/(?:import|nested\.astro|Figure)/);
  });

  it.each([
    { name: 'LF', lineEnding: '\n' },
    { name: 'CRLF', lineEnding: '\r\n' },
    { name: 'CR', lineEnding: '\r' },
  ])(
    'strips ESM containing fenced and indented JS-comment samples with $name endings',
    ({ lineEnding }) => {
      const source = [
        `import Figure from './Figure.astro'`,
        '/*',
        '```mdx',
        '<Figure src="/fenced-comment.png" alt="Fenced comment" />',
        '```',
        '',
        '    <Figure src="/indented-comment.png" alt="Indented comment" />',
        '*/',
        'export const secret = 1',
        '',
        'Visible.',
      ].join(lineEnding);
      const tree = mdxToMdast(source, { position: true });

      expect(tree.type).toBe('root');
      expect(
        tree.type === 'root' ? tree.children.map((child) => child.type) : [],
      ).toEqual(['mdxjsEsm', 'paragraph']);

      const $ = load(renderRssBody(source, 'Comment samples', 'mdx'));
      expect(
        $('p')
          .map((_, element) => $(element).text())
          .get(),
      ).toEqual(['Visible.']);
      expect($('pre')).toHaveLength(0);
      expect($('img')).toHaveLength(0);
      expect($.text()).not.toMatch(
        /(?:import|export|Figure|comment\.png|secret)/,
      );
    },
  );

  it('removes complete Satteri ESM ranges containing imports, comments, and exports', () => {
    const source = `import First from './First.astro'; // attached line comment
/* attached block comment */
import Second from './Second.astro' /* trailing block comment */
export const secret = 'remove this';

Visible article prose.`;
    const tree = mdxToMdast(source, { position: true });

    expect(tree.type).toBe('root');
    expect(
      tree.type === 'root' ? tree.children.map((child) => child.type) : [],
    ).toEqual(['mdxjsEsm', 'paragraph']);

    const $ = load(renderRssBody(source, 'Combined ESM', 'mdx'));
    expect(
      $('p')
        .map((_, element) => $(element).text())
        .get(),
    ).toEqual(['Visible article prose.']);
    expect($.text().trim()).toBe('Visible article prose.');
  });

  it.each([
    {
      name: 'binding followed by from on the next line',
      declaration: `import Figure
from './Figure.astro'`,
    },
    {
      name: 'tab between the import keyword and binding',
      declaration: `import\tFigure from './Figure.astro'`,
    },
    {
      name: 'import with a trailing line comment',
      declaration: `import Figure from './Figure.astro'; // generated component`,
    },
    {
      name: 'import with a trailing block comment',
      declaration: `import Figure from './Figure.astro' /* generated component */`,
    },
  ])(
    'consumes a valid MDX $name without swallowing prose',
    ({ declaration }) => {
      const rendered = renderRssBody(
        `${declaration}

Visible article prose.`,
        'MDX import grammar',
        'mdx',
      );
      const $ = load(rendered);

      expect($('p').text()).toBe('Visible article prose.');
      expect($.text()).not.toMatch(
        /(?:^|\s)(?:import|from|Figure|article\.css|generated component)(?:\s|$)/,
      );
    },
  );

  it('preserves one to three spaces followed by a tab as indented code', () => {
    const rendered = renderRssBody(
      ` \timport Figure from '../../components/editorial/Figure.astro';
 \t<Figure src="/images/keep-one.png" alt="Keep one" />
  \timport EmbedFrame from '../../components/editorial/EmbedFrame.astro';
   \t<EmbedFrame src="/keep-three" title="Keep three" />
   \t## Keep heading \\{#keep-mixed-heading}`,
      'Mixed indentation',
      'mdx',
    );
    const $ = load(rendered);
    const code = $('pre code').text();

    expect(code).toBe(
      `import Figure from '../../components/editorial/Figure.astro';
<Figure src="/images/keep-one.png" alt="Keep one" />
import EmbedFrame from '../../components/editorial/EmbedFrame.astro';
<EmbedFrame src="/keep-three" title="Keep three" />
## Keep heading \\{#keep-mixed-heading}\n`,
    );
    expect($('img')).toHaveLength(0);
    expect($('a')).toHaveLength(0);
  });

  it('protects a Satteri code node nested inside an MDX JSX wrapper', () => {
    const source = `<Wrapper>
\`\`\`mdx
import Keep from './keep'
<Figure src="/images/nested-code.png" alt="Nested code" />
## Nested heading {#nested-heading}
\`\`\`
</Wrapper>`;
    const tree = mdxToMdast(source, { position: true });

    expect(mdastNodeTypes(tree)).toEqual(['root', 'mdxJsxFlowElement', 'code']);

    const $ = load(renderRssBody(source, 'Nested code', 'mdx'));
    expect($('pre code').text()).toBe(
      `import Keep from './keep'
<Figure src="/images/nested-code.png" alt="Nested code" />
## Nested heading {#nested-heading}
`,
    );
    expect($('img')).toHaveLength(0);
    expect($('a')).toHaveLength(0);
  });

  it.each([
    {
      name: 'backtick fence adjacent to a generated Figure',
      source: `<Figure src="/images/live-before-code.png" alt="Live before code" />
\`\`\`mdx
import Keep from './keep'
<Figure src="/images/literal-code.png" alt="Literal code" />
## Literal heading {#literal-heading}
\`\`\`

After.`,
      liveImage: 'https://grantisom.com/images/live-before-code.png',
      hasAfter: true,
      codeEndsWithNewline: true,
    },
    {
      name: 'tilde fence adjacent to another MDX JSX element',
      source: `<Aside />
~~~mdx
import Keep from './keep'
<Figure src="/images/literal-code.png" alt="Literal code" />
## Literal heading {#literal-heading}
~~~

After.`,
      liveImage: undefined,
      hasAfter: true,
      codeEndsWithNewline: true,
    },
    {
      name: 'unclosed fence adjacent to another MDX JSX element',
      source: `<Aside />
\`\`\`mdx
import Keep from './keep'
<Figure src="/images/literal-code.png" alt="Literal code" />
## Literal heading {#literal-heading}`,
      liveImage: undefined,
      hasAfter: false,
      codeEndsWithNewline: false,
    },
  ])(
    'uses the Satteri code range for a $name',
    ({ source, liveImage, hasAfter, codeEndsWithNewline }) => {
      const tree = mdxToMdast(source, { position: true });
      expect(mdastNodeTypes(tree)).toContain('code');

      const $ = load(renderRssBody(source, 'Adjacent code', 'mdx'));
      expect($('pre code').text()).toBe(
        `import Keep from './keep'
<Figure src="/images/literal-code.png" alt="Literal code" />
## Literal heading {#literal-heading}${codeEndsWithNewline ? '\n' : ''}`,
      );
      expect($('img')).toHaveLength(liveImage ? 1 : 0);
      if (liveImage) expect($('img').attr('src')).toBe(liveImage);
      expect(
        $('p').filter((_, element) => $(element).text() === 'After.'),
      ).toHaveLength(hasAfter ? 1 : 0);
    },
  );

  it.each([
    {
      name: 'more than 64 lines',
      declaration: `import {
${Array.from({ length: 70 }, (_, index) => `  Name${index},`).join('\n')}
} from './many-names.js'`,
    },
    {
      name: 'more than 16 KiB',
      declaration: `import Figure from './Figure.astro' /* ${'x'.repeat(17_000)} */`,
    },
  ])('removes a Satteri ESM range spanning $name', ({ declaration }) => {
    const source = `${declaration}

Visible after a large import.`;
    const tree = mdxToMdast(source, { position: true });
    expect(tree.type).toBe('root');
    expect(tree.type === 'root' ? tree.children[0]?.type : undefined).toBe(
      'mdxjsEsm',
    );

    const $ = load(renderRssBody(source, 'Large import', 'mdx'));
    expect($('p').text()).toBe('Visible after a large import.');
    expect($.text().trim()).toBe('Visible after a large import.');
  });

  it.each([
    {
      name: 'with attributes',
      declaration: `import data from './data.json' with { type: 'json' }`,
    },
    {
      name: 'assert attributes',
      declaration: `import data from './data.json' assert { type: 'json' }`,
    },
  ])('removes parser-accepted imports using $name', ({ declaration }) => {
    const source = `${declaration}

Visible after import attributes.`;
    const tree = mdxToMdast(source, { position: true });
    expect(tree.type).toBe('root');
    expect(tree.type === 'root' ? tree.children[0]?.type : undefined).toBe(
      'mdxjsEsm',
    );

    const $ = load(renderRssBody(source, 'Import attributes', 'mdx'));
    expect($('p').text()).toBe('Visible after import attributes.');
    expect($.text().trim()).toBe('Visible after import attributes.');
  });

  it('removes Satteri ESM ranges from CR-only MDX without losing following prose', () => {
    const source = `import Figure from './Figure.astro'\r\rVisible after CR.`;
    const tree = mdxToMdast(source, { position: true });
    expect(tree.type).toBe('root');
    expect(
      tree.type === 'root' ? tree.children.map((child) => child.type) : [],
    ).toEqual(['mdxjsEsm', 'paragraph']);

    const $ = load(renderRssBody(source, 'CR-only import', 'mdx'));
    expect($('p').text()).toBe('Visible after CR.');
    expect($.text().trim()).toBe('Visible after CR.');
  });

  it.each([
    {
      name: 'bare import keyword followed by a newline',
      source: `import
Figure from './bare-newline.astro'

Visible.`,
      expected: [`import\nFigure from './bare-newline.astro'`, 'Visible.'],
    },
    {
      name: 'bare side-effect import text split after the keyword',
      source: `import
'./bare-side-effect.css'

Visible.`,
      expected: [`import\n'./bare-side-effect.css'`, 'Visible.'],
    },
    {
      name: 'one-space-prefixed import text',
      source: ` import Figure from './one-space.astro'

Visible.`,
      expected: [`import Figure from './one-space.astro'`, 'Visible.'],
    },
    {
      name: 'two-space-prefixed import text',
      source: `  import Figure from './two-space.astro'

Visible.`,
      expected: [`import Figure from './two-space.astro'`, 'Visible.'],
    },
    {
      name: 'three-space-prefixed import text',
      source: `   import Figure from './three-space.astro'

Visible.`,
      expected: [`import Figure from './three-space.astro'`, 'Visible.'],
    },
    {
      name: 'paragraph-interrupting import text',
      source: `Paragraph before.
import Figure from './paragraph-interrupt.astro'

Visible.`,
      expected: [
        `Paragraph before.\nimport Figure from './paragraph-interrupt.astro'`,
        'Visible.',
      ],
    },
  ])('preserves Satteri-paragraph $name in MDX', ({ source, expected }) => {
    const tree = mdxToMdast(source, { position: true });
    expect(tree.type).toBe('root');
    expect(tree.type === 'root' ? tree.children[0]?.type : undefined).toBe(
      'paragraph',
    );

    const $ = load(renderRssBody(source, 'Import-looking prose', 'mdx'));
    expect(
      $('p')
        .map((_, element) => $(element).text())
        .get(),
    ).toEqual(expected);
  });

  it('does not create an ESM range by masking adjacent indented paragraph text', () => {
    const source = `\tcode sample
import Figure from './paragraph-after-indent.astro'

Visible.`;
    const tree = mdxToMdast(source, { position: true });

    expect(tree.type).toBe('root');
    expect(
      tree.type === 'root' ? tree.children.map((child) => child.type) : [],
    ).toEqual(['paragraph', 'paragraph']);

    const $ = load(renderRssBody(source, 'Adjacent paragraph text', 'mdx'));
    expect($('pre code').text()).toBe('code sample\n');
    expect(
      $('p')
        .map((_, element) => $(element).text())
        .get(),
    ).toEqual([
      `import Figure from './paragraph-after-indent.astro'`,
      'Visible.',
    ]);
  });

  it.each([
    {
      name: 'column-1 import declaration text',
      source: `import Figure from './plain-root.astro'

Visible.`,
      expected: [`import Figure from './plain-root.astro'`, 'Visible.'],
    },
    {
      name: 'keyword-tab import declaration text',
      source: `import\tFigure from './plain-keyword-tab.astro'

Visible.`,
      expected: [`import\tFigure from './plain-keyword-tab.astro'`, 'Visible.'],
    },
    {
      name: 'import attributes text',
      source: `import data from './plain.json' with { type: 'json' }

Visible.`,
      expected: [
        `import data from './plain.json' with { type: 'json' }`,
        'Visible.',
      ],
    },
    {
      name: 'import and export text',
      source: `import Figure from './plain-combined.astro'
export const answer = 42

Visible.`,
      expected: [
        `import Figure from './plain-combined.astro'\nexport const answer = 42`,
        'Visible.',
      ],
    },
    {
      name: 'bare newline import text',
      source: `import
Figure from './plain-bare-newline.astro'

Visible.`,
      expected: [
        `import\nFigure from './plain-bare-newline.astro'`,
        'Visible.',
      ],
    },
    {
      name: 'leading-space import text',
      source: `   import Figure from './plain-leading-space.astro'

Visible.`,
      expected: [
        `import Figure from './plain-leading-space.astro'`,
        'Visible.',
      ],
    },
    {
      name: 'paragraph-interrupting import text',
      source: `Paragraph before.
import Figure from './plain-paragraph-interrupt.astro'

Visible.`,
      expected: [
        `Paragraph before.\nimport Figure from './plain-paragraph-interrupt.astro'`,
        'Visible.',
      ],
    },
  ])('never strips $name from a .md source', ({ source, expected }) => {
    const tree = markdownToMdast(source, { position: true });
    expect(tree.type).toBe('root');
    expect(
      tree.type === 'root'
        ? tree.children.some((child) => child.type === 'mdxjsEsm')
        : true,
    ).toBe(false);

    const $ = load(renderRssBody(source, 'Plain Markdown', 'md'));
    expect(
      $('p')
        .map((_, element) => $(element).text())
        .get(),
    ).toEqual(expected);
  });

  it('uses Satteri code authority for a leading-tab fenced block', () => {
    const rendered = renderRssBody(
      `\t\`\`\`mdx
<Figure src="/images/live-after-code.png" alt="Live after code" />
## Live heading \\{#live-heading}`,
      'Indented fence marker',
      'mdx',
    );
    const $ = load(rendered);

    expect($('pre code').text()).toBe(
      `<Figure src="/images/live-after-code.png" alt="Live after code" />
## Live heading \\{#live-heading}`,
    );
    expect($('img')).toHaveLength(0);
    expect($('h2')).toHaveLength(0);
  });

  it.each([
    { name: 'tab', indentation: '\t' },
    { name: 'space followed by tab', indentation: ' \t' },
    { name: 'four spaces', indentation: '    ' },
  ])(
    'preserves a $name-indented matched fence as one Markdown code block',
    ({ indentation }) => {
      const source = `${indentation}\`\`\`mdx
${indentation}<Figure src="/images/indented-fence.png" alt="Indented fence" />
${indentation}\`\`\`

After.`;
      const tree = mdxToMdast(source, { position: true });

      expect(mdastNodeTypes(tree)).toEqual([
        'root',
        'code',
        'paragraph',
        'text',
      ]);

      const $ = load(renderRssBody(source, 'Matched indented fence', 'mdx'));
      expect($('pre code').text()).toBe(
        `\`\`\`mdx
<Figure src="/images/indented-fence.png" alt="Indented fence" />
\`\`\`
`,
      );
      expect($('img')).toHaveLength(0);
      expect(
        $('p').filter((_, element) => $(element).text() === 'After.'),
      ).toHaveLength(1);
    },
  );

  it('preserves a MarkdownIt-recognized blockquote fence without rewriting its container prefix', () => {
    const source = `> \`\`\`mdx
> <Figure src="/images/quoted-code.png" alt="Quoted code" />
> \`\`\`

After.`;
    const tree = mdxToMdast(source, { position: true });

    expect(mdastNodeTypes(tree)).toEqual([
      'root',
      'blockquote',
      'code',
      'paragraph',
      'text',
    ]);

    const $ = load(renderRssBody(source, 'Quoted fence', 'mdx'));
    expect($('blockquote pre code').text()).toBe(
      '<Figure src="/images/quoted-code.png" alt="Quoted code" />\n',
    );
    expect($('img')).toHaveLength(0);
    expect(
      $('p').filter((_, element) => $(element).text() === 'After.'),
    ).toHaveLength(1);
  });

  it.each([
    {
      name: 'blockquote',
      source: `> <Aside />
> \`\`\`mdx
> <Figure src="/images/container-code.png" alt="Container code" />
> \`\`\`

After.`,
      selector: 'blockquote pre code',
    },
    {
      name: 'list item',
      source: `- <Aside />
  \`\`\`mdx
  <Figure src="/images/container-code.png" alt="Container code" />
  \`\`\`

After.`,
      selector: 'li pre code',
    },
  ])(
    'keeps a Satteri code node adjacent to JSX inside its $name',
    ({ source, selector }) => {
      const tree = mdxToMdast(source, { position: true });
      expect(mdastNodeTypes(tree)).toContain('mdxJsxFlowElement');
      expect(mdastNodeTypes(tree)).toContain('code');

      const $ = load(renderRssBody(source, 'Container code', 'mdx'));
      expect($(selector).text()).toBe(
        '<Figure src="/images/container-code.png" alt="Container code" />\n',
      );
      expect($('img')).toHaveLength(0);
      expect(
        $('p').filter((_, element) => $(element).text() === 'After.'),
      ).toHaveLength(1);
    },
  );

  it('recognizes a nested closing fence when blockquote marker spacing changes', () => {
    const source = `> <Aside />
>   \`\`\`mdx
> code
>\`\`\`
>
> After inside.

Outside.`;
    const tree = mdxToMdast(source, { position: true });

    expect(mdastNodeTypes(tree)).toEqual([
      'root',
      'blockquote',
      'mdxJsxFlowElement',
      'code',
      'paragraph',
      'text',
      'paragraph',
      'text',
    ]);

    const $ = load(renderRssBody(source, 'Quote spacing', 'mdx'));
    expect($('blockquote pre code').text()).toBe('code\n');
    expect($('blockquote > p').text()).toBe('After inside.');
    expect($('body > p').text()).toBe('Outside.');
  });

  it('does not mistake a quoted marker inside an unclosed top-level fence for a close', () => {
    const source = `<Aside />
\`\`\`mdx
code
> \`\`\``;
    const tree = mdxToMdast(source, { position: true });

    expect(mdastNodeTypes(tree)).toEqual(['root', 'mdxJsxFlowElement', 'code']);

    const $ = load(renderRssBody(source, 'Unclosed quoted marker', 'mdx'));
    expect($('pre code').text()).toBe('code\n> ```');
  });

  it('does not strip an extra blockquote depth from an unclosed quoted fence', () => {
    const source = `> <Aside />
> \`\`\`mdx
> code
>> \`\`\``;
    const tree = mdxToMdast(source, { position: true });

    expect(mdastNodeTypes(tree)).toEqual([
      'root',
      'blockquote',
      'mdxJsxFlowElement',
      'code',
    ]);

    const $ = load(renderRssBody(source, 'Quote depth', 'mdx'));
    expect($('blockquote pre code').text()).toBe('code\n> ```');
  });

  it('safely lifts a list-marker fence swallowed by adjacent MDX JSX', () => {
    const source = `<Aside />
- \`\`\`mdx
  <Figure src="/images/list-marker-code.png" alt="List marker code" />
  \`\`\`

After.`;
    const tree = mdxToMdast(source, { position: true });

    expect(mdastNodeTypes(tree)).toEqual([
      'root',
      'mdxJsxFlowElement',
      'list',
      'listItem',
      'code',
      'paragraph',
      'text',
    ]);

    const $ = load(renderRssBody(source, 'List marker fence', 'mdx'));
    expect($('body > pre code').text()).toBe(
      '<Figure src="/images/list-marker-code.png" alt="List marker code" />\n',
    );
    expect($('img')).toHaveLength(0);
    expect($('body > p').text()).toBe('After.');
  });

  it('delimits a canonical fence from a parser-accepted info string beginning with tildes', () => {
    const source = `<Aside />
\`\`\`~~~lang
<Figure src="/images/info-code.png" alt="Info code" />
\`\`\`

After.`;
    const tree = mdxToMdast(source, { position: true });

    expect(mdastNodeTypes(tree)).toContain('code');

    const $ = load(renderRssBody(source, 'Info string', 'mdx'));
    expect($('pre code').text()).toBe(
      '<Figure src="/images/info-code.png" alt="Info code" />\n',
    );
    expect($('img')).toHaveLength(0);
    expect(
      $('p').filter((_, element) => $(element).text() === 'After.'),
    ).toHaveLength(1);
  });

  it('keeps a tab-indented fence marker and subsequent transforms inside the open fence', () => {
    const rendered = renderRssBody(
      `\`\`\`mdx
keep
\t\`\`\`
import Figure from '../../components/editorial/Figure.astro';
<Figure src="/images/keep-in-fence.png" alt="Keep in fence" />
## Code heading {#keep-fence-heading}
\`\`\`

After the fence.`,
      'Tab-indented fence marker',
      'mdx',
    );
    const $ = load(rendered);

    expect($('pre code').text()).toBe(
      `keep
\t\`\`\`
import Figure from '../../components/editorial/Figure.astro';
<Figure src="/images/keep-in-fence.png" alt="Keep in fence" />
## Code heading {#keep-fence-heading}
`,
    );
    expect(
      $('p')
        .map((_, element) => $(element).text())
        .get(),
    ).toEqual(['After the fence.']);
    expect($('img')).toHaveLength(0);
  });

  it('preserves safe legacy HTML, strips unsafe markup, and rewrites only root-relative URLs', () => {
    const rendered = renderRssBody(
      `<span class="legacy-note" onclick="alert(1)">Read <a href="/about/" title="About">about</a>.</span>

<img src="/images/local.png" alt="Local" />
<img src="//cdn.example.com/shared.png" alt="CDN" />
<a href="javascript:alert(1)">unsafe</a>
<script>alert('no')</script>`,
      'Legacy HTML',
      'md',
    );
    const $ = load(rendered);

    expect($('span.legacy-note')).toHaveLength(1);
    expect($('span').attr('onclick')).toBeUndefined();
    expect($('a[title="About"]').attr('href')).toBe(
      'https://grantisom.com/about/',
    );
    expect($('img[alt="Local"]').attr('src')).toBe(
      'https://grantisom.com/images/local.png',
    );
    expect($('img[alt="CDN"]').attr('src')).toBe(
      '//cdn.example.com/shared.png',
    );
    expect($('a').last().attr('href')).toBeUndefined();
    expect(rendered).not.toContain('<script');
  });
});

describe('built document metadata', () => {
  it('emits the complete unique metadata contract on all 49 HTML pages', async () => {
    expect(documents).toHaveLength(49);

    const titles: string[] = [];
    const descriptions: string[] = [];
    const fallbackImages = new Set<string>();

    for (const { route, $, html } of documents) {
      const record = recordsByCanonical.get(route.canonicalPath);
      const expectedCanonical = new URL(
        record?.canonicalOverride ?? route.canonicalPath,
        siteOrigin,
      ).href;
      const title = $('head > title').text().trim();
      const description = $('head > meta[name="description"]')
        .attr('content')
        ?.trim();
      const canonical = $('head > link[rel="canonical"]');
      const socialImage = $('head > meta[property="og:image"]').attr('content');

      expect($('html').attr('lang'), route.canonicalPath).toBe('en');
      expect($('head > title'), route.canonicalPath).toHaveLength(1);
      expect(title, route.canonicalPath).not.toBe('');
      expect(
        $('head > meta[name="description"]'),
        route.canonicalPath,
      ).toHaveLength(1);
      expect(description, route.canonicalPath).toBeTruthy();
      if (route.kind === 'post') {
        expect(description, route.canonicalPath).toBe(
          `${record?.title} — ${record?.summary}`,
        );
      }
      expect(canonical, route.canonicalPath).toHaveLength(1);
      expect(canonical.attr('href'), route.canonicalPath).toBe(
        expectedCanonical,
      );
      expect(new URL(canonical.attr('href') ?? '').protocol).toBe('https:');
      expect($('meta[property="og:type"]'), route.canonicalPath).toHaveLength(
        1,
      );
      expect($('meta[property="og:site_name"]').attr('content')).toBe(
        'Grant Isom',
      );
      expect($('meta[property="og:title"]').attr('content')).toBe(title);
      expect($('meta[property="og:description"]').attr('content')).toBe(
        description,
      );
      expect($('meta[property="og:url"]').attr('content')).toBe(
        expectedCanonical,
      );
      expect(socialImage, route.canonicalPath).toMatch(
        /^https:\/\/grantisom\.com\//,
      );
      expect($('meta[name="twitter:card"]').attr('content')).toBe(
        'summary_large_image',
      );
      expect($('meta[name="twitter:title"]').attr('content')).toBe(title);
      expect($('meta[name="twitter:description"]').attr('content')).toBe(
        description,
      );
      expect($('meta[name="twitter:image"]').attr('content')).toBe(socialImage);
      expect(
        $('link[rel="alternate"][type="application/rss+xml"]').attr('href'),
      ).toBe('https://grantisom.com/feed.xml');

      const socialUrl = new URL(socialImage ?? '');
      if (socialUrl.origin === siteOrigin) {
        await expect(
          access(
            join(distRoot, decodeURIComponent(socialUrl.pathname.slice(1))),
          ),
          route.canonicalPath,
        ).resolves.toBeUndefined();
      }
      if (record?.socialImage) {
        expect(socialImage, route.canonicalPath).toBe(
          new URL(record.socialImage, siteOrigin).href,
        );
      } else {
        fallbackImages.add(socialImage ?? '');
      }

      titles.push(title);
      descriptions.push(description ?? '');
      expect(html, route.canonicalPath).not.toMatch(
        /href="(?:https:\/\/grantisom\.com)?\/rss(?:["/?#])/,
      );
    }

    expect(new Set(titles).size).toBe(49);
    expect(new Set(descriptions).size).toBe(49);
    expect(fallbackImages.size).toBe(1);
  });

  it('emits one safe BlogPosting graph per post and none on non-articles', () => {
    let articleGraphs = 0;

    for (const { route, $, html } of documents) {
      const scripts = $('script[type="application/ld+json"]');
      if (route.kind !== 'post') {
        expect(scripts, route.canonicalPath).toHaveLength(0);
        continue;
      }

      const record = recordsByCanonical.get(route.canonicalPath);
      expect(record, route.canonicalPath).toBeDefined();
      expect(scripts, route.canonicalPath).toHaveLength(1);
      const raw = scripts.first().html() ?? '';
      expect(raw, route.canonicalPath).not.toContain('<');
      const graph = JSON.parse(raw) as Record<string, unknown>;
      const canonical = $('link[rel="canonical"]').attr('href');
      const socialImage = $('meta[property="og:image"]').attr('content');

      expect(graph).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: record?.title,
        datePublished: record?.publishedAt,
        author: {
          '@type': 'Person',
          name: 'Grant Isom',
          url: 'https://grantisom.com',
        },
        image: socialImage,
        mainEntityOfPage: canonical,
      });
      if (record?.updatedAt) {
        expect(graph.dateModified).toBe(record.updatedAt);
      } else {
        expect(graph).not.toHaveProperty('dateModified');
      }
      expect(html.match(/type="application\/ld\+json"/g)).toHaveLength(1);
      articleGraphs += 1;
    }

    expect(articleGraphs).toBe(23);
  });

  it('marks only the designed 404 noindex', () => {
    const noindexRoutes = documents
      .filter(({ $ }) => $('meta[name="robots"][content*="noindex"]').length)
      .map(({ route }) => route.canonicalPath);

    expect(noindexRoutes).toEqual(['/404.html']);
  });
});

describe('built discovery files', () => {
  it('emits all 52 route-oracle artifacts', async () => {
    expect(routeFixture.expectedArtifactCount).toBe(52);
    await expect(
      Promise.all(
        routeFixture.routes.map((route) =>
          access(join(distRoot, route.outputPath)),
        ),
      ),
    ).resolves.toHaveLength(52);
  });

  it('publishes the newest ten posts as full-content RSS with stable URLs and dates', () => {
    const items = rssItems(feedXml);

    expect(items).toHaveLength(10);
    expect(items.map((item) => item.title)).toEqual(expectedFeedTitles);

    for (const item of items) {
      const record = sourceRecords.find((entry) => entry.title === item.title);
      expect(record, item.title).toBeDefined();
      const expectedLink = new URL(record?.canonicalPath ?? '', siteOrigin)
        .href;
      const expectedDate = new Date(
        record?.originalTimestamp ?? `${record?.publishedAt}T12:00:00Z`,
      ).toUTCString();

      expect(item.link, item.title).toBe(expectedLink);
      expect(item.guid, item.title).toBe(item.link);
      expect(item.pubDate, item.title).toBe(expectedDate);
      expect(item.content.length, item.title).toBeGreaterThan(
        item.description.length,
      );
      expect(item.content, item.title).toContain('<p>');
      expect(item.content, item.title).not.toMatch(/(?:href|src)="\/(?!\/)/);
      expect(item.content, item.title).not.toMatch(
        /(?:<\/?(?:EmbedFrame|Figure)\b|assetKey=)/,
      );
      expect(item.content, item.title).not.toMatch(
        /^import\s+(?:EmbedFrame|Figure)\s+from/m,
      );
      expect(item.content, item.title).not.toMatch(/\\?\{#[^{}\s]+\\?\}/);
    }

    const healthQl = items.find(
      (item) => item.title === 'HealthQL Now Supports React Native',
    );
    expect(healthQl?.content).toContain(
      "import { HealthQL } from 'react-native-healthql';",
    );
  });

  it('lists exactly the sorted public HTML canonicals with meaningful modification dates', () => {
    const $ = load(sitemapXml, { xmlMode: true });
    const entries = $('urlset > url')
      .map((_, element) => ({
        location: $(element).children('loc').text(),
        lastModified: $(element).children('lastmod').text(),
      }))
      .get();

    expect(entries).toHaveLength(routeFixture.expectedSitemapCount);
    expect(entries.map((entry) => entry.location)).toEqual(expectedSitemapUrls);

    for (const entry of entries) {
      const path = new URL(entry.location).pathname;
      const record = recordsByCanonical.get(path);
      const expectedLastModified = record
        ? (record.updatedAt ?? record.reviewedAt ?? record.publishedAt)
        : releaseDate;
      expect(entry.lastModified, path).toBe(expectedLastModified);
    }

    expect(entries.map((entry) => entry.location)).not.toContain(
      'https://grantisom.com/404.html',
    );
    expect(sitemapXml).not.toMatch(
      /(?:\/feed\.xml|\/sitemap\.xml|\/robots\.txt|\/uploads\/|\/projects\/listwithme\/)/,
    );
  });

  it('serves the exact robots policy as plain text', async () => {
    const { GET } = await import('../../src/pages/robots.txt');
    const response = GET();

    expect(robotsText).toBe(
      'User-agent: *\nAllow: /\nSitemap: https://grantisom.com/sitemap.xml\n',
    );
    expect(await response.text()).toBe(robotsText);
    expect(response.headers.get('content-type')).toBe(
      'text/plain; charset=utf-8',
    );
  });

  it('ships the reviewed fallback art at the exact Open Graph dimensions', async () => {
    const metadata = await sharp(
      join(repositoryRoot, 'src/assets/social/default-og.png'),
    ).metadata();

    expect({ width: metadata.width, height: metadata.height }).toEqual({
      width: 1200,
      height: 630,
    });
  });
});
