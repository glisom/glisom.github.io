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

describe('minimal homepage', () => {
  it('introduces Grant and provides routes to the full collections', () => {
    expect($('h1').text().replace(/\s+/g, ' ').trim()).toBe('Grant Isom');
    expect($('.home-about').attr('href')).toBe('/about/');
    expect(
      $('.home-section-heading a')
        .map((_, node) => $(node).attr('href'))
        .get(),
    ).toEqual(['/blog/', '/projects/']);
    for (const href of ['/app-library/', '/skills/', '/skill-library/']) {
      expect($(`.rail-nav a[href="${href}"]`)).toHaveLength(1);
    }
  });

  it('preserves the featured article and latest writing destinations', () => {
    expect($('.home-posts a')).toHaveLength(4);
    expect($('.home-posts a').first().attr('href')).toBe(
      '/2026/09/01/vampire.html',
    );
    expect(
      $('.home-posts a[href="/2026/02/24/listwithme-returns.html"]'),
    ).toHaveLength(1);
    expect($('.home-posts a[href="#"]')).toHaveLength(0);
  });

  it('keeps selected projects as linked descriptions', () => {
    expect(
      $('.home-projects strong')
        .map((_, node) => $(node).text())
        .get(),
    ).toEqual(['Hermes iOS', 'ListWithMe']);
    expect($('.home-projects .home-project-summary')).toHaveLength(2);
    expect(
      $('.home-projects a')
        .map((_, node) => $(node).attr('href'))
        .get()
        .every(Boolean),
    ).toBe(true);
  });

  it('uses one responsive illustration and a single content flow', () => {
    expect($('[data-halftone-image]')).toHaveLength(1);
    expect($('.hero-art picture img[width][height]')).toHaveLength(1);
    expect(
      $('.home-section h2')
        .map((_, node) => $(node).text())
        .get(),
    ).toEqual(['Writing', 'Selected projects']);
    expect($('.role-index, .personal-note, .card')).toHaveLength(0);
    expect($('.site-footer')).toHaveLength(1);
    expect($('script')).toHaveLength(0);
  });

  it('uses native sans fonts without webfont downloads', async () => {
    const layout = await readFile(
      new URL('../../src/layouts/BaseLayout.astro', import.meta.url),
      'utf8',
    );
    const tokens = await readFile(
      new URL('../../src/styles/tokens.css', import.meta.url),
      'utf8',
    );
    expect(layout).not.toContain('@fontsource/');
    expect(tokens).toContain('--sans: -apple-system, BlinkMacSystemFont');
    expect(tokens).not.toContain('--serif:');
  });
});
