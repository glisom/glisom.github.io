import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { load, type CheerioAPI } from 'cheerio';
import { beforeAll, describe, expect, it } from 'vitest';
import { resolveLocalImage } from '../../src/lib/media';

const execFileAsync = promisify(execFile);

let html: string;
let $: CheerioAPI;

beforeAll(async () => {
  await execFileAsync('npm', ['run', 'build'], {
    cwd: new URL('../..', import.meta.url),
  });
  html = await readFile(
    new URL('../../dist/index.html', import.meta.url),
    'utf8',
  );
  $ = load(html);
}, 60_000);

describe('built site shell', () => {
  it('renders the shared accessible document and navigation contract', () => {
    expect($('html').attr('lang')).toBe('en');
    expect($('a[href="#main-content"]').text().trim()).toBe('Skip to content');
    expect($('main#main-content')).toHaveLength(1);
    expect(
      $('nav[aria-label="Browse"] a')
        .map((_, element) => $(element).text().trim())
        .get(),
    ).toEqual(['Blog', 'App Library', 'My Apps', 'Skill Library', 'My Skills']);
    expect($('nav[aria-label="Mobile browse"] a[href="/about/"]')).toHaveLength(
      1,
    );
    expect(
      $('link[rel="alternate"][type="application/rss+xml"]').attr('href'),
    ).toBe('https://grantisom.com/feed.xml');
    expect($('link[rel~="icon"][href="/favicon.ico"]')).toHaveLength(1);
    expect(html).not.toContain('/assets/js/darkmode.js');
    expect(html).not.toContain('/css/main.css');
  });

  it('resolves the approved evidence-map art through the local media contract', () => {
    const evidenceMap = resolveLocalImage('evidence/evidence-map.png');

    expect({ width: evidenceMap.width, height: evidenceMap.height }).toEqual({
      width: 1200,
      height: 600,
    });
  });
});
