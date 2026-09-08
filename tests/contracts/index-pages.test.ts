import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { load, type CheerioAPI } from 'cheerio';
import { beforeAll, describe, expect, it } from 'vitest';
import postcss, { type Root } from 'postcss';

const execFileAsync = promisify(execFile);
const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));
const paths = [
  '/blog/',
  '/app-library/',
  '/projects/',
  '/skill-library/',
  '/skills/',
] as const;

const indexes = new Map<string, CheerioAPI>();
let indexStyles: Root;

const EXPECTED_BLOG_TITLES = [
  'Vampire: Keep Your MacBook Awake',
  'skill-thief: Steal the Ideas, Not the Install',
  'Bringing ListWithMe Back to Life',
  'HealthQL Now Supports React Native',
  'HealthQL: SQL for Apple HealthKit',
  'Accessibility Testing in Maestro',
  'Using Act to Run Github Actions Locally',
  'Expo App Config Setup for Multiple Environments',
  'Notion 101 for Software Engineers',
  '9 Must-Read Books for Software Engineers in 2023',
  '2 Years at Illuminate, A Retrospective',
  'Next Chapter',
  'Using Safari to Inspect Web Views in iOS Simulators & Devices',
  'My Top 17 Apps for Mobile Developers in 2020',
  '2019 Playlists',
  'WWDC 2019, In Review',
  'WWDC Day 4',
  'WWDC Day 3',
  'WWDC Day 2',
  'WWDC Day 1',
  'ListWithMe, Creating an iMessage-only Application',
  'Playlists for the Seasons',
  'Reading List for 2018',
] as const;

function normalizedText($: CheerioAPI, selector: string): string {
  return $(selector).text().replace(/\s+/g, ' ').trim();
}

function mediaDeclarations(
  query: string,
  selector: string,
): Record<string, string> {
  const declarations: Record<string, string> = {};
  const normalize = (value: string) =>
    value
      .replace(/\s+/g, '')
      .replace(/\(min-width:(\d+)px\)/g, '(width>=$1px)')
      .replace(/\(max-width:(\d+)px\)/g, '(width<=$1px)');

  indexStyles.walkAtRules('media', (rule) => {
    if (normalize(rule.params) !== normalize(query)) return;
    postcss
      .parse((rule.nodes ?? []).map((node) => node.toString()).join('\n'))
      .walkRules((nestedRule) => {
        if (!nestedRule.selectors.includes(selector)) return;
        nestedRule.walkDecls((declaration) => {
          declarations[declaration.prop] = declaration.value;
        });
      });
  });
  return declarations;
}

function baseDeclarations(selector: string): Record<string, string> {
  const declarations: Record<string, string> = {};
  indexStyles.walkRules((rule) => {
    if (rule.parent?.type === 'atrule' || !rule.selectors.includes(selector))
      return;
    rule.walkDecls((declaration) => {
      declarations[declaration.prop] = declaration.value;
    });
  });
  return declarations;
}

function index(pathname: (typeof paths)[number]): CheerioAPI {
  const document = indexes.get(pathname);
  if (!document) throw new Error(`Index fixture was not loaded: ${pathname}`);
  return document;
}

beforeAll(async () => {
  await execFileAsync('npm', ['run', 'build'], { cwd: repositoryRoot });

  for (const pathname of paths) {
    const outputPath = join(
      repositoryRoot,
      'dist',
      pathname.slice(1),
      'index.html',
    );
    let html = '';
    try {
      html = await readFile(outputPath, 'utf8');
    } catch {
      // Missing routes load as empty documents so RED reports the contract gap.
    }
    indexes.set(pathname, load(html));
  }

  const blogDocument = index('/blog/');
  const stylesheetPaths = blogDocument('link[rel="stylesheet"]')
    .map((_, node) => blogDocument(node).attr('href'))
    .get()
    .filter((href): href is string => Boolean(href?.startsWith('/')));
  const styles = await Promise.all(
    stylesheetPaths.map((href) =>
      readFile(join(repositoryRoot, 'dist', href.slice(1)), 'utf8'),
    ),
  );
  indexStyles = postcss.parse(styles.join('\n'));
}, 60_000);

