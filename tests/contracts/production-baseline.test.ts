import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { extractSemanticPage } from '../../scripts/capture-production-baseline.mjs';

describe('independent public contract', () => {
  it('contains 37 unique artifacts and 33 sitemap pages', async () => {
    const fixture = JSON.parse(
      await readFile(
        new URL('../fixtures/public-routes.json', import.meta.url),
        'utf8',
      ),
    );
    const routes = fixture.routes;
    expect(routes).toHaveLength(37);
    expect(
      new Set(
        routes.map((route: { canonicalPath: string }) => route.canonicalPath),
      ).size,
    ).toBe(37);
    expect(
      routes.filter((route: { inSitemap: boolean }) => route.inSitemap),
    ).toHaveLength(33);
    expect(
      routes.some(
        (route: { outputPath: string }) =>
          route.outputPath === 'projects/listwithme/index.html',
      ),
    ).toBe(false);
  });

  it('classifies ListWithMe legal routes as utilities', async () => {
    const fixture = JSON.parse(
      await readFile(
        new URL('../fixtures/public-routes.json', import.meta.url),
        'utf8',
      ),
    );

    expect(
      fixture.routes
        .filter((route: { canonicalPath: string }) =>
          ['/listwithme/support/', '/listwithme/privacy/'].includes(
            route.canonicalPath,
          ),
        )
        .map((route: { canonicalPath: string; kind: string }) => ({
          canonicalPath: route.canonicalPath,
          kind: route.kind,
        })),
    ).toEqual([
      { canonicalPath: '/listwithme/support/', kind: 'utility' },
      { canonicalPath: '/listwithme/privacy/', kind: 'utility' },
    ]);
  });

  it('captures only article semantic content in document order', () => {
    const html = `
      <h1>Document title</h1>
      <nav><a href="/ignored">Ignored navigation</a></nav>
      <article class="c-article__main">
        <h2 id="context">Context</h2>
        <p>Semantic <a href="/kept">content</a>.</p>
        <img src="/image.png" alt="Example">
        <pre><code>const answer = 42;</code></pre>
        <iframe src="https://example.com/embed"></iframe>
      </article>
    `;

    expect(extractSemanticPage(html)).toEqual({
      title: 'Document title',
      headings: [{ level: 2, text: 'Context', id: 'context' }],
      text: 'Context Semantic content. const answer = 42;',
      links: ['/kept'],
      images: ['/image.png'],
      codeBlocks: ['const answer = 42;'],
      iframeSources: ['https://example.com/embed'],
    });
  });
});
