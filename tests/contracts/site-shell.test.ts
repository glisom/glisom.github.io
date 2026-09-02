import { execFile } from 'node:child_process';
import {
  cp,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { load, type CheerioAPI } from 'cheerio';
import postcss, { type Root } from 'postcss';
import { beforeAll, describe, expect, it } from 'vitest';
import { resolveLocalImage } from '../../src/lib/media';

const execFileAsync = promisify(execFile);

let html: string;
let $: CheerioAPI;
let builtStyles: Root;

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));

function declarationsFor(selector: string): Record<string, string> {
  const declarations: Record<string, string> = {};
  builtStyles.walkRules((rule) => {
    if (!rule.selectors.includes(selector)) return;
    rule.walkDecls((declaration) => {
      declarations[declaration.prop] = declaration.value;
    });
  });
  return declarations;
}

async function buildWithoutDesignReference(): Promise<void> {
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'grantisom-shell-'));
  const isolatedRoot = join(temporaryRoot, 'repository');
  const excludedRoots = new Set([
    '.astro',
    '.git',
    '.superpowers',
    'design-reference',
    'dist',
    'node_modules',
  ]);

  try {
    await cp(repositoryRoot, isolatedRoot, {
      recursive: true,
      filter: (source) => {
        const [topLevel] = relative(repositoryRoot, source).split('/');
        return !excludedRoots.has(topLevel);
      },
    });
    await symlink(
      join(repositoryRoot, 'node_modules'),
      join(isolatedRoot, 'node_modules'),
      'dir',
    );
    await writeFile(
      join(isolatedRoot, 'src/pages/media-contract.astro'),
      `---
import { resolveLocalImage } from '../lib/media';
const evidenceMap = resolveLocalImage('evidence/evidence-map.png');
---
<p>{evidenceMap.width} × {evidenceMap.height}</p>
`,
      'utf8',
    );
    await execFileAsync('npm', ['run', 'build'], {
      cwd: isolatedRoot,
    });
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

beforeAll(async () => {
  await execFileAsync('npm', ['run', 'build'], {
    cwd: repositoryRoot,
  });
  html = await readFile(
    new URL('../../dist/index.html', import.meta.url),
    'utf8',
  );
  $ = load(html);
  const stylesheetPaths = $('link[rel="stylesheet"]')
    .map((_, element) => $(element).attr('href'))
    .get()
    .filter((href): href is string => href.startsWith('/'));
  const css = (
    await Promise.all(
      stylesheetPaths.map((href) =>
        readFile(join(repositoryRoot, 'dist', href)),
      ),
    )
  ).join('\n');
  builtStyles = postcss.parse(css);
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

  it('keeps the desktop identity rail on paper with blue limited to active navigation', () => {
    expect(declarationsFor('.identity-rail')).toMatchObject({
      'border-right': '1px solid var(--line)',
      color: 'var(--ink)',
      background: 'var(--paper)',
    });
    expect(declarationsFor('.identity-copy small').color).toBe('var(--muted)');
    expect(declarationsFor('.status-line')).toMatchObject({
      'border-top': '1px solid var(--line)',
      'border-bottom': '1px solid var(--line)',
      color: 'var(--muted)',
    });
    expect(declarationsFor('.rail-nav-item')['border-bottom']).toBe(
      '1px solid var(--line)',
    );
    expect(declarationsFor('.rail-label').color).toBe('var(--muted)');
    expect(declarationsFor('.rail-about')).toMatchObject({
      'border-bottom': '1px solid var(--ink)',
      color: 'var(--ink)',
    });
    expect(declarationsFor('.rail-context')['border-top']).toBe(
      '1px solid var(--line)',
    );
    expect(declarationsFor('.rail-context-title').color).toBe('var(--ink)');
    expect(declarationsFor('.rail-context-meta').color).toBe('var(--muted)');
    expect(declarationsFor('.rail-utility-context').opacity).toBeUndefined();
    expect(declarationsFor('.rail-now-list li')['border-left']).toBe(
      '2px solid var(--line-dark)',
    );
    expect(declarationsFor('.rail-now-list strong').color).toBe('var(--ink)');
    expect(declarationsFor('.rail-socials')['border-top']).toBe(
      '1px solid var(--line)',
    );
    expect(declarationsFor('.rail-socials a').color).toBe('var(--muted)');
    expect(declarationsFor('.rail-footer-line').color).toBe('var(--muted)');
    expect(declarationsFor('.rail-nav-item.is-active:before').background).toBe(
      'var(--blue)',
    );
    expect(declarationsFor('.rail-active-state').color).toBe(
      'var(--blue-dark)',
    );

    const railBlueUses: string[] = [];
    builtStyles.walkRules((rule) => {
      if (!rule.selector.includes('rail')) return;
      rule.walkDecls((declaration) => {
        if (declaration.value.includes('var(--blue')) {
          railBlueUses.push(rule.selector);
        }
      });
    });
    expect(railBlueUses.length).toBeGreaterThan(0);
    expect(railBlueUses.every((selector) => selector.includes('active'))).toBe(
      true,
    );
  });

  it('builds without the frozen design reference in the production source graph', async () => {
    await expect(buildWithoutDesignReference()).resolves.toBeUndefined();
  }, 60_000);
});
