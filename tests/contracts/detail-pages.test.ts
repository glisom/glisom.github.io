import { execFile } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { load, type CheerioAPI } from 'cheerio';
import postcss, { type Root } from 'postcss';
import sharp from 'sharp';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadSourceGraph } from '../../scripts/lib/source-graph';
import { resolveLocalImage } from '../../src/lib/media';
import type {
  ActionLink,
  ContentGraph,
  NonBlogRecord,
  ResolvedRelationship,
} from '../../src/types/content';

const execFileAsync = promisify(execFile);
const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));
const distRoot = join(repositoryRoot, 'dist');

const EXPECTED_DETAIL_PATHS = [
  '/app-library/obsidian/',
  '/app-library/codex/',
  '/app-library/hermes-agent/',
  '/app-library/superhuman/',
  '/projects/hermes-ios/',
  '/listwithme/',
  '/projects/healthql/',
  '/projects/drift-dreams/',
  '/skill-library/deep-research/',
  '/skill-library/browser-control/',
  '/skill-library/frontend-design/',
  '/skill-library/documents/',
  '/skill-library/pdf/',
  '/skills/write-like-grant/',
  '/skills/goodreads-export/',
  '/skills/hatch-pet/',
] as const;

const DETAIL_VARIANT_FIXTURES = [
  {
    path: '/app-library/obsidian/',
    expectedKeys: [
      'workflow',
      'details-i-love',
      'friction-and-limits',
      'who-it-suits',
    ],
  },
  {
    path: '/listwithme/',
    expectedKeys: [
      'why-it-exists',
      'what-it-does',
      'how-it-was-built',
      'current-state',
    ],
  },
  {
    path: '/skill-library/deep-research/',
    expectedKeys: ['trigger', 'inputs-and-outputs', 'guardrails'],
  },
  {
    path: '/skills/write-like-grant/',
    expectedKeys: ['when-to-use', 'how-it-works', 'design-decisions'],
  },
] as const;

const LISTWITHME_SCREENSHOTS = [
  {
    src: 'projects/listwithme/screenshots/01-new-list.png',
    label: 'Create a list',
    order: 1,
  },
  {
    src: 'projects/listwithme/screenshots/02-your-lists.png',
    label: 'Your lists',
    order: 2,
  },
  {
    src: 'projects/listwithme/screenshots/03-groceries.png',
    label: 'Shared groceries',
    order: 3,
  },
  {
    src: 'projects/listwithme/screenshots/04-activity.png',
    label: 'Recent activity',
    order: 4,
  },
] as const;

const detailComponents = import.meta.glob<{ default: unknown }>(
  '../../src/components/detail/*.astro',
  { eager: true },
);

let graph: ContentGraph;
let detailPages: Map<string, CheerioAPI>;
let detailStyles: Root;

