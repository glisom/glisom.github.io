import { readFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createProcessor } from '@mdx-js/mdx';
import { load } from 'cheerio';
import fg from 'fast-glob';
import matter from 'gray-matter';
import { describe, expect, it } from 'vitest';
import {
  renderRssBody,
  type RssSourceFormat,
} from '../../src/lib/discovery/rss';

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));
const mdxParser = createProcessor({ format: 'mdx' });

function figure(src: string, alt: string, asset = 'fixture.png'): string {
  return `<Figure src="${src}" assetKey="legacy/${asset}" alt="${alt}" width={640} height={480} variant="wide" />`;
}

function embed(src: string, title = 'Spotify playlist: Fixture'): string {
  return `<EmbedFrame src="${src}" title="${title}" />`;
}

function rootChildTypes(source: string): string[] {
  const tree = mdxParser.parse(source);
  return tree.children.map((node) => node.type);
}

describe('RSS body rendering', () => {
  it('uses the same Unified MDX grammar as Astro for ESM and import-looking prose', () => {
    const actualImport = `import Figure from './Figure.astro';

Visible after import.`;
    const keywordTab = `import\tFigure from './keyword-tab.astro'

Visible after tab.`;

    expect(rootChildTypes(actualImport)).toEqual(['mdxjsEsm', 'paragraph']);
    expect(rootChildTypes(keywordTab)).toEqual(['paragraph', 'paragraph']);

    const imported = load(renderRssBody(actualImport, 'Actual import', 'mdx'));
    expect(imported('p').text()).toBe('Visible after import.');
    expect(imported.text()).not.toContain('Figure.astro');

    const tabbed = load(renderRssBody(keywordTab, 'Keyword tab', 'mdx'));
    expect(
      tabbed('p')
        .map((_, element) => tabbed(element).text())
        .get(),
    ).toEqual([
      `import\tFigure from './keyword-tab.astro'`,
      'Visible after tab.',
    ]);
  });

  it.each([
    { name: 'LF', lineEnding: '\n' },
    { name: 'CRLF', lineEnding: '\r\n' },
    { name: 'CR', lineEnding: '\r' },
  ])(
    'normalizes $name before applying positioned MDX edits',
    ({ lineEnding }) => {
      const source = [
        `import Figure from './Figure.astro';`,
        '',
        figure('/images/normalized.png', 'Normalized', 'normalized.png'),
        '',
        'Visible.',
      ].join(lineEnding);
      const $ = load(renderRssBody(source, 'Normalized source', 'mdx'));

      expect($('img').attr('src')).toBe(
        'https://grantisom.com/images/normalized.png',
      );
      expect($('p').last().text()).toBe('Visible.');
      expect($.text()).not.toContain('Figure.astro');
    },
  );

  it('recursively removes true ESM and comment-only expressions but preserves meaningful expressions', () => {
    const source = `<div class="legacy-note">
import Figure from './nested.astro'
/*
\`\`\`mdx
${figure('/images/esm-comment.png', 'ESM comment', 'esm-comment.png')}
\`\`\`

    ${embed('https://open.spotify.com/embed/playlist/hidden', 'Hidden')}
*/
export const secret = 1

Visible inside.
</div>

{/* #personal/blogs */}

Before {/* hidden inline comment */} after.

{2 + 2}`;

    expect(rootChildTypes(source)).toEqual([
      'mdxJsxFlowElement',
      'mdxFlowExpression',
      'paragraph',
      'mdxFlowExpression',
    ]);

    const $ = load(renderRssBody(source, 'Recursive ESM', 'mdx'));
    expect($('div.legacy-note').text().trim()).toBe('Visible inside.');
    expect($.text()).toContain('{2 + 2}');
    expect($.text().replace(/\s+/g, ' ')).toContain('Before after.');
    expect($.text()).not.toMatch(
      /(?:nested\.astro|esm-comment|playlist\/hidden|secret|personal\/blogs)/,
    );
    expect($('img, a, pre')).toHaveLength(0);
  });

  it.each([
    {
      name: 'blockquote Figure',
      source: `> ${figure('/images/quoted.png', 'Quoted', 'quoted.png')}`,
      container: 'blockquote',
      selector: 'img',
      attribute: 'src',
      expected: 'https://grantisom.com/images/quoted.png',
    },
    {
      name: 'tight-list EmbedFrame',
      source: `- ${embed('https://open.spotify.com/embed/playlist/list', 'Listed')}`,
      container: 'li',
      selector: 'a',
      attribute: 'href',
      expected: 'https://open.spotify.com/embed/playlist/list',
    },
    {
      name: 'indented nested-list Figure',
      source: `- Parent
  - ${figure('/images/nested-list.png', 'Nested list', 'nested-list.png')}`,
      container: 'li li',
      selector: 'img',
      attribute: 'alt',
      expected: 'Nested list',
    },
  ])(
    'keeps a generated $name inside its Markdown container',
    ({ source, container, selector, attribute, expected }) => {
      const $ = load(renderRssBody(source, 'Container component', 'mdx'));
      expect($(`${container} ${selector}`).attr(attribute)).toBe(expected);
      expect($(container).length).toBeGreaterThan(0);
      if (container === 'li') expect($('li > p')).toHaveLength(0);
    },
  );

  it('strips escaped and numeric IDs only from actual headings in quotes and lists', () => {
    const source = `> ## 2018 \\{#2018}

- ### Listed heading \\{#123\\}

Literal prose \\{#keep-prose}.

\`\`\`md
## Code heading {#keep-code}
\`\`\``;
    const $ = load(renderRssBody(source, 'Container headings', 'mdx'));

    expect($('blockquote h2').text()).toBe('2018');
    expect($('li h3').text()).toBe('Listed heading');
    expect($('p').last().text()).toBe('Literal prose {#keep-prose}.');
    expect($('pre code').text()).toContain('## Code heading {#keep-code}');
    expect($('h2, h3').text()).not.toMatch(/\{#/);
  });

  it('leaves raw and fenced .md code literal while transforming no components inside it', () => {
    const literal = figure(
      '/images/literal.png',
      'Literal figure',
      'literal.png',
    );
    const escapedLiteral = literal
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
    const source = `<pre><code>${escapedLiteral}
## Raw heading {#raw-heading}</code></pre>

\`\`\`mdx
${literal}
## Fenced heading {#fenced-heading}
\`\`\``;
    const $ = load(renderRssBody(source, 'Plain Markdown code', 'md'));
    const code = $('pre code')
      .map((_, element) => $(element).text())
      .get();

    expect(code[0]).toContain(literal);
    expect(code[0]).toContain('## Raw heading {#raw-heading}');
    expect(code[1]).toContain(literal);
    expect(code[1]).toContain('## Fenced heading {#fenced-heading}');
    expect($('img')).toHaveLength(0);
  });

  it('renders a code block beyond the JavaScript argument limit without crashing', () => {
    const longCode = '~ '.repeat(150_000);
    const source = `${figure('/images/before-large-code.png', 'Before code', 'before-large-code.png')}
~~~text
${longCode}
~~~`;

    const rendered = renderRssBody(source, 'Large code', 'mdx');
    const $ = load(rendered);
    expect($('img').attr('alt')).toBe('Before code');
    expect($('pre code').text().length).toBeGreaterThan(250_000);
  });

  it('sets component URLs directly without Markdown destination corruption', () => {
    const source = `${figure('/images/a b(c).png)', 'Odd figure', 'odd.png')}
${embed('https://open.spotify.com/embed/playlist/a b(c))', 'Odd embed')}`;
    const $ = load(renderRssBody(source, 'Odd URLs', 'mdx'));

    expect($('img').attr('src')).toBe(
      'https://grantisom.com/images/a%20b(c).png)',
    );
    expect($('a').attr('href')).toBe(
      'https://open.spotify.com/embed/playlist/a%20b(c))',
    );
  });

  it('preserves nested blockquote/list code ancestry and transform-looking literals', () => {
    const literal = figure('/images/code.png', 'Code', 'code.png');
    const source = `> - Parent
>   \`\`\`mdx
>   import Figure from './Figure.astro';
>   ${literal}
>   ## Code heading {#code-heading}
>   \`\`\``;
    const $ = load(renderRssBody(source, 'Nested code', 'mdx'));

    expect($('blockquote li pre code').text()).toBe(
      `import Figure from './Figure.astro';
${literal}
## Code heading {#code-heading}
`,
    );
    expect($('img, h2')).toHaveLength(0);
  });

  it('bounds root raw JSX before a generated Figure instead of swallowing both', () => {
    const source = `<img src="/images/authored.png" alt="Authored" />
${figure('/images/generated.png', 'Generated', 'generated.png')}`;
    const $ = load(renderRssBody(source, 'Adjacent raw JSX', 'mdx'));
    const children = $('body').children();

    expect(children.map((_, element) => element.tagName).get()).toEqual([
      'img',
      'p',
    ]);
    expect(children.eq(0).attr('src')).toBe(
      'https://grantisom.com/images/authored.png',
    );
    expect(children.eq(1).find('img').attr('alt')).toBe('Generated');
  });

  it('closes a static non-void JSX sibling before the generated block', () => {
    const source = `<div class="empty" />
${figure('/images/generated.png', 'Generated', 'generated.png')}`;
    const $ = load(renderRssBody(source, 'Adjacent non-void JSX', 'mdx'));

    expect(
      $('body')
        .children()
        .map((_, element) => element.tagName)
        .get(),
    ).toEqual(['div', 'p']);
    expect($('body > div.empty')).toHaveLength(1);
    expect($('body > p > img').attr('alt')).toBe('Generated');
  });

  it('bounds static raw JSX before a generated Figure inside a blockquote', () => {
    const source = `> <img src="/images/authored.png" alt="Authored" />
> ${figure('/images/generated.png', 'Generated', 'generated.png')}`;
    const $ = load(renderRssBody(source, 'Quoted adjacent JSX', 'mdx'));

    expect($('blockquote > img').attr('alt')).toBe('Authored');
    expect($('blockquote > p > img').attr('alt')).toBe('Generated');
  });

  it('retains a rendered block boundary after prose in a tight list item', () => {
    const source = `- First
  ${figure('/images/list.png', 'List block', 'list.png')}
- Second`;
    const $ = load(renderRssBody(source, 'Tight list boundary', 'mdx'));
    const firstItem = $('li').first();

    expect(firstItem.find('img').attr('alt')).toBe('List block');
    expect(firstItem.html()).toMatch(/^First\s+<img[^>]+>\s*$/);
    expect(firstItem.children('p')).toHaveLength(0);
  });

  it('keeps prose and consecutive generated components as separate ordered blocks', () => {
    const source = `Before.
${figure('/images/first.png', 'First', 'first.png')}
${embed('https://open.spotify.com/embed/playlist/second', 'Second')}
${figure('/images/third.png', 'Third', 'third.png')}
After.`;
    const $ = load(renderRssBody(source, 'Flow boundaries', 'mdx'));
    const paragraphs = $('body > p');

    expect(paragraphs).toHaveLength(5);
    expect(paragraphs.eq(0).text()).toBe('Before.');
    expect(paragraphs.eq(1).find('img').attr('alt')).toBe('First');
    expect(paragraphs.eq(2).find('a').text()).toBe('Second');
    expect(paragraphs.eq(3).find('img').attr('alt')).toBe('Third');
    expect(paragraphs.eq(4).text()).toBe('After.');
  });

  it('lets MarkdownIt own a fence immediately after a generated component', () => {
    const literal = figure('/images/in-fence.png', 'In fence', 'in-fence.png');
    const source = `${figure('/images/live.png', 'Live', 'live.png')}
\`\`\`mdx
import Figure from './Figure.astro';
${literal}
## Code heading {#code-heading}
\`\`\``;
    const $ = load(renderRssBody(source, 'Adjacent fence', 'mdx'));

    expect($('img')).toHaveLength(1);
    expect($('img').attr('alt')).toBe('Live');
    expect($('pre code').text()).toContain(literal);
    expect($('pre code').text()).toContain('## Code heading {#code-heading}');
  });

  it('replaces generated components in inline text and allowed div/span wrappers', () => {
    const source = `Inline before ${figure('/images/inline.png', 'Inline', 'inline.png')} after.

<div class="legacy-note">
${embed('https://open.spotify.com/embed/playlist/div', 'In div')}
</div>

Before <span class="legacy-note">${figure('/images/span.png', 'In span', 'span.png')}</span> after.`;
    const $ = load(renderRssBody(source, 'Allowed wrappers', 'mdx'));

    expect($('body > p').first().find('img').attr('alt')).toBe('Inline');
    expect($('div.legacy-note a').attr('href')).toBe(
      'https://open.spotify.com/embed/playlist/div',
    );
    expect($('span.legacy-note img').attr('alt')).toBe('In span');
    expect($('body > p').last().text()).toBe('Before  after.');
  });

  it('never promotes expression or spread component sources into feed URLs', () => {
    const source = `<Figure src={dangerous()} assetKey="legacy/x.png" alt="Expression" width={1} height={1} variant="wide" />
<EmbedFrame {...props} src="https://open.spotify.com/embed/playlist/forged" title="Forged" />`;
    const rendered = renderRssBody(source, 'Forged components', 'mdx');
    const $ = load(rendered);

    expect($('img, a')).toHaveLength(0);
    expect(rendered).not.toMatch(/(?:dangerous|playlist\/forged)/);
  });

  it('never strips import-looking prose from plain Markdown', () => {
    const source = `import Figure from './plain.astro'
import\tEmbedFrame from './plain-tab.astro'

Visible.`;
    const $ = load(renderRssBody(source, 'Plain Markdown', 'md'));

    expect(
      $('p')
        .map((_, element) => $(element).text())
        .get(),
    ).toEqual([
      `import Figure from './plain.astro'\nimport\tEmbedFrame from './plain-tab.astro'`,
      'Visible.',
    ]);
  });

  it('matches MarkdownIt newline, NUL, and plain-heading normalization', () => {
    const $ = load(
      renderRssBody(
        '# Root heading {#123}\r\n\r\nBefore\u0000after.',
        'Normalized Markdown',
        'md',
      ),
    );

    expect($('h1').text()).toBe('Root heading');
    expect($('p').text()).toBe('Before\uFFFDafter.');
  });

  it('removes the migrated Safari JSX comment when rendering the real post', async () => {
    const path = `${repositoryRoot}/src/content/blog/safari-inspecting-simulators.mdx`;
    const parsed = matter(await readFile(path, 'utf8'));
    const rendered = renderRssBody(
      parsed.content,
      String(parsed.data.title),
      'mdx',
    );

    expect(rendered).not.toContain('#personal/blogs');
    expect(load(rendered)('img')).toHaveLength(2);
  });

  it('renders all 23 migrated post bodies without leaking build-only syntax', async () => {
    const paths = await fg('src/content/blog/*.{md,mdx}', {
      cwd: repositoryRoot,
      absolute: true,
    });
    expect(paths).toHaveLength(23);

    for (const path of paths) {
      const parsed = matter(await readFile(path, 'utf8'));
      const format = extname(path).slice(1) as RssSourceFormat;
      const rendered = renderRssBody(
        parsed.content,
        String(parsed.data.title),
        format,
      );

      expect(rendered, basename(path)).not.toBe('');
      expect(rendered, basename(path)).not.toMatch(
        /(?:<\/?(?:Figure|EmbedFrame)\b|assetKey=|^import (?:Figure|EmbedFrame) from)/m,
      );
      expect(rendered, basename(path)).not.toMatch(/\{#[^{}\s]+\}/);
    }
  });

  it('preserves safe legacy HTML, strips unsafe markup, and rewrites only root-relative URLs', () => {
    const rendered = renderRssBody(
      `<span class="legacy-note" onclick="alert(1)">Read <a href="/about/" title="About">about</a>.</span>

<img src="/images/local.png" alt="Local" />
<img src="//cdn.example.com/shared.png" alt="CDN" />
<a href="javascript:alert(1)">unsafe</a>
<script>alert('no')</script>`,
      'Legacy HTML',
      'md',
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
