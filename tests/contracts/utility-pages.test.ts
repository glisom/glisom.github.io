import { execFile } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { load, type CheerioAPI } from 'cheerio';
import postcss, { type Root } from 'postcss';
import { beforeAll, describe, expect, it } from 'vitest';
import { extractLegalHtml } from '../../scripts/lib/legal-semantic';
import { NOW_ITEMS } from '../../src/data/now';
import { SOCIAL_LINKS } from '../../src/data/social';

const execFileAsync = promisify(execFile);
const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));
const distRoot = join(repositoryRoot, 'dist');

const OUTPUTS = new Map([
  ['/about/', 'about/index.html'],
  ['/listwithme/support/', 'listwithme/support/index.html'],
  ['/listwithme/privacy/', 'listwithme/privacy/index.html'],
  ['/404.html', '404.html'],
]);

const ABOUT_OPENING =
  'I’m a software engineer in Kansas City, Missouri. I build AI agents at Limelight, run Groundwork AI, and make apps and tools of my own. This is where I share what I’m building and what I’m learning along the way.';
const ABOUT_RIGHT_NOW =
  'Most of my favorite projects start because I want something to exist, so I try making it. Here’s what has my attention right now.';
const ABOUT_BACKGROUND =
  'I taught myself to code at 16 and started a software consultancy while studying at the University of Kansas. At Cerner, I built patient-facing mobile apps and worked with Apple on early HealthKit integrations. I later became Head of Engineering at Illuminate, where our clinical AI helped care teams find missed findings in radiology reports. At RealWork, I built a mobile platform that reached more than 1,000 customers in its first year, then led the engineering team and development of an AI voice agent for home-service businesses. Today, I’m the Founding AI Engineer at Limelight, building agents that can handle real customer workflows reliably.';
const ABOUT_OUTSIDE =
  'Outside of software, I’m a dad and a tennis player with strong opinions about Kansas City barbecue and coffee.';
const ABOUT_ELSEWHERE =
  'Find my code on GitHub, my work history on LinkedIn, and follow me on X (Twitter). Get new posts through RSS or reach me by email.';

let legalFixture: {
  support: ReturnType<typeof extractLegalHtml>;
  privacy: ReturnType<typeof extractLegalHtml>;
};
let pages: Map<string, CheerioAPI>;
let utilityStyles: Root;

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function page(pathname: string): CheerioAPI {
  const document = pages.get(pathname);
  if (!document) throw new Error(`Utility fixture was not loaded: ${pathname}`);
  return document;
}