function outputPath(pathname: string): string {
  return join(distRoot, pathname.slice(1), 'index.html');
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function detail(pathname: (typeof EXPECTED_DETAIL_PATHS)[number]): CheerioAPI {
  const document = detailPages.get(pathname);
  if (!document) throw new Error(`Detail fixture was not loaded: ${pathname}`);
  return document;
}

function recordForPath(pathname: string): NonBlogRecord {
  const record = [
    ...graph['app-library'],
    ...graph.projects,
    ...graph['skill-library'],
    ...graph.skills,
  ].find((candidate) => candidate.data.canonicalPath === pathname);
  if (!record) throw new Error(`Source record was not loaded: ${pathname}`);
  return record;
}

function expectedPrimaryCount(record: NonBlogRecord): number {
  return record.data.links.filter(
    (link) => link.kind === 'primary' || link.kind === 'install',
  ).length;
}

function actionLinks(record: NonBlogRecord): readonly ActionLink[] {
  return record.data.links.filter((link) =>
    ['primary', 'install', 'secondary', 'source'].includes(link.kind),
  );
}

function relationshipsFor(record: NonBlogRecord): ResolvedRelationship[] {
  return record.data.relationships.map((relationship) => {
    const target = graph[relationship.collection].find(
      (candidate) => candidate.id === relationship.id,
    );
    if (!target)
      throw new Error(`Missing test relationship ${relationship.id}`);
    return {
      ...relationship,
      title: target.data.title,
      summary: target.data.summary,
      canonicalPath: target.data.canonicalPath,
    };
  });
}

function normalizeMediaQuery(query: string): string {
  return query
    .replace(/\s+/g, '')
    .replace(/\(min-width:(\d+)px\)/g, '(width>=$1px)')
    .replace(/\(max-width:(\d+)px\)/g, '(width<=$1px)');
}

function declarations(
  selector: string,
  query?: string,
): Record<string, string> {
  const result: Record<string, string> = {};
  const wanted = query ? normalizeMediaQuery(query) : undefined;

  detailStyles.walkRules((rule) => {
    const parent = rule.parent;
    const parentQuery =
      parent?.type === 'atrule' && parent.name === 'media'
        ? normalizeMediaQuery(parent.params)
        : undefined;
    if ((wanted ?? undefined) !== parentQuery) return;
    if (!rule.selectors.includes(selector)) return;
    rule.walkDecls((declaration) => {
      result[declaration.prop] = declaration.value;
    });
  });
  return result;
}

function relativeLuminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    ?.map((channel) => Number.parseInt(channel, 16) / 255);
  if (!channels || channels.length !== 3)
    throw new Error(`Expected a six-digit hex color, received ${hex}.`);
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string): number {
  const values = [
    relativeLuminance(foreground),
    relativeLuminance(background),
  ].toSorted((left, right) => right - left);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

beforeAll(async () => {
  graph = await loadSourceGraph();
  await execFileAsync('npm', ['run', 'build'], {
    cwd: repositoryRoot,
    maxBuffer: 20 * 1024 * 1024,
  });

  detailPages = new Map();
  for (const pathname of EXPECTED_DETAIL_PATHS) {
    let html = '';
    try {
      html = await readFile(outputPath(pathname), 'utf8');
    } catch {
      // Missing routes become empty documents so RED names the route gap.
    }
    detailPages.set(pathname, load(html));
  }

  const listWithMe = detail('/listwithme/');
  const stylesheetPaths = listWithMe('link[rel="stylesheet"]')
    .map((_, node) => listWithMe(node).attr('href'))
    .get()
    .filter((href): href is string => Boolean(href?.startsWith('/')));
  const styles = await Promise.all(
    stylesheetPaths.map((href) =>
      readFile(join(distRoot, href.slice(1)), 'utf8'),
    ),
  );
  detailStyles = postcss.parse(styles.join('\n'));
}, 60_000);

describe('detail route family', () => {
  it('emits the exact sixteen launch dossiers and keeps the ListWithMe exception singular', async () => {
    for (const pathname of EXPECTED_DETAIL_PATHS) {
      expect(await exists(outputPath(pathname)), pathname).toBe(true);
    }
    expect(await exists(outputPath('/projects/listwithme/'))).toBe(false);
    expect(detailPages).toHaveLength(16);
  });

  it('computes one-based record numbers and non-wrapping next records within each collection', () => {
    const expected = [
      ['/app-library/obsidian/', '1', '/app-library/codex/'],
      ['/app-library/codex/', '2', '/app-library/hermes-agent/'],
      ['/app-library/hermes-agent/', '3', '/app-library/superhuman/'],
      ['/app-library/superhuman/', '4', undefined],
      ['/projects/hermes-ios/', '1', '/listwithme/'],
      ['/listwithme/', '2', '/projects/healthql/'],
      ['/projects/healthql/', '3', '/projects/drift-dreams/'],
      ['/projects/drift-dreams/', '4', undefined],
      ['/skill-library/deep-research/', '1', '/skill-library/browser-control/'],
      [
        '/skill-library/browser-control/',
        '2',
        '/skill-library/frontend-design/',
      ],
      ['/skill-library/frontend-design/', '3', '/skill-library/documents/'],
      ['/skill-library/documents/', '4', '/skill-library/pdf/'],
      ['/skill-library/pdf/', '5', undefined],
      ['/skills/write-like-grant/', '1', '/skills/goodreads-export/'],
      ['/skills/goodreads-export/', '2', '/skills/hatch-pet/'],
      ['/skills/hatch-pet/', '3', undefined],
    ] as const;

    for (const [pathname, number, nextPath] of expected) {
      const $ = detail(pathname);
      expect(
        $('[data-record-number]').attr('data-record-number'),
        pathname,
      ).toBe(number);
      expect($('[data-next-record]').attr('href'), pathname).toBe(nextPath);
    }
  });
});

describe('shared dossier anatomy', () => {
  it('renders source-owned title, summary, ownership, facts, notes, and actions without placeholders', () => {
    for (const pathname of EXPECTED_DETAIL_PATHS) {
      const record = recordForPath(pathname);
      const $ = detail(pathname);
      const primaryCount = expectedPrimaryCount(record);
      const quietCount = actionLinks(record).length - primaryCount;

      expect($('h1'), `${pathname}: one h1`).toHaveLength(1);
      expect($('h1').text().trim(), `${pathname}: title`).toBe(
        record.data.title,
      );
      expect(
        $('[data-record-summary]').text().trim(),
        `${pathname}: summary`,
      ).toBe(record.data.summary);
      expect($('[data-ownership]').text(), `${pathname}: ownership`).toContain(
        record.data.ownership === 'made' ? 'Made by Grant' : 'Used by Grant',
      );
      expect(
        $('[data-action-role="primary"]'),
        `${pathname}: primary`,
      ).toHaveLength(primaryCount);
      expect(
        $('[data-action-role="quiet"]'),
        `${pathname}: quiet`,
      ).toHaveLength(quietCount);
      expect($('a[href="#"]'), `${pathname}: placeholder`).toHaveLength(0);
      expect(
        $('.fact-ledger > *').length,
        `${pathname}: sparse fact minimum`,
      ).toBeGreaterThanOrEqual(2);
      expect(
        $('.fact-ledger > *').length,
        `${pathname}: fact maximum`,
      ).toBeLessThanOrEqual(6);
      expect(
        $('.fact-ledger > *')
          .map((_, node) => ({
            label: $(node).find('dt').text().trim(),
            value: $(node).find('dd').text().trim(),
          }))
          .get(),
        `${pathname}: authored facts`,
      ).toEqual(record.data.facts);
      expect(
        $('[data-field-note-key]')
          .map((_, node) => $(node).attr('data-field-note-key'))
          .get(),
        `${pathname}: authored field notes`,
      ).toEqual(record.data.fieldNotes.map((note) => note.key));
      expect(
        $('[data-connected-record]').length,
        `${pathname}: relationships`,
      ).toBe(record.data.relationships.length);
      expect($('[data-connected-record]').length).toBeLessThanOrEqual(3);
      expect($('[data-back-to-collection]').attr('href')).toBe(
        record.collection === 'projects'
          ? '/projects/'
          : `/${record.collection}/`,
      );
      expect(
        $('[data-preview-switcher], [data-design-companion]'),
      ).toHaveLength(0);
    }
  });

  it('keeps exact authored key sequences for each detail variant', () => {
    for (const fixture of DETAIL_VARIANT_FIXTURES) {
      const $ = detail(fixture.path);
      expect(
        $('[data-field-note-key]')
          .map((_, node) => $(node).attr('data-field-note-key'))
          .get(),
      ).toEqual(fixture.expectedKeys);
    }
  });

  it('renders action-state records honestly and never exposes a private-skill install action', () => {
    expect(
      detail('/projects/drift-dreams/')('[data-action-state]').text().trim(),
    ).toBe('The original public site is currently offline.');
    expect(
      detail('/skills/write-like-grant/')('a[data-action="install"]'),
    ).toHaveLength(0);
    expect(
      detail('/skills/write-like-grant/')('[data-action-state]').text(),
    ).toContain('Kept in my private toolkit.');
  });

  it('resolves each named relationship to the authored destination and source summary', () => {
    for (const pathname of EXPECTED_DETAIL_PATHS) {
      const record = recordForPath(pathname);
      const expected = relationshipsFor(record);
      const $ = detail(pathname);
      expect(
        $('[data-connected-record]')
          .map((_, node) => ({
            label: $(node).find('[data-relationship-label]').text().trim(),
            title: $(node).find('h3').text().trim(),
            summary: $(node).find('p').text().trim(),
            canonicalPath: $(node).attr('href'),
          }))
          .get(),
        pathname,
      ).toEqual(
        expected.map(({ label, title, summary, canonicalPath }) => ({
          label,
          title,
          summary,
          canonicalPath,
        })),
      );
    }
  });

  it('sizes the connected-record grid to its real records without an empty card slot', () => {
    const $ = detail('/listwithme/');
    expect($('.connected-grid').attr('style')).toContain(
      '--connected-count: 2',
    );
    expect(
      declarations('.connected-grid')['grid-template-columns']?.replace(
        /\s+/g,
        '',
      ),
    ).toBe('repeat(var(--connected-count),minmax(0,1fr))');
  });

  it('sizes ending navigation to its real cards without an empty final-record panel', () => {
    for (const pathname of [
      '/app-library/superhuman/',
      '/projects/drift-dreams/',
      '/skill-library/pdf/',
      '/skills/hatch-pet/',
    ] as const) {
      expect(detail(pathname)('.record-navigation').attr('style')).toContain(
        '--record-navigation-count: 1',
      );
    }
    expect(
      declarations('.record-navigation')['grid-template-columns']?.replace(
        /\s+/g,
        '',
      ),
    ).toBe('repeat(var(--record-navigation-count),minmax(0,1fr))');
  });
});

describe('ListWithMe dossier evidence', () => {
  it('keeps product actions separate from labeled support and privacy navigation', () => {
    const $ = detail('/listwithme/');
    expect(
      $('a[href="https://apps.apple.com/us/app/listwithme/id1224284271"]'),
    ).toHaveLength(1);
    expect($('[data-action-role="primary"]')).toHaveLength(1);
    expect($('[data-action-role="quiet"]')).toHaveLength(1);
    expect($('.fact-ledger > *').length).toBeGreaterThanOrEqual(4);
    expect($('[data-utility-navigation]')).toHaveLength(1);
    expect(
      $('[data-utility-navigation] a')
        .map((_, node) => ({
          label: $(node).text().trim(),
          href: $(node).attr('href'),
        }))
        .get(),
    ).toEqual([
      { label: 'Support', href: '/listwithme/support/' },
      { label: 'Privacy', href: '/listwithme/privacy/' },
    ]);
  });

  it('loads the exact ordered four-screen local source contract', async () => {
    const record = graph.projects.find(({ id }) => id === 'listwithme');
    if (!record) throw new Error('Missing projects/listwithme');

    expect(
      record.data.screenshots.map(({ src, label, order }) => ({
        src,
        label,
        order,
      })),
    ).toEqual(LISTWITHME_SCREENSHOTS);
    expect(record.data.screenshots.map(({ device }) => device)).toEqual([
      'iPhone',
      'iPhone',
      'iPhone',
      'iPhone',
    ]);
    expect(
      record.data.screenshots.every(({ alt }) => alt.trim().length > 0),
    ).toBe(true);
    expect(record.data.screenshots.every(({ decorative }) => !decorative)).toBe(
      true,
    );

    for (const screenshot of record.data.screenshots) {
      const imported = resolveLocalImage(screenshot.src);
      expect(
        { width: imported.width, height: imported.height },
        screenshot.src,
      ).toEqual({ width: 1206, height: 2622 });
      const metadata = await sharp(
        join(repositoryRoot, 'src', 'assets', screenshot.src),
      ).metadata();
      expect(
        { width: metadata.width, height: metadata.height },
        screenshot.src,
      ).toEqual({ width: 1206, height: 2622 });
    }
  });

  it('renders all four source-ordered screenshots through local responsive pictures', () => {
    const $ = detail('/listwithme/');
    const screenshots = $('[data-app-screenshot]');
    expect(screenshots).toHaveLength(4);
    expect(
      screenshots
        .map((_, node) => $(node).attr('data-screenshot-device'))
        .get(),
    ).toEqual(['iPhone', 'iPhone', 'iPhone', 'iPhone']);
    expect(screenshots.find('source[type="image/avif"][srcset]')).toHaveLength(
      4,
    );
    expect(screenshots.find('source[type="image/webp"][srcset]')).toHaveLength(
      4,
    );
    expect(
      screenshots.find(
        'img[alt]:not([alt=""])[width="1206"][height="2622"][loading="lazy"][decoding="async"]',
      ),
    ).toHaveLength(4);
    expect(
      screenshots
        .map((_, node) => $(node).find('figcaption strong').text().trim())
        .get(),
    ).toEqual(LISTWITHME_SCREENSHOTS.map(({ label }) => label));
  });
});

describe('detail component guards and responsive contract', () => {
  it('renders an honest synthetic two-section sparse dossier through the real field-notes component', async () => {
    const module =
      detailComponents['../../src/components/detail/FieldNotes.astro'];
    expect(module, 'FieldNotes component').toBeDefined();
    if (!module) return;

    const container = await AstroContainer.create();
    const sparseHtml = await container.renderToString(module.default as never, {
      props: {
        notes: [
          {
            key: 'when-to-use',
            heading: 'When I reach for it',
            body: [
              'A substantive forty-character-or-longer test paragraph for the sparse state.',
            ],
          },
          {
            key: 'design-decisions',
            heading: 'Why it stays small',
            body: [
              'Another substantive paragraph proving a valid sparse dossier renders honestly.',
            ],
          },
        ],
      },
    });
    const $sparse = load(sparseHtml);
    expect(
      $sparse('[data-field-note-key]')
        .map((_, node) => $sparse(node).attr('data-field-note-key'))
        .get(),
    ).toEqual(['when-to-use', 'design-decisions']);
  });

  it('rejects too many primary or quiet actions at the rendering boundary', async () => {
    const module =
      detailComponents['../../src/components/detail/ActionGroup.astro'];
    expect(module, 'ActionGroup component').toBeDefined();
    if (!module) return;
    const container = await AstroContainer.create();

    await expect(
      container.renderToString(module.default as never, {
        props: {
          links: [
            { label: 'One', href: 'https://example.com/one', kind: 'primary' },
            { label: 'Two', href: 'https://example.com/two', kind: 'install' },
          ],
        },
      }),
    ).rejects.toThrow(/at most one primary/i);
    await expect(
      container.renderToString(module.default as never, {
        props: {
          links: [
            { label: 'One', href: 'https://example.com/one', kind: 'source' },
            {
              label: 'Two',
              href: 'https://example.com/two',
              kind: 'secondary',
            },
            {
              label: 'Three',
              href: 'https://example.com/three',
              kind: 'source',
            },
          ],
        },
      }),
    ).rejects.toThrow(/at most two quiet/i);
  });

  it('rejects a fourth connected record at the rendering boundary', async () => {
    const module =
      detailComponents['../../src/components/detail/ConnectedRecords.astro'];
    expect(module, 'ConnectedRecords component').toBeDefined();
    if (!module) return;
    const container = await AstroContainer.create();
    const records = Array.from({ length: 4 }, (_, index) => ({
      collection: 'blog',
      id: `record-${index}`,
      label: `Relationship ${index}`,
      title: `Record ${index}`,
      summary: `A complete summary for connected record number ${index}.`,
      canonicalPath: `/record-${index}/`,
    }));

    await expect(
      container.renderToString(module.default as never, { props: { records } }),
    ).rejects.toThrow(/at most three connected records/i);
  });

  it('keeps sticky context and gallery columns at the approved breakpoint seams', () => {
    expect(declarations('.dossier-aside').position).toBe('static');
    expect(declarations('.dossier-aside', '(min-width: 1220px)').position).toBe(
      'sticky',
    );
    expect(
      declarations('.screenshot-grid', '(min-width: 1220px)')[
        'grid-template-columns'
      ]?.replace(/\s+/g, ''),
    ).toBe('repeat(4,minmax(0,1fr))');
    expect(
      declarations(
        '.screenshot-grid',
        '(min-width: 821px) and (max-width: 1219px)',
      )['grid-template-columns']?.replace(/\s+/g, ''),
    ).toBe('repeat(2,minmax(0,1fr))');
    expect(
      declarations('.screenshot-grid', '(max-width: 820px)')['overflow-x'],
    ).toBe('auto');
    expect(
      declarations('.screenshot-card', '(max-width: 820px)')[
        'scroll-snap-align'
      ],
    ).toBe('start');
  });

  it('keeps lime utility labels AA-readable on their blue card surfaces', () => {
    const tokens = declarations(':root');
    expect(declarations('.connected-card--lead').background).toBe(
      'var(--blue-dark)',
    );
    expect(declarations('.record-navigation-card--next').background).toBe(
      'var(--blue-dark)',
    );
    expect(
      contrastRatio(tokens['--lime'], tokens['--blue-dark']),
    ).toBeGreaterThanOrEqual(4.5);
  });
});
