import { execFile } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { load, type CheerioAPI } from 'cheerio';
import fg from 'fast-glob';
import postcss, { type Root } from 'postcss';
import { beforeAll, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));
const distRoot = join(repositoryRoot, 'dist');

interface LegacyPage {
  url: string;
  headings: Array<{ id: string; level?: number; text?: string }>;
}

interface BuiltArticle {
  $: CheerioAPI;
  html: string;
}

interface ExpectedRelationship {
  label: string;
  href: string;
}

const EXPECTED_RELATIONSHIPS: Record<string, readonly ExpectedRelationship[]> =
  {
    '/2018/04/02/reading-list.html': [
      {
        label: 'Continued in',
        href: '/2023/01/02/mustread-books-for.html',
      },
      { label: 'Related skill', href: '/skills/goodreads-export/' },
    ],
    '/2018/11/27/playlists.html': [
      { label: 'Continued in', href: '/2020/02/10/2019-playlists.html' },
      {
        label: 'Another personal archive',
        href: '/2018/04/02/reading-list.html',
      },
    ],
    '/2019/05/30/listwithme.html': [
      { label: 'Built as', href: '/listwithme/' },
      {
        label: 'Rebuilt later',
        href: '/2026/02/24/listwithme-returns.html',
      },
    ],
    '/2019/06/04/wwdc-day-1.html': [
      { label: 'Next day', href: '/2019/06/06/wwdc-day-2.html' },
      { label: 'Week in review', href: '/2019/06/09/wwdc-review.html' },
    ],
    '/2019/06/06/wwdc-day-2.html': [
      { label: 'Previous day', href: '/2019/06/04/wwdc-day-1.html' },
      { label: 'Next day', href: '/2019/06/07/wwdc-day-3.html' },
      { label: 'Week in review', href: '/2019/06/09/wwdc-review.html' },
    ],
    '/2019/06/07/wwdc-day-3.html': [
      { label: 'Previous day', href: '/2019/06/06/wwdc-day-2.html' },
      { label: 'Next day', href: '/2019/06/08/wwdc-day-4.html' },
      { label: 'Week in review', href: '/2019/06/09/wwdc-review.html' },
    ],
    '/2019/06/08/wwdc-day-4.html': [
      { label: 'Previous day', href: '/2019/06/07/wwdc-day-3.html' },
      { label: 'Week in review', href: '/2019/06/09/wwdc-review.html' },
    ],
    '/2019/06/09/wwdc-review.html': [
      { label: 'Where the week began', href: '/2019/06/04/wwdc-day-1.html' },
      { label: 'How the week ended', href: '/2019/06/08/wwdc-day-4.html' },
    ],
    '/2020/02/10/2019-playlists.html': [
      { label: 'Earlier playlists', href: '/2018/11/27/playlists.html' },
      { label: 'Another annual list', href: '/2018/04/02/reading-list.html' },
    ],
    '/2020/05/23/mac_apps.html': [
      { label: 'Current notes tool', href: '/app-library/obsidian/' },
      {
        label: 'One developer workflow',
        href: '/2020/05/29/safari-inspecting-simulators.html',
      },
      {
        label: 'Later tools thinking',
        href: '/2023/01/14/notion-for-software.html',
      },
    ],
    '/2020/05/29/safari-inspecting-simulators.html': [
      { label: 'Part of the toolkit', href: '/2020/05/23/mac_apps.html' },
      {
        label: 'Another iOS test workflow',
        href: '/2023/07/19/accessibility-testing-in.html',
      },
    ],
    '/2020/09/28/next-chapter.html': [
      {
        label: 'What came next',
        href: '/2022/11/07/2-years-at-illuminate.html',
      },
      {
        label: 'More healthcare software',
        href: '/2026/02/01/healthql-sql-for-healthkit.html',
      },
    ],
    '/2022/11/07/2-years-at-illuminate.html': [
      {
        label: 'Where the chapter began',
        href: '/2020/09/28/next-chapter.html',
      },
      {
        label: 'Later healthcare software',
        href: '/2026/02/01/healthql-sql-for-healthkit.html',
      },
    ],
    '/2023/01/02/mustread-books-for.html': [
      { label: 'Earlier reading list', href: '/2018/04/02/reading-list.html' },
      { label: 'Related skill', href: '/skills/goodreads-export/' },
    ],
    '/2023/01/14/notion-for-software.html': [
      { label: 'What I use now', href: '/app-library/obsidian/' },
      { label: 'Earlier tools list', href: '/2020/05/23/mac_apps.html' },
    ],
    '/2023/02/01/expo-app-config.html': [
      {
        label: 'Built on this stack',
        href: '/2026/02/07/healthql-react-native.html',
      },
      {
        label: 'Another mobile workflow',
        href: '/2023/07/19/accessibility-testing-in.html',
      },
    ],
    '/2023/05/15/using-act-to.html': [
      {
        label: 'Another CI test workflow',
        href: '/2023/07/19/accessibility-testing-in.html',
      },
      {
        label: 'Another release workflow',
        href: '/2023/02/01/expo-app-config.html',
      },
    ],
    '/2023/07/19/accessibility-testing-in.html': [
      {
        label: 'Related mobile setup',
        href: '/2023/02/01/expo-app-config.html',
      },
      {
        label: 'Related local CI workflow',
        href: '/2023/05/15/using-act-to.html',
      },
      {
        label: 'Earlier iOS testing',
        href: '/2020/05/29/safari-inspecting-simulators.html',
      },
    ],
    '/2026/02/01/healthql-sql-for-healthkit.html': [
      { label: 'Built as', href: '/projects/healthql/' },
      {
        label: 'Expanded in',
        href: '/2026/02/07/healthql-react-native.html',
      },
    ],
    '/2026/02/07/healthql-react-native.html': [
      { label: 'Built as', href: '/projects/healthql/' },
      {
        label: 'Built on',
        href: '/2026/02/01/healthql-sql-for-healthkit.html',
      },
      {
        label: 'Related Expo setup',
        href: '/2023/02/01/expo-app-config.html',
      },
    ],
    '/2026/02/24/listwithme-returns.html': [
      { label: 'Built as', href: '/listwithme/' },
      { label: 'Earlier chapter', href: '/2019/05/30/listwithme.html' },
    ],
    '/2026/09/01/skill-thief.html': [
      { label: 'Related authored skill', href: '/skills/write-like-grant/' },
      { label: 'Related authored skill', href: '/skills/goodreads-export/' },
    ],
    '/2026/09/01/vampire.html': [
      { label: 'Earlier Mac toolkit', href: '/2020/05/23/mac_apps.html' },
      {
        label: 'Another Swift project',
        href: '/2026/02/01/healthql-sql-for-healthkit.html',
      },
      {
        label: 'Another app revival',
        href: '/2026/02/24/listwithme-returns.html',
      },
    ],
  };

