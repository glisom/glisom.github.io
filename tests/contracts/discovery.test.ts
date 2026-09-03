import { execFile } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { load, type CheerioAPI } from 'cheerio';
import fg from 'fast-glob';
import matter from 'gray-matter';
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

  it('removes explicit IDs from real headings without touching prose or fenced code', () => {
    const rendered = renderRssBody(
      `## First heading {#first-heading}

### Escaped heading \\{#escaped-heading\\}

Literal prose {#not-a-heading}.

\`\`\`tsx
import { HealthQL } from 'react-native-healthql';
<EmbedFrame src="/keep/code" title="Keep code" />
## Code heading {#keep-code-marker}
\`\`\``,
      'HealthQL',
    );
    const $ = load(rendered);
    const code = $('pre code').text();

    expect($('h2').text()).toBe('First heading');
    expect($('h3').text()).toBe('Escaped heading');
    expect($.text()).toContain('Literal prose {#not-a-heading}.');
    expect(code).toContain("import { HealthQL } from 'react-native-healthql';");
    expect(code).toContain('<EmbedFrame src="/keep/code"');
    expect(code).toContain('## Code heading {#keep-code-marker}');
  });

  it('preserves safe legacy HTML, strips unsafe markup, and rewrites only root-relative URLs', () => {
    const rendered = renderRssBody(
      `<span class="legacy-note" onclick="alert(1)">Read <a href="/about/" title="About">about</a>.</span>

<img src="/images/local.png" alt="Local" />
<img src="//cdn.example.com/shared.png" alt="CDN" />
<a href="javascript:alert(1)">unsafe</a>
<script>alert('no')</script>`,
      'Legacy HTML',
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
      expect(html, route.canonicalPath).not.toMatch(
        /href="(?:https:\/\/grantisom\.com)?\/rss(?:["/?#])/,
      );
    }

    expect(new Set(titles).size).toBe(49);
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
      expect(item.content, item.title).not.toMatch(
        /\\?\{#[A-Za-z][\w:-]*\\?\}/,
      );
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