describe('built collection indexes', () => {
  it('renders every launch collection with its complete record count', () => {
    expect(index('/blog/')('h1').text()).toBe("Things I've written.");
    expect(
      index('/blog/')('[data-record-count]').attr('data-record-count'),
    ).toBe('23');
    expect(index('/blog/')('[data-year-group="2026"]')).toHaveLength(1);
    expect(index('/blog/')('.post-row')).toHaveLength(23);
    expect(index('/app-library/')('[data-tool-record]')).toHaveLength(11);
    expect(index('/projects/')('[data-app-record]')).toHaveLength(5);
    expect(index('/skill-library/')('[data-skill-record]')).toHaveLength(6);
    expect(index('/skills/')('[data-authored-skill]')).toHaveLength(7);
  });

  it('launches without search or filter controls', () => {
    for (const pathname of paths) {
      expect(
        index(pathname)('input[type="search"], [data-filter]'),
      ).toHaveLength(0);
    }
  });

  it('renders the complete newest-first blog ledger and intentionally repeats the feature', () => {
    const $ = index('/blog/');
    expect(
      $('.post-row h3')
        .map((_, node) => $(node).text().trim())
        .get(),
    ).toEqual(EXPECTED_BLOG_TITLES);
    expect(
      $('[data-year-group]')
        .map((_, node) => ({
          year: $(node).attr('data-year-group'),
          count: $(node).find('.post-row').length,
        }))
        .get(),
    ).toEqual([
      { year: '2026', count: 5 },
      { year: '2023', count: 5 },
      { year: '2022', count: 1 },
      { year: '2020', count: 4 },
      { year: '2019', count: 6 },
      { year: '2018', count: 2 },
    ]);
    expect($('.featured-story h2').text()).toBe(
      'Vampire: Keep Your MacBook Awake',
    );
    expect(
      $('.post-row h3').filter((_, node) =>
        $(node).text().includes('Bringing ListWithMe Back to Life'),
      ),
    ).toHaveLength(1);
    expect($('.post-row .post-kind')).toHaveLength(23);
    expect(
      $('.post-row .post-kind')
        .toArray()
        .every((node) =>
          /^(Post|Build log) · \d+ min$/.test($(node).text().trim()),
        ),
    ).toBe(true);
  });

  it('programmatically labels each blog year group with its visible year and count', () => {
    const $ = index('/blog/');
    expect(
      $('[data-year-group]')
        .map((_, node) => {
          const labelledBy = $(node).attr('aria-labelledby');
          return {
            labelledBy,
            label: labelledBy ? $(`#${labelledBy}`).text().trim() : '',
          };
        })
        .get(),
    ).toEqual([
      { labelledBy: 'posts-2026', label: '2026 / 05' },
      { labelledBy: 'posts-2023', label: '2023 / 05' },
      { labelledBy: 'posts-2022', label: '2022 / 01' },
      { labelledBy: 'posts-2020', label: '2020 / 04' },
      { labelledBy: 'posts-2019', label: '2019 / 06' },
      { labelledBy: 'posts-2018', label: '2018 / 02' },
    ]);
  });

  it('renders the selected feature record authored artwork', () => {
    const $ = index('/blog/');
    expect($('.featured-art img').attr('src')).toContain('vampire-laptop');
    expect($('.featured-art img').attr('alt')).toBe(
      'A closed laptop glowing blue above a circular return arrow and a small bat silhouette.',
    );
  });

  it('groups the app library by its authored categories and uses dossier destinations', () => {
    const $ = index('/app-library/');
    expect($('.section-heading h2').text()).toBe('Apps in my toolkit');
    expect(
      $('[data-tool-group]')
        .map((_, node) => $(node).attr('data-tool-group'))
        .get(),
    ).toEqual([
      'Notes and reading',
      'Coding and AI',
      'Agents and automation',
      'Email',
      'Notes and documents',
      'Project planning',
      'Team communication',
      'Music',
      'Voice and dictation',
    ]);
    expect(
      $('[data-tool-record] h3')
        .map((_, node) => $(node).text().trim())
        .get(),
    ).toEqual([
      'Obsidian',
      'Codex',
      'Claude',
      'Hermes Agent',
      'Superhuman',
      'Notion',
      'Linear',
      'Slack',
      'Poolsuite FM',
      'Spotify',
      'Wispr Flow',
    ]);
    expect(
      $('[data-tool-record]')
        .map((_, node) => $(node).attr('href'))
        .get(),
    ).toEqual([
      'https://obsidian.md',
      'https://openai.com/codex/',
      'https://claude.ai/',
      'https://github.com/NousResearch/hermes-agent',
      'https://superhuman.com',
      'https://www.notion.com/product',
      'https://linear.app/',
      'https://slack.com/',
      'https://poolsuite.net/',
      'https://open.spotify.com/',
      'https://wisprflow.ai/',
    ]);
    expect($('[data-tool-record] [data-record-reason]')).toHaveLength(11);
    expect(
      $('[data-tool-record] .tool-number')
        .map((_, node) => $(node).text().trim())
        .get(),
    ).toEqual(
      Array.from({ length: 11 }, (_, i) => String(i + 1).padStart(2, '0')),
    );
    expect($('[data-empty-field]')).toHaveLength(0);
  });

  it('places current apps before the archived record with real art and one destination each', () => {
    const $ = index('/projects/');
    expect(
      $('[data-app-record] h2')
        .map((_, node) => $(node).text().trim())
        .get(),
    ).toEqual([
      'Hermes iOS',
      'ListWithMe',
      'HealthQL',
      'Vampire',
      'Drift Dreams',
    ]);
    expect(
      $('[data-app-record]')
        .map((_, node) => $(node).attr('data-app-state'))
        .get(),
    ).toEqual(['current', 'current', 'current', 'current', 'archived']);
    expect(
      $('[data-app-record] a[data-record-action]')
        .map((_, node) => $(node).attr('href'))
        .get(),
    ).toEqual([
      'https://github.com/glisom/hermes-ios',
      'https://apps.apple.com/us/app/listwithme/id1224284271',
      'https://github.com/glisom/HealthQL',
      'https://github.com/glisom/vampire',
    ]);
    expect($('[data-app-record] [data-halftone-image]')).toHaveLength(3);
    expect(
      $('[data-app-record][data-app-state="archived"] [data-halftone-image]'),
    ).toHaveLength(0);
    expect(
      $('[data-app-record][data-app-state="archived"] [data-action-state]')
        .text()
        .trim(),
    ).toBe('No public download is linked here.');
    expect($('[data-app-record] [data-record-summary]')).toHaveLength(5);
    expect($('[data-app-record] [data-record-platform]')).toHaveLength(5);
  });

  it('credits the six community skills and links directly to their sources', () => {
    const $ = index('/skill-library/');
    expect(
      $('[data-skill-record] h3')
        .map((_, node) => $(node).text().trim())
        .get(),
    ).toEqual([
      'Impeccable',
      'Superpowers',
      'Compound Engineering',
      'Obsidian Markdown',
      'Obsidian Bases',
      'JSON Canvas',
    ]);
    expect(
      $('[data-source-credit]')
        .map((_, node) => $(node).text().replace(/\s+/g, ' ').trim())
        .get(),
    ).toEqual([
      'Paul Bakaus · Impeccable',
      'Jesse Vincent · Superpowers',
      'Every · Compound Engineering plugin',
      'kepano · Obsidian Skills',
      'kepano · Obsidian Skills',
      'kepano · Obsidian Skills',
    ]);
    expect(
      $('[data-skill-record]')
        .map((_, node) => $(node).attr('href'))
        .get(),
    ).toEqual([
      'https://github.com/pbakaus/impeccable',
      'https://github.com/obra/superpowers',
      'https://github.com/EveryInc/compound-engineering-plugin',
      'https://github.com/kepano/obsidian-skills/tree/main/skills/obsidian-markdown',
      'https://github.com/kepano/obsidian-skills/tree/main/skills/obsidian-bases',
      'https://github.com/kepano/obsidian-skills/tree/main/skills/json-canvas',
    ]);
    expect(
      $('[data-usage-value]')
        .map((_, node) => $(node).text().trim())
        .get(),
    ).toEqual([
      'An interface needs a design review or a polish pass.',
      'A coding task needs a plan, careful debugging, or verification.',
      'A feature needs to move from an idea through implementation and review.',
      'A note needs Obsidian-specific formatting or links.',
      'Notes need a table or card view with filters and calculated fields.',
      'An idea is easier to work through as a connected visual canvas.',
    ]);
    expect($('[data-capability]')).toHaveLength(6);
    expect(normalizedText($, '[data-skill-record]')).not.toMatch(
      /OpenAI|Anthropic/,
    );
  });

  it('marks every authored skill in text and exposes only its real record action', () => {
    const $ = index('/skills/');
    expect(
      $('[data-authored-skill] h2')
        .map((_, node) => $(node).text().trim())
        .get(),
    ).toEqual([
      'write-like-grant',
      'goodreads-export',
      'skill-thief',
      'comment-detective',
      'comment-conductor',
      'change-review-digest',
      'ux-deep-dive',
    ]);
    expect($('[data-authored-skill] [data-ownership-stamp]')).toHaveLength(7);
    expect(
      $('[data-authored-skill] [data-ownership-stamp]')
        .map((_, node) => $(node).text().trim())
        .get(),
    ).toEqual([
      'Made by Grant',
      'Made by Grant',
      'Made by Grant',
      'Made by Grant',
      'Made by Grant',
      'Made by Grant',
      'Made by Grant',
    ]);
    expect($('[data-authored-skill] [data-record-status]')).toHaveLength(7);
    expect($('[data-authored-skill] [data-supported-tools]')).toHaveLength(7);
    expect(
      $('[data-authored-skill] a[data-record-action]')
        .map((_, node) => $(node).attr('href'))
        .get(),
    ).toEqual([
      'https://github.com/glisom/skill-thief',
      'https://github.com/limelighthq/vercel-comment-skills/tree/main/skills/comment-detective',
      'https://github.com/limelighthq/vercel-comment-skills/tree/main/skills/comment-conductor',
      'https://github.com/limelighthq/vercel-comment-skills/tree/main/skills/change-review-digest',
      'https://github.com/glisom/ux-deep-dive',
    ]);
    expect(normalizedText($, '[data-authored-skill]')).not.toMatch(/Install/i);
  });

  it('uses each approved masthead and active collection rail context', () => {
    const cases = [
      [
        '/blog/',
        "Things I've written.",
        '/blog/',
        '23 records',
        'Blog / 23 posts',
        '',
        'Last updated September 1, 2026',
      ],
      [
        '/app-library/',
        'Apps in my toolkit.',
        '/app-library/',
        '11 records',
        'App Library / 11 tools',
        'Used by Grant',
        'Last updated September 7, 2026',
      ],
      [
        '/projects/',
        'Apps and libraries I’ve built.',
        '/projects/',
        '5 records',
        'My Apps / 5 apps',
        'Made by Grant',
        'Last updated September 7, 2026',
      ],
      [
        '/skill-library/',
        'AI skills from other people.',
        '/skill-library/',
        '6 records',
        'Skill Library / 6 skills',
        'Used by Grant',
        'Last updated September 7, 2026',
      ],
      [
        '/skills/',
        'AI skills I’ve made.',
        '/skills/',
        '7 records',
        'My Skills / 7 skills',
        'Made by Grant',
        'Last updated September 7, 2026',
      ],
    ] as const;

    for (const [
      pathname,
      title,
      activeHref,
      context,
      countPhrase,
      ownership,
      updated,
    ] of cases) {
      const $ = index(pathname);
      expect($('h1').text()).toBe(title);
      expect(normalizedText($, '[data-collection-label]')).toBe(countPhrase);
      expect(normalizedText($, '[data-masthead-ownership]')).toBe(ownership);
      expect(
        $(`.rail-nav a[href="${activeHref}"][aria-current="page"]`),
      ).toHaveLength(1);
      expect(normalizedText($, '.rail-context-title')).toBe(context);
      expect(normalizedText($, '.rail-context-meta')).toBe(updated);
      expect($('.collection-mark [data-halftone-image]')).toHaveLength(1);
      expect($('script')).toHaveLength(0);
      expect(normalizedText($, 'body')).not.toContain('Feels right');
      expect(normalizedText($, 'body')).not.toContain('Needs changes');
    }
  });

  it('switches masthead composition at 1024px while preserving shell breakpoints', () => {
    expect(
      baseDeclarations('.collection-masthead')['grid-template-columns'],
    ).toBe('1fr');
    expect(
      mediaDeclarations('(min-width: 1024px)', '.collection-masthead')[
        'grid-template-columns'
      ],
    ).toBe('minmax(0,7fr) minmax(330px,4fr)');
    expect(baseDeclarations('.collection-mark')['margin']).toBe('1em 40px');
    expect(
      mediaDeclarations(
        '(min-width: 821px) and (max-width: 1023px)',
        '.collection-masthead',
      )['grid-template-columns'],
    ).toBe('1fr');
    expect(
      mediaDeclarations('(max-width: 820px)', '.collection-masthead')[
        'padding'
      ],
    ).toBe('43px 18px 34px');
    expect(
      mediaDeclarations('(max-width: 820px)', '.collection-mark')['display'],
    ).toBe('none');
    expect(baseDeclarations('.masthead-ownership')['margin']).toBe('0');
    expect(
      mediaDeclarations('(min-width: 1024px)', '.tool-groups')[
        'background-color'
      ],
    ).toBe('#0000');
    expect(baseDeclarations('.app-card.featured .app-copy')['order']).toBe(
      '-1',
    );
    expect(baseDeclarations('.app-card.text-only')['grid-column']).toBe('1/-1');
  });

  it('keeps skill usage facts readable through every responsive seam', () => {
    expect(baseDeclarations('.skill-strip')['grid-template-columns']).toBe(
      'minmax(0,.9fr) minmax(0,1.5fr) minmax(0,1fr) auto',
    );
    expect(baseDeclarations('.skill-strip>*')['min-width']).toBe('0');
    expect(baseDeclarations('.skill-strip .record-meta')['display']).toBe(
      'flex',
    );
    expect(
      mediaDeclarations(
        '(min-width: 821px) and (max-width: 1023px)',
        '.skill-strip',
      )['grid-template-columns'],
    ).toBe('minmax(0,1fr) auto');
    expect(
      mediaDeclarations(
        '(min-width: 821px) and (max-width: 1023px)',
        '.skill-strip .record-meta',
      )['grid-column'],
    ).toBe('1/-1');
    expect(
      mediaDeclarations('(max-width: 820px)', '.skill-strip .record-meta')[
        'grid-column'
      ],
    ).toBe('1/-1');
  });
});