let legacyPages: LegacyPage[] = [];
const articles = new Map<string, BuiltArticle>();
let builtStyles: Root;

async function exists(relativePath: string): Promise<boolean> {
  try {
    await access(join(repositoryRoot, relativePath));
    return true;
  } catch {
    return false;
  }
}

async function readArticle(pathname: string): Promise<BuiltArticle> {
  const outputPath = join(distRoot, pathname.slice(1));
  let html = '';
  try {
    html = await readFile(outputPath, 'utf8');
  } catch {
    // An empty document produces assertion failures instead of setup errors in RED.
  }
  return { $: load(html), html };
}

function article(pathname: string): BuiltArticle {
  const output = articles.get(pathname);
  if (!output) throw new Error(`Article fixture was not loaded: ${pathname}`);
  return output;
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function mediaBlocks(query: string): Root[] {
  const matches: Root[] = [];
  const normalize = (value: string) =>
    value
      .replace(/\s+/g, '')
      .replace(/\(min-width:(\d+)px\)/g, '(width>=$1px)')
      .replace(/\(max-width:(\d+)px\)/g, '(width<=$1px)');
  builtStyles.walkAtRules('media', (rule) => {
    if (normalize(rule.params) !== normalize(query)) return;
    matches.push(
      postcss.parse(
        (rule.nodes ?? []).map((node) => node.toString()).join('\n'),
      ),
    );
  });
  return matches;
}

beforeAll(async () => {
  await execFileAsync(
    'fnm',
    ['exec', '--using=.nvmrc', 'npm', 'run', 'build'],
    {
      cwd: repositoryRoot,
    },
  );
  legacyPages = JSON.parse(
    await readFile(
      join(repositoryRoot, 'tests/fixtures/legacy-pages.json'),
      'utf8',
    ),
  ) as LegacyPage[];
  for (const legacyPage of legacyPages) {
    const pathname = new URL(legacyPage.url).pathname;
    articles.set(pathname, await readArticle(pathname));
  }
  const stylesheetPaths = await fg('dist/_astro/*.css', {
    cwd: repositoryRoot,
    absolute: true,
  });
  const css = (
    await Promise.all(stylesheetPaths.map((path) => readFile(path, 'utf8')))
  ).join('\n');
  builtStyles = postcss.parse(css);
}, 60_000);

describe('dated article output', () => {
  it('emits every legacy article at its exact dated .html path', async () => {
    expect(legacyPages).toHaveLength(23);
    for (const legacyPage of legacyPages) {
      const pathname = new URL(legacyPage.url).pathname;
      expect(
        await exists(`dist/${pathname.slice(1)}`),
        `missing ${pathname}`,
      ).toBe(true);
    }
    expect(await exists('dist/2020/05/23/mac_apps.html')).toBe(true);
    expect(await exists('dist/2026/09/01/vampire.html')).toBe(true);
    expect(await exists('dist/projects/listwithme/index.html')).toBe(false);
  });

  it('renders one page title and preserves every legacy heading identity', () => {
    for (const legacyPage of legacyPages) {
      const pathname = new URL(legacyPage.url).pathname;
      const { $ } = article(pathname);
      expect($('h1'), `${pathname} h1`).toHaveLength(1);
      for (const heading of legacyPage.headings) {
        expect($(`#${heading.id}`), `${pathname} #${heading.id}`).toHaveLength(
          1,
        );
      }
    }
  });

  it('derives the canonical URL and article context from authored post data', () => {
    const { $ } = article('/2026/02/24/listwithme-returns.html');

    expect($('link[rel="canonical"]').attr('href')).toBe(
      'https://grantisom.com/2026/02/24/listwithme-returns.html',
    );
    expect($('nav[aria-label="Browse"] a[aria-current="page"]').text()).toBe(
      'Blog',
    );
    expect(normalizeText($('.article-eyebrow').text())).toBe(
      'Blog / Build log · 2026',
    );
    expect(normalizeText($('h1').text())).toBe(
      'Bringing ListWithMe Back to Life',
    );
    expect($('h1 em').text()).toBe('ListWithMe');
    expect(
      $('.article-masthead [data-halftone-image] img[alt]').attr('alt'),
    ).toBe('A fine blue halftone drawing of a hand holding a pen');
    expect($('[data-article-fact="Published"] strong').text()).toBe(
      'February 24, 2026',
    );
    expect($('[data-article-fact="Connected project"] a').attr('href')).toBe(
      '/listwithme/',
    );
  });
});

describe('article reading modes', () => {
  it('omits contents for short posts and exposes ledger plus native disclosure for long posts', () => {
    expect(
      article('/2018/04/02/reading-list.html').$('[data-toc]'),
    ).toHaveLength(0);

    const listWithMe = article('/2026/02/24/listwithme-returns.html').$;
    expect(listWithMe('nav[data-toc][data-toc-state="ledger"]')).toHaveLength(
      1,
    );
    expect(
      listWithMe('details[data-toc][data-toc-state="disclosure"]'),
    ).toHaveLength(1);
    expect(
      listWithMe('nav[data-toc] a')
        .map((_, node) => listWithMe(node).attr('href'))
        .get(),
    ).toEqual([
      '#a-complete-rebuild',
      '#the-technical-side',
      '#why-imessage-apps-still-matter',
      '#whats-next',
    ]);
    expect(listWithMe('nav[data-toc] [data-toc-number]')).toHaveLength(4);
    expect(
      article('/2026/09/01/vampire.html').$('[data-toc-number]'),
    ).toHaveLength(0);
  });

  it('keeps the explicit 821–1023px rail-and-stacked article state', () => {
    const intermediate = mediaBlocks(
      '(min-width: 821px) and (max-width: 1023px)',
    );
    expect(intermediate).not.toHaveLength(0);

    const selectors = intermediate
      .flatMap((root) => root.nodes)
      .map((node) => node.toString())
      .join('\n')
      .replace(/\s+/g, '');
    expect(selectors).toContain('.article-masthead');
    expect(selectors).toContain('grid-template-columns:1fr');
    expect(selectors).toContain('.reading-grid');
    expect(selectors).toContain('.toc-slot');
  });

  it('closes the responsive fact ledger cleanly when optional project context is absent', () => {
    const readingList = article('/2018/04/02/reading-list.html').$;
    expect(readingList('.article-facts').attr('style')).toContain(
      '--article-fact-count: 3',
    );

    const intermediate = mediaBlocks(
      '(min-width: 821px) and (max-width: 1023px)',
    )
      .flatMap((root) => root.nodes)
      .map((node) => node.toString())
      .join('\n')
      .replace(/\s+/g, '');
    expect(intermediate).toContain('.article-fact:last-child:nth-child(odd)');
    expect(intermediate).toContain('flex-basis:100%');

    const mobile = mediaBlocks('(max-width: 820px)')
      .flatMap((root) => root.nodes)
      .map((node) => node.toString())
      .join('\n')
      .replace(/\s+/g, '');
    expect(mobile).toContain('.article-fact:last-child:nth-child(odd)');
    expect(mobile).toContain('grid-column:1/-1');
  });

  it('omits empty tag facts and context instead of publishing blank labels', () => {
    const usingAct = article('/2023/05/15/using-act-to.html').$;
    const css = builtStyles.toString();

    expect(usingAct('[data-article-fact="Filed under"]')).toHaveLength(0);
    expect(usingAct('.article-facts').attr('style')).toContain(
      '--article-fact-count: 2',
    );
    expect(usingAct('.article-context-panel')).toHaveLength(0);
    expect(css).toMatch(
      /\.article-fact:nth-last-child\(-n\s*\+\s*2\)\s*\{[^}]*border-bottom:\s*0/s,
    );
    expect(css).toMatch(
      /\.article-fact:nth-child\(2\):nth-last-child\(2\)\s*\{[^}]*border-bottom:\s*1px/s,
    );
  });

  it('keeps the approved drop cap on the reviewed presentation only', () => {
    const css = builtStyles.toString();

    expect(css).not.toMatch(/\.prose\s*>\s*p:first-of-type:{1,2}first-letter/);
    expect(css).toMatch(
      /\.prose--numbered\s*>\s*p:first-of-type:{1,2}first-letter/,
    );
    expect(
      article('/2023/05/15/using-act-to.html').$(
        '[data-article-prose].prose--numbered',
      ),
    ).toHaveLength(0);
  });

  it('keeps article prose and wide content inside bounded reading regions', () => {
    const css = builtStyles.toString();
    expect(css).toMatch(/\.prose\s*\{[^}]*max-inline-size:\s*720px/s);
    expect(css).toMatch(/\.prose\s*\{[^}]*font-family:\s*var\(--serif\)/s);
    expect(css).toMatch(/\.prose\s+pre[^}]*overflow-x:\s*auto/s);
    expect(css).toMatch(/\.prose\s+table[^}]*overflow-x:\s*auto/s);
    const wide = mediaBlocks('(min-width: 1220px)')
      .flatMap((root) => root.nodes)
      .map((node) => node.toString())
      .join('\n')
      .replace(/\s+/g, '');
    expect(wide).toContain('.article-figure--wide');
    expect(wide).toContain('max-inline-size:920px');
  });

  it('preserves the approved offset, natural-ratio evidence-art crop', () => {
    const css = builtStyles.toString();
    expect(css).toMatch(
      /\.article-evidence[^}]*\.article-evidence-image\.halftone-image\s+picture[^}]*inline-size:\s*125%/s,
    );
    expect(css).toMatch(
      /\.article-evidence[^}]*\.article-evidence-image\.halftone-image\s+picture[^}]*margin-inline-start:\s*-20%/s,
    );
    expect(css).toMatch(
      /\.article-evidence[^}]*\.article-evidence-image\.halftone-image\s+img[^}]*block-size:\s*auto/s,
    );
  });
});