function normalize(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeMediaQuery(query: string): string {
  return query
    .replace(/\s+/g, '')
    .replace(/\(min-width:(\d+)px\)/g, '(width>=$1px)')
    .replace(/\(max-width:(\d+)px\)/g, '(width<=$1px)');
}

function normalizeSelector(selector: string): string {
  return selector.replace(/\s+/g, ' ').replace(/,\s*/g, ',').trim();
}

function declarations(
  selector: string,
  query?: string,
): Record<string, string> {
  const result: Record<string, string> = {};
  const wanted = query ? normalizeMediaQuery(query) : undefined;

  utilityStyles.walkRules((rule) => {
    const parent = rule.parent;
    const parentQuery =
      parent?.type === 'atrule' && parent.name === 'media'
        ? normalizeMediaQuery(parent.params)
        : undefined;
    if ((wanted ?? undefined) !== parentQuery) return;
    if (
      !rule.selectors.some(
        (candidate) =>
          normalizeSelector(candidate) === normalizeSelector(selector),
      )
    )
      return;
    rule.walkDecls((declaration) => {
      result[declaration.prop] = declaration.value;
    });
  });
  return result;
}

beforeAll(async () => {
  await execFileAsync('npm', ['run', 'build'], {
    cwd: repositoryRoot,
    maxBuffer: 20 * 1024 * 1024,
  });

  legalFixture = JSON.parse(
    await readFile(
      join(repositoryRoot, 'tests/fixtures/listwithme-legal.json'),
      'utf8',
    ),
  );

  pages = new Map();
  for (const [pathname, output] of OUTPUTS) {
    let html = '';
    try {
      html = await readFile(join(distRoot, output), 'utf8');
    } catch {
      // Missing pages become empty documents so RED names the route gap.
    }
    pages.set(pathname, load(html));
  }

  const about = page('/about/');
  const stylesheetPaths = about('link[rel="stylesheet"]')
    .map((_, node) => about(node).attr('href'))
    .get()
    .filter((href): href is string => Boolean(href?.startsWith('/')));
  const styles = await Promise.all(
    stylesheetPaths.map((href) =>
      readFile(join(distRoot, href.slice(1)), 'utf8'),
    ),
  );
  utilityStyles = postcss.parse(styles.join('\n'));
}, 60_000);

describe('quiet utility page family', () => {
  it('emits exactly the four required utility outputs with one H1 and no placeholder links', async () => {
    expect(
      await Promise.all(
        [...OUTPUTS.values()].map((output) => exists(join(distRoot, output))),
      ),
    ).toEqual([true, true, true, true]);
    expect(await exists(join(distRoot, 'about.html'))).toBe(false);
    expect(await exists(join(distRoot, '404/index.html'))).toBe(false);

    for (const pathname of OUTPUTS.keys()) {
      expect(page(pathname)('h1'), `${pathname}: one H1`).toHaveLength(1);
      expect(
        page(pathname)('a[href="#"]'),
        `${pathname}: no placeholders`,
      ).toHaveLength(0);
    }
  });

  it('renders the reviewed About story, real now items, and real social destinations', () => {
    const about = page('/about/');
    expect(about('[data-about-page]')).toHaveLength(1);
    expect(normalize(about('h1').text())).toBe("Hi, I'm Grant.");
    expect(
      about('h2')
        .map((_, heading) => normalize(about(heading).text()))
        .get(),
    ).toEqual([
      'Right now',
      'A little background',
      'Outside the screen',
      'Find me elsewhere',
    ]);
    expect(normalize(about('[data-about-opening]').text())).toBe(ABOUT_OPENING);
    expect(normalize(about('[data-about-right-now]').text())).toBe(
      ABOUT_RIGHT_NOW,
    );
    expect(
      normalize(
        about('[data-about-background] p')
          .map((_, node) => about(node).text())
          .get()
          .join(' '),
      ),
    ).toBe(ABOUT_BACKGROUND);
    expect(normalize(about('[data-about-outside]').text())).toBe(ABOUT_OUTSIDE);
    expect(normalize(about('[data-about-elsewhere]').text())).toBe(
      ABOUT_ELSEWHERE,
    );
    expect(
      about('[data-now-item]')
        .map((_, item) => ({
          eyebrow: normalize(about(item).find('[data-now-eyebrow]').text()),
          title: normalize(about(item).find('[data-now-title]').text()),
        }))
        .get(),
    ).toEqual(NOW_ITEMS.map(({ eyebrow, title }) => ({ eyebrow, title })));
    expect(
      about('[data-about-socials] a')
        .map((_, link) => ({
          label: normalize(about(link).text()),
          href: about(link).attr('href'),
        }))
        .get(),
    ).toEqual(SOCIAL_LINKS.map(({ label, href }) => ({ label, href })));

    const text = normalize(about('[data-about-page]').text());
    expect(text).not.toMatch(
      /RealWork Labs|résumé|services|testimonials|client logos/i,
    );
    expect(text).not.toContain('—');
  });

  it('uses one uncropped decorative belief-rings accent only on About', () => {
    const about = page('/about/');
    const accent = about('[data-about-accent]');
    expect(accent).toHaveLength(1);
    expect(accent.find('picture')).toHaveLength(1);
    expect(
      accent.find('source[type="image/avif"][srcset*="belief-rings"]'),
    ).toHaveLength(1);
    expect(
      accent.find('source[type="image/webp"][srcset*="belief-rings"]'),
    ).toHaveLength(1);
    expect(accent.find('img[alt=""]')).toHaveLength(1);
    expect(accent.find('[data-decorative="true"]')).toHaveLength(1);
    expect(declarations('.about-accent img')['object-fit']).toBe('contain');

    for (const pathname of [
      '/listwithme/support/',
      '/listwithme/privacy/',
      '/404.html',
    ]) {
      expect(page(pathname)('picture, [data-halftone-image]')).toHaveLength(0);
    }
  });

  it('marks About as current in desktop and mobile navigation without making it a collection', () => {
    const about = page('/about/');
    expect(about('.rail-about[aria-current="page"]')).toHaveLength(1);
    expect(about('.rail-about-state').text().trim()).toBe('Current');
    expect(
      about(
        'nav[aria-label="Mobile browse"] a[href="/about/"][aria-current="page"]',
      ),
    ).toHaveLength(1);
    expect(
      about('nav[aria-label="Mobile browse"] a[aria-current="page"]'),
    ).toHaveLength(1);
    expect(
      about('nav[aria-label="Browse"] a[aria-current="page"]'),
    ).toHaveLength(0);
  });

  it.each([
    {
      pathname: '/listwithme/support/',
      fixture: 'support' as const,
      h2: 5,
      h3: 7,
      paragraphs: 13,
      orderedLists: 2,
      unorderedLists: 0,
      links: 2,
    },
    {
      pathname: '/listwithme/privacy/',
      fixture: 'privacy' as const,
      h2: 8,
      h3: 0,
      paragraphs: 11,
      orderedLists: 0,
      unorderedLists: 2,
      links: 1,
    },
  ])(
    'preserves the frozen legal semantics and direct block order for $pathname',
    (fixture) => {
      const document = page(fixture.pathname);
      const title = document('[data-legal-title]');
      const content = document('[data-legal-content]');
      const actions = document('[data-utility-actions]');

      expect(extractLegalHtml(document.html())).toEqual(
        legalFixture[fixture.fixture],
      );
      expect(title.next().is('section[data-legal-content]')).toBe(true);
      expect(content.next().is('nav[data-utility-actions]')).toBe(true);
      expect(content.children()).toHaveLength(
        legalFixture[fixture.fixture].blocks.length,
      );
      expect(content.children('h2')).toHaveLength(fixture.h2);
      expect(content.children('h3')).toHaveLength(fixture.h3);
      expect(content.children('p')).toHaveLength(fixture.paragraphs);
      expect(content.children('ol')).toHaveLength(fixture.orderedLists);
      expect(content.children('ul')).toHaveLength(fixture.unorderedLists);
      expect(content.find('a[href]')).toHaveLength(fixture.links);

      const h2Ids = content
        .children('h2[id]')
        .map((_, heading) => document(heading).attr('id'))
        .get();
      const allHeadingIds = content
        .children('h2[id], h3[id]')
        .map((_, heading) => document(heading).attr('id'))
        .get();
      const tocTargets = actions
        .find('[data-utility-toc] a[href^="#"]')
        .map((_, link) => document(link).attr('href')?.slice(1))
        .get();

      expect(new Set(allHeadingIds).size).toBe(allHeadingIds.length);
      expect(tocTargets).toEqual(h2Ids);
      for (const target of tocTargets) {
        expect(
          content.children(`#${target}`),
          `${target}: anchor resolves`,
        ).toHaveLength(1);
      }
      expect(
        actions.find('a[href="mailto:grant.isom@gmail.com"]'),
      ).toHaveLength(1);
      expect(actions.find('a[href="/listwithme/"]')).toHaveLength(1);
    },
  );

  it('does not duplicate Privacy’s frozen last-updated paragraph', () => {
    const privacy = page('/listwithme/privacy/');
    const matches = privacy('[data-legal-content] p').filter((_, paragraph) =>
      normalize(privacy(paragraph).text()).startsWith('Last updated:'),
    );
    expect(matches).toHaveLength(1);
    expect(normalize(matches.text())).toBe('Last updated: February 24, 2026');
  });

  it('keeps prose readable and touch targets and anchored headings safe on phone', () => {
    expect(declarations('.utility-prose')['max-width']).toBe('70ch');
    expect(declarations('.about-copy')['max-width']).toBe('70ch');

    for (const selector of [
      '.utility-actions a',
      '.utility-toc a',
      '.about-links a',
      '.not-found-actions a',
    ]) {
      expect(
        declarations(selector, '(max-width: 820px)')['min-height'],
        `${selector}: phone target height`,
      ).toBe('44px');
    }
    expect(
      declarations('.legal-content :where(h2, h3)', '(max-width: 820px)')[
        'scroll-margin-top'
      ],
    ).toContain('var(--mobile-header)');
  });

  it('renders a concise noindex 404 with exactly four useful destinations', () => {
    const notFound = page('/404.html');
    expect(notFound('[data-site-404]')).toHaveLength(1);
    expect(normalize(notFound('h1').text())).toBe("That page isn't here.");
    expect(normalize(notFound('[data-404-copy]').text())).toBe(
      'I may have moved it while tinkering. The useful stuff is still close by.',
    );
    expect(
      notFound('[data-404-actions] a')
        .map((_, link) => notFound(link).attr('href'))
        .get(),
    ).toEqual(['/', '/blog/', '/projects/', '/app-library/']);
    expect(
      notFound('meta[name="robots"][content="noindex, nofollow"]'),
    ).toHaveLength(1);
    expect(notFound('input, [role="search"], form')).toHaveLength(0);
  });
});
