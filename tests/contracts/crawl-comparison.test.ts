import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { describe, expect, it } from 'vitest';
import { crawlSite } from '../../scripts/crawl-site.mjs';
import {
  buildCrawlPolicies,
  compareCrawls,
  type CrawlPolicy,
} from '../../scripts/lib/crawl-policy';

const readJson = async (name: string) =>
  JSON.parse(
    await readFile(new URL(`../fixtures/${name}`, import.meta.url), 'utf8'),
  );

const routes = (await readJson('public-routes.json')).routes;
const assets = (await readJson('legacy-assets.json')).assets;
const groups = await readJson('crawl-policies.json');
const migrationAllowances = await readJson('migration-allowances.json');
const legalFixtures = await readJson('listwithme-legal.json');

const context = (policies: readonly CrawlPolicy[]) => ({
  policies,
  legalFixtures,
  migrationAllowances,
});

const article = {
  headings: [{ level: 2, text: 'Heading', id: 'heading' }],
  text: 'Original prose.',
  links: ['https://example.com/source'],
  images: [],
  codeBlocks: [],
  iframeSources: [],
};

function htmlResult(path: string, overrides: Record<string, unknown> = {}) {
  return {
    requestedPath: path,
    status: 200,
    finalUrl: path,
    canonical: `https://grantisom.com${path}`,
    contentType: 'text/html',
    title: 'Title',
    description: 'Description',
    links: [],
    assets: [],
    articleSemantic: null,
    embedContracts: [],
    legalSemantic: null,
    bodySha256: 'a'.repeat(64),
    ...overrides,
  };
}

