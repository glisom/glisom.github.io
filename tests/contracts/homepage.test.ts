import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { load, type CheerioAPI } from 'cheerio';
import { beforeAll, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));

let $: CheerioAPI;
let homeCss: string;

function blockBody(source: string, opening: string): string {
  const openingIndex = source.indexOf(opening);
  if (openingIndex === -1) return '';

  const start = source.indexOf('{', openingIndex);
  if (start === -1) return '';

  let depth = 0;
  for (let index = start; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') depth -= 1;
    if (depth === 0) return source.slice(start + 1, index);
  }

  return '';
}

function resolveSourceSizeAtViewport(
  sizes: string,
  viewportWidth: number,
): number {
  const resolveLength = (length: string): number => {
    const calc = /^calc\(([\d.]+)vw - ([\d.]+)px\)$/.exec(length);
    if (calc) {
      return (Number(calc[1]) / 100) * viewportWidth - Number(calc[2]);
    }

    const viewport = /^([\d.]+)vw$/.exec(length);
    if (viewport) return (Number(viewport[1]) / 100) * viewportWidth;

    throw new Error(`Unsupported source-size length: ${length}`);
  };

  for (const entry of sizes.split(',').map((value) => value.trim())) {
    const conditional = /^\(max-width: (\d+)px\) (.+)$/.exec(entry);
    if (!conditional) return resolveLength(entry);
    if (viewportWidth <= Number(conditional[1])) {
      return resolveLength(conditional[2]);
    }
  }

  throw new Error(`No source-size matched ${viewportWidth}px`);
}

beforeAll(async () => {
  await execFileAsync('npm', ['run', 'build'], { cwd: repositoryRoot });
  $ = load(
    await readFile(new URL('../../dist/index.html', import.meta.url), 'utf8'),
  );
  homeCss = await readFile(
    new URL('../../src/styles/home.css', import.meta.url),
    'utf8',
  );
}, 60_000);