describe('article media and deferred integrations', () => {
  it('keeps Spotify embeds lazy, titled, and paired with a readable fallback', () => {
    const { $ } = article('/2020/02/10/2019-playlists.html');
    const embeds = $(
      'iframe[src^="https://open.spotify.com/"][loading="lazy"][title]',
    );

    expect(embeds).toHaveLength(4);
    embeds.each((_, frame) => {
      const src = $(frame).attr('src');
      const figure = $(frame).closest('figure[data-migrated-embed]');
      expect(figure.find('[data-embed-fallback] a').attr('href')).toBe(src);
      expect(normalizeText(figure.find('[data-embed-fallback]').text())).toBe(
        `Open ${$(frame).attr('title')}`,
      );
    });
  });

  it('renders code-heavy articles as semantic code blocks', () => {
    expect(article('/2026/09/01/vampire.html').$('pre code')).not.toHaveLength(
      0,
    );
  });

  it('emits modern book-cover sources while retaining every original fallback', async () => {
    const { $ } = article('/2023/01/02/mustread-books-for.html');
    const figures = $('figure.article-figure');
    expect(figures).not.toHaveLength(0);
    expect(
      figures.find('source[type="image/avif"][srcset*="/_astro/"]'),
    ).toHaveLength(figures.length);
    expect(
      figures.find('source[type="image/webp"][srcset*="/_astro/"]'),
    ).toHaveLength(figures.length);
    expect(figures.find('source[sizes]')).toHaveLength(figures.length * 2);
    expect(
      figures.find('img[src^="/images/"][width][height][alt]'),
    ).toHaveLength(figures.length);

    for (const source of figures.find('source[srcset]').toArray()) {
      const srcset = $(source).attr('srcset') ?? '';
      for (const candidate of srcset.split(',')) {
        const url = candidate.trim().split(/\s+/)[0];
        expect(url, 'responsive image URL').toMatch(/^\/_astro\//);
        expect(await exists(`dist/${url.slice(1)}`), url).toBe(true);
      }
    }
    for (const image of figures.find('img[src^="/images/"]').toArray()) {
      const src = $(image).attr('src') ?? '';
      expect(await exists(`dist/${src.slice(1)}`), src).toBe(true);
    }
  });

  it('reserves comments after the article and waits to request Utterances', () => {
    for (const legacyPage of legacyPages) {
      const pathname = new URL(legacyPage.url).pathname;
      const { $, html } = article(pathname);
      const comments = $('[data-comments]');
      expect(comments, pathname).toHaveLength(1);
      expect(comments.attr('data-repo')).toBe('glisom/grantisom-com-comments');
      expect(comments.attr('data-issue-term')).toBe('pathname');
      expect(comments.attr('data-label')).toBe('Comment');
      expect(comments.attr('data-theme')).toBe('github-light');
      expect($('script[src="https://utteranc.es/client.js"]')).toHaveLength(0);
      expect($('script[data-comments-loader]').text()).toContain(
        'IntersectionObserver',
      );
      expect(html.indexOf('data-comments')).toBeGreaterThan(
        html.indexOf('data-article-prose'),
      );
    }
  });
});

describe('authored article endings', () => {
  it('renders every relationship in the reviewed authored order', () => {
    expect(Object.keys(EXPECTED_RELATIONSHIPS)).toHaveLength(23);

    for (const [pathname, expected] of Object.entries(EXPECTED_RELATIONSHIPS)) {
      const { $ } = article(pathname);
      const records = $('[data-related-record]');
      expect(records.length, pathname).toBeGreaterThanOrEqual(2);
      expect(records.length, pathname).toBeLessThanOrEqual(3);
      expect(
        records
          .map((_, node) => ({
            label: normalizeText(
              $(node).find('[data-relationship-label]').text(),
            ),
            href: $(node).attr('href'),
          }))
          .get(),
        pathname,
      ).toEqual(expected);
    }
  });

  it('keeps chronology separate from authored relationships', () => {
    for (const legacyPage of legacyPages) {
      const pathname = new URL(legacyPage.url).pathname;
      const { $ } = article(pathname);
      expect($('[data-post-navigation] [data-related-record]')).toHaveLength(0);
      expect(
        $('[data-post-navigation] a').length,
        pathname,
      ).toBeLessThanOrEqual(2);
    }
  });
});