describe('crawl policy coverage', () => {
  it('catches an uncovered, duplicate, or unknown path across the exact 76 policies', () => {
    const policies = buildCrawlPolicies(routes, assets, {
      groups,
      migrationAllowances,
    });
    expect(policies).toHaveLength(76);
    expect(new Set(policies.map(({ path }) => path)).size).toBe(76);
    expect(policies.filter(({ mode }) => mode === 'legacy-post')).toHaveLength(
      23,
    );
    expect(
      policies.filter(({ mode }) => mode === 'repaired-asset'),
    ).toHaveLength(4);

    expect(() =>
      buildCrawlPolicies(routes, assets, {
        groups: { ...groups, newRoutes: groups.newRoutes.slice(1) },
        migrationAllowances,
      }),
    ).toThrow(/uncovered.*\/blog\//i);
    expect(() =>
      buildCrawlPolicies(routes, assets, {
        groups: {
          ...groups,
          redesignedExisting: [...groups.redesignedExisting, '/blog/'],
        },
        migrationAllowances,
      }),
    ).toThrow(/duplicate.*\/blog\//i);
    expect(() =>
      buildCrawlPolicies(routes, assets, {
        groups: {
          ...groups,
          newRoutes: [...groups.newRoutes, '/not-an-oracle-route/'],
        },
        migrationAllowances,
      }),
    ).toThrow(/unknown.*\/not-an-oracle-route\//i);
  });

  it('rejects a migration allowance with the right id but a wrong field, operation, count, or replacement', () => {
    const mutations = [
      (allowances: typeof migrationAllowances) => {
        allowances[0].field = 'links';
      },
      (allowances: typeof migrationAllowances) => {
        allowances[2].operation = 'replace-exact';
      },
      (allowances: typeof migrationAllowances) => {
        allowances[4].expectedOccurrences = 3;
      },
      (allowances: typeof migrationAllowances) => {
        allowances[1].after = 'https://example.com/unreviewed';
      },
    ];

    for (const mutate of mutations) {
      const changed = structuredClone(migrationAllowances);
      mutate(changed);
      expect(() =>
        buildCrawlPolicies(routes, assets, {
          groups,
          migrationAllowances: changed,
        }),
      ).toThrow(/migration allowance.*contract/i);
    }
  });
});

describe('deterministic site crawl', () => {
  it('deduplicates and sorts paths and every emitted local inventory without volatile fields', async () => {
    const server = createServer((request, response) => {
      const path = request.url ?? '/';
      response.statusCode = 200;
      response.setHeader('content-type', 'text/html; charset=utf-8');
      response.end(
        `<!doctype html><html><head><title>${path}</title><meta name="description" content="Fixture"><link rel="canonical" href="https://grantisom.com${path}"></head><body><h1>Fixture</h1><a href="/z/">Z</a><a href="/a/">A</a><img src="/z.png" alt="Z"><img src="/a.png" alt="A"></body></html>`,
      );
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('No port');
    const origin = new URL(`http://127.0.0.1:${address.port}`);
    try {
      const first = await crawlSite(origin, ['/b/', '/a/', '/b/'], 2);
      const second = await crawlSite(origin, ['/b/', '/a/'], 1);
      expect(first.map(({ requestedPath }) => requestedPath)).toEqual([
        '/a/',
        '/b/',
      ]);
      expect(first[0].links).toEqual(['/a/', '/z/']);
      expect(first[0].assets).toEqual(['/a.png', '/z.png']);
      expect(JSON.stringify(first)).toBe(JSON.stringify(second));
      expect(JSON.stringify(first)).not.toMatch(/timestamp|duration|headers/i);
    } finally {
      server.close();
      await once(server, 'close');
    }
  });

  it('preserves exact hash and mail links while normalizing equivalent XML media types', async () => {
    const server = createServer((request, response) => {
      if (request.url === '/feed.xml') {
        response.statusCode = 200;
        response.setHeader('content-type', 'text/xml; charset=utf-8');
        response.end('<rss version="2.0"></rss>');
        return;
      }
      response.statusCode = 200;
      response.setHeader('content-type', 'text/html; charset=utf-8');
      response.end(
        '<!doctype html><html><head><title>Legal</title><meta name="description" content="Legal"><link rel="canonical" href="https://grantisom.com/listwithme/support/"></head><body><h1 data-legal-title>ListWithMe Support</h1><div data-legal-content><p><a href="mailto:grant@example.com">grant@example.com</a></p></div><div data-article-prose><a href="#">Placeholder</a></div></body></html>',
      );
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('No port');
    const origin = new URL(`http://127.0.0.1:${address.port}`);
    try {
      const results = await crawlSite(origin, [
        '/feed.xml',
        '/listwithme/support/',
        '/2026/02/24/hash.html',
      ]);
      expect(results[0].articleSemantic?.links).toEqual(['#']);
      expect(results[1].contentType).toBe('application/xml');
      expect(results[2].legalSemantic).toEqual({
        title: 'ListWithMe Support',
        blocks: [
          {
            kind: 'paragraph',
            text: 'grant@example.com',
            links: [
              { text: 'grant@example.com', href: 'mailto:grant@example.com' },
            ],
          },
        ],
      });
    } finally {
      server.close();
      await once(server, 'close');
    }
  });

  it('preserves authored separators and rejects an undeclared separator deletion', async () => {
    const path = '/2026/02/07/healthql-react-native.html';
    let articleMarkup =
      '<table><tbody><tr><td><a href="https://github.com/glisom/HealthQL">GitHub</a></td><td><a href="https://glisom.github.io/HealthQL">Documentation</a></td></tr></tbody></table>';
    const server = createServer((_request, response) => {
      response.statusCode = 200;
      response.setHeader('content-type', 'text/html; charset=utf-8');
      response.end(
        `<!doctype html><html><head><title>HealthQL</title><meta name="description" content="Fixture"><link rel="canonical" href="https://grantisom.com${path}"></head><body><h1>HealthQL</h1><article data-article-prose>${articleMarkup}</article></body></html>`,
      );
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('No port');
    const origin = new URL(`http://127.0.0.1:${address.port}`);
    try {
      const baseline = (await crawlSite(origin, [path]))[0];
      expect(baseline.articleSemantic?.text).toBe('GitHub | Documentation');
      const policy: CrawlPolicy = {
        path,
        mode: 'legacy-post',
        allowanceIds: [],
      };
      articleMarkup =
        '<p><a href="https://github.com/glisom/HealthQL">GitHub</a> | <a href="https://glisom.github.io/HealthQL">Documentation</a></p>';
      const preserved = (await crawlSite(origin, [path]))[0];
      expect(compareCrawls([baseline], [preserved], context([policy]))).toEqual(
        [],
      );
      articleMarkup =
        '<p><a href="https://github.com/glisom/HealthQL">GitHub</a> <a href="https://glisom.github.io/HealthQL">Documentation</a></p>';
      const deleted = (await crawlSite(origin, [path]))[0];
      expect(deleted.articleSemantic?.text).toBe('GitHub Documentation');
      expect(compareCrawls([baseline], [deleted], context([policy]))).toEqual([
        expect.objectContaining({ path, field: 'articleSemantic.text' }),
      ]);
    } finally {
      server.close();
      await once(server, 'close');
    }
  });
});

describe('structured crawl comparison', () => {
  it('accepts the declared four-image Notion repair and rejects undeclared prose drift', () => {
    const path = '/2023/01/14/notion-for-software.html';
    const policy: CrawlPolicy = {
      path,
      mode: 'legacy-post',
      allowanceIds: ['correct-four-notion-image-paths'],
    };
    const baseline = htmlResult(path, {
      articleSemantic: {
        ...article,
        images: [
          '/uploads/2023/f159196842.png',
          '/uploads/2023/fa6c5dfe53.png',
          '/uploads/2023/5fd90bfbf1.png',
          '/uploads/2023/6647450a28.png',
        ],
      },
    });
    const candidate = htmlResult(path, {
      articleSemantic: {
        ...article,
        images: [
          '/images/f159196842.png',
          '/images/fa6c5dfe53.png',
          '/images/5fd90bfbf1.png',
          '/images/6647450a28.png',
        ],
      },
    });
    expect(compareCrawls([baseline], [candidate], context([policy]))).toEqual(
      [],
    );
    const changed = {
      ...candidate,
      articleSemantic: {
        ...article,
        images: [
          '/images/f159196842.png',
          '/images/fa6c5dfe53.png',
          '/images/5fd90bfbf1.png',
          '/images/6647450a28.png',
        ],
        text: 'Undeclared replacement prose.',
      },
    };
    expect(compareCrawls([baseline], [changed], context([policy]))).toEqual([
      expect.objectContaining({ path, field: 'articleSemantic.text' }),
    ]);
  });

  it('accepts exactly four marked Spotify upgrades and rejects altered, extra, or unmarked fallbacks', () => {
    const path = '/2020/02/10/2019-playlists.html';
    const policy: CrawlPolicy = {
      path,
      mode: 'legacy-post',
      allowanceIds: ['upgrade-spotify-embeds'],
    };
    const sources = ['/one', '/two', '/three', '/four'].map(
      (id) => `https://open.spotify.com/embed/playlist${id}`,
    );
    const embedContracts = sources.map((src, index) => ({
      src,
      title: `Spotify playlist: ${index + 1}`,
      loading: 'lazy',
      fallbackHref: src,
      fallbackText: `Open Spotify playlist: ${index + 1}`,
      fallbackCount: 1,
      fallbackLinkCount: 1,
      marked: true,
    }));
    const baseline = htmlResult(path, {
      articleSemantic: { ...article, iframeSources: sources },
    });
    const candidate = htmlResult(path, {
      articleSemantic: { ...article, iframeSources: sources },
      embedContracts,
    });
    expect(compareCrawls([baseline], [candidate], context([policy]))).toEqual(
      [],
    );

    for (const malformed of [
      {
        ...candidate,
        embedContracts: [
          { ...embedContracts[0], fallbackText: 'Listen now' },
          ...embedContracts.slice(1),
        ],
      },
      {
        ...candidate,
        articleSemantic: {
          ...article,
          iframeSources: sources,
          links: [...article.links, sources[0]],
        },
      },
      {
        ...candidate,
        embedContracts: [
          ...embedContracts,
          {
            ...embedContracts[0],
            title: 'Unmarked',
            fallbackText: 'Open Unmarked',
            marked: false,
          },
        ],
      },
      {
        ...candidate,
        embedContracts: [
          { ...embedContracts[0], fallbackCount: 2 },
          ...embedContracts.slice(1),
        ],
      },
    ]) {
      expect(
        compareCrawls([baseline], [malformed], context([policy])).length,
      ).toBeGreaterThan(0);
    }
  });

  it('accepts redesigned body changes but rejects a 500 candidate', () => {
    const path = '/about/';
    const policy: CrawlPolicy = { path, mode: 'redesigned-existing' };
    const baseline = htmlResult(path, { bodySha256: 'b'.repeat(64) });
    const candidate = htmlResult(path, { bodySha256: 'c'.repeat(64) });
    expect(compareCrawls([baseline], [candidate], context([policy]))).toEqual(
      [],
    );
    expect(
      compareCrawls(
        [baseline],
        [{ ...candidate, status: 500 }],
        context([policy]),
      ),
    ).toEqual([expect.objectContaining({ path, field: 'candidate.status' })]);
  });

  it('rejects a new route already present in production and a changed compatibility hash', () => {
    const newPath = '/blog/';
    const newPolicy: CrawlPolicy = { path: newPath, mode: 'new-route' };
    const baselineNew = htmlResult(newPath);
    const candidateNew = htmlResult(newPath);
    expect(
      compareCrawls([baselineNew], [candidateNew], context([newPolicy])),
    ).toEqual([
      expect.objectContaining({ path: newPath, field: 'baseline.status' }),
    ]);

    const assetPath = '/favicon.ico';
    const expectedSha256 = 'd'.repeat(64);
    const assetPolicy: CrawlPolicy = {
      path: assetPath,
      mode: 'preserved-asset',
      expectedSha256,
    };
    const baselineAsset = htmlResult(assetPath, {
      contentType: 'image/x-icon',
      bodySha256: expectedSha256,
    });
    const candidateAsset = {
      ...baselineAsset,
      bodySha256: 'e'.repeat(64),
    };
    expect(
      compareCrawls([baselineAsset], [candidateAsset], context([assetPolicy])),
    ).toEqual([
      expect.objectContaining({
        path: assetPath,
        field: 'candidate.bodySha256',
      }),
    ]);
  });
});