describe('built homepage', () => {
  it('renders the approved personal hero and primary collection actions', () => {
    expect($('h1').text().replace(/\s+/g, ' ').trim()).toBe(
      'I build useful things and write what I learn.',
    );
    expect($('[data-home-hero] a[href="/blog/"]')).toHaveLength(1);
    expect($('[data-home-hero] a[href="/projects/"]')).toHaveLength(1);
    expect($('a[href^="#blog"], a[href^="#my-apps"]')).toHaveLength(0);
  });

  it('renders curated and computed records from the content graph', () => {
    expect($('[data-home-slot="featured-writing"] h2').text()).toBe(
      'Vampire: Keep Your MacBook Awake',
    );
    expect($('[data-home-slot="featured-project-primary"] h2').text()).toBe(
      'Hermes iOS',
    );
    expect($('[data-home-slot="featured-project-secondary"] h2').text()).toBe(
      'ListWithMe',
    );
    expect(
      $('[data-home-slot="app-library"] [data-record-title]')
        .map((_, node) => $(node).text().trim())
        .get(),
    ).toEqual(['Notion', 'Claude', 'Linear', 'Slack']);
    expect(
      $('[data-home-slot="skill-library"] [data-record-title]')
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
      $('[data-home-slot="latest-posts"] [data-post-row] > a'),
    ).toHaveLength(3);
    expect(
      $('[data-home-slot="my-skills"] [data-record-title]')
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
  });

  it('keeps the static mobile card order and shared shell boundaries', () => {
    expect(
      $('[data-home-slot]')
        .map((_, node) => $(node).attr('data-home-slot'))
        .get(),
    ).toEqual([
      'featured-writing',
      'featured-project-primary',
      'featured-project-secondary',
      'app-library',
      'latest-posts',
      'my-skills',
      'skill-library',
    ]);
    expect($('.site-footer')).toHaveLength(1);
    expect($('[aria-current="page"]')).toHaveLength(0);
    expect($('script')).toHaveLength(0);
  });

  it('renders all six evidence assets through responsive image markup', () => {
    expect($('[data-halftone-image]')).toHaveLength(6);
    expect($('[data-halftone-image] picture')).toHaveLength(6);
    expect($('[data-halftone-image] img[width][height]')).toHaveLength(6);
  });

  it('advertises each intermediate image at its rendered slot width', () => {
    const cases = [
      {
        selector: '.hero-art',
        sizes:
          '(max-width: 820px) calc(100vw - 32px), (max-width: 1120px) calc(100vw - 266px), (max-width: 1219px) calc(100vw - 284px), (max-width: 1320px) calc(100vw - 337px), 50vw',
        renderedAt1220: 883,
      },
      {
        selector: '.production-art',
        sizes:
          '(max-width: 820px) calc(100vw - 32px), (max-width: 1120px) 50vw, (max-width: 1219px) calc(50vw - 134px), (max-width: 1320px) calc(50vw - 160px), 26vw',
        renderedAt1220: 449.5,
      },
      {
        selector: '[data-home-slot="featured-project-primary"] .project-art',
        sizes:
          '(max-width: 820px) 66vw, (max-width: 1120px) 38vw, (max-width: 1219px) calc(50vw - 140px), (max-width: 1320px) calc(50vw - 166px), 20vw',
        renderedAt1220: 443.5,
      },
      {
        selector: '[data-home-slot="featured-project-secondary"] .project-art',
        sizes:
          '(max-width: 820px) 66vw, (max-width: 1120px) 38vw, (max-width: 1219px) calc(33vw - 92px), (max-width: 1320px) calc(33vw - 109px), 20vw',
        renderedAt1220: 292.71,
      },
      {
        selector: '.belief-art',
        sizes:
          '(max-width: 820px) 43vw, (max-width: 1120px) 20vw, (max-width: 1219px) calc(21.5vw - 60px), (max-width: 1320px) calc(21.5vw - 71px), 10vw',
        renderedAt1220: 190.705,
      },
    ] as const;

    for (const { selector, sizes, renderedAt1220 } of cases) {
      const sizeHints = $(selector)
        .find('source[sizes], img[sizes]')
        .map((__, candidate) => $(candidate).attr('sizes'))
        .get();

      expect(sizeHints).toHaveLength(3);
      expect(sizeHints).toEqual([sizes, sizes, sizes]);

      const advertisedAt1220 = resolveSourceSizeAtViewport(
        sizeHints[0] ?? '',
        1220,
      );
      expect(advertisedAt1220).toBeGreaterThanOrEqual(renderedAt1220);
      expect(advertisedAt1220 - renderedAt1220).toBeLessThanOrEqual(1);
    }
  });

  it('moves the hero and evidence grid to their safe intermediate layout before the rail breakpoint can squeeze them', () => {
    const intermediate = blockBody(homeCss, '@media (max-width: 1320px)');

    expect(blockBody(intermediate, '.home-hero')).toContain(
      'grid-template-columns: 1fr;',
    );
    expect(blockBody(intermediate, '.evidence-grid')).toContain(
      'grid-template-columns: repeat(2, 1fr);',
    );
  });

  it('keeps approved grid-row sizes as minimums instead of clipping real content', () => {
    expect(blockBody(homeCss, '.evidence-grid')).toContain(
      'grid-template-rows: repeat(3, minmax(162px, auto));',
    );
  });

  it('reserves flow space for card actions that remain visually anchored', () => {
    expect(blockBody(homeCss, '.project-card')).toContain(
      'padding-bottom: 64px;',
    );
    expect(blockBody(homeCss, '.writing-card')).toContain(
      'padding-bottom: 72px;',
    );
  });

  it('does not shrink the shared 44px homepage action target', () => {
    const actionRule = blockBody(homeCss, '.home-page .arrow-link');

    expect(actionRule).toContain('min-height: 44px;');
    expect(actionRule).not.toContain('min-height: 0;');
  });
});
