import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { load, type CheerioAPI } from 'cheerio';
import { beforeAll, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));

let $: CheerioAPI;

beforeAll(async () => {
  await execFileAsync('npm', ['run', 'build'], { cwd: repositoryRoot });
  $ = load(
    await readFile(new URL('../../dist/index.html', import.meta.url), 'utf8'),
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
      'Bringing ListWithMe Back to Life',
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
    ).toEqual(['Obsidian', 'Codex', 'Hermes Agent', 'Superhuman']);
    expect(
      $('[data-home-slot="skill-library"] [data-record-title]')
        .map((_, node) => $(node).text().trim())
        .get(),
    ).toEqual([
      'Deep Research',
      'Browser Control',
      'Frontend Design',
      'Documents',
      'PDF',
    ]);
    expect(
      $('[data-home-slot="latest-posts"] [data-post-row] > a'),
    ).toHaveLength(3);
    expect(
      $('[data-home-slot="my-skills"] [data-record-title]')
        .map((_, node) => $(node).text().trim())
        .get(),
    ).toEqual(['write-like-grant', 'goodreads-export', 'hatch-pet']);
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
});
