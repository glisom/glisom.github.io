import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const SITE_ORIGIN = 'https://grantisom.com';
const ARTICLE_PATH = /^\/\d{4}\/\d{2}\/\d{2}\/.+\.html$/;
const SEMANTIC_BLOCKS = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'br',
  'dd',
  'div',
  'dl',
  'dt',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hr',
  'li',
  'main',
  'nav',
  'ol',
  'p',
  'pre',
  'section',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'ul',
]);

function normalizeText(value) {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePath(value) {
  const url = new URL(value, SITE_ORIGIN);
  const pathname = decodeURIComponent(url.pathname).replace(
    /\/index\.html$/,
    '/',
  );
  return `${pathname}${url.search}${decodeURIComponent(url.hash)}`;
}

function normalizeAuthoredUrl(value, baseUrl, pageUrl) {
  if (value === '#') return '#';
  try {
    const url = new URL(value, pageUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return value;
    if (url.origin === baseUrl.origin || url.origin === SITE_ORIGIN) {
      return normalizePath(url.href);
    }
    return `${url.origin}${decodeURIComponent(url.pathname)}${url.search}${decodeURIComponent(url.hash)}`;
  } catch {
    return value;
  }
}

function removeCandidateFallbacks(root) {
  root
    .find('figure[data-migrated-embed][data-embed-kind] [data-embed-fallback]')
    .remove();
}

function semanticText(root) {
  let output = '';
  const visit = (node) => {
    if (node.type === 'text') {
      output += node.data;
      return;
    }
    if (node.type !== 'tag') return;
    if (
      node.name === 'a' &&
      node.prev?.type === 'tag' &&
      node.prev.name === 'a'
    ) {
      output += ' ';
    }
    if (node.name === 'td' || node.name === 'th') {
      let previous = node.prev;
      while (previous?.type === 'text' && !previous.data.trim())
        previous = previous.prev;
      if (
        previous?.type === 'tag' &&
        (previous.name === 'td' || previous.name === 'th')
      ) {
        output += ' | ';
      }
    }
    const block = SEMANTIC_BLOCKS.has(node.name);
    if (block) output += ' ';
    for (const child of node.children ?? []) visit(child);
    if (block) output += ' ';
  };
  for (const node of root.toArray()) visit(node);
  return normalizeText(output);
}

function articleSemantics($, requestedPath, baseUrl, pageUrl) {
  if (!ARTICLE_PATH.test(requestedPath)) return null;
  const selected = $('[data-article-prose]').first().length
    ? $('[data-article-prose]').first()
    : $('.c-article__main').first().length
      ? $('.c-article__main').first()
      : $('.prose').first();
  if (!selected.length) return null;
  const root = selected.clone();
  removeCandidateFallbacks(root);
  return {
    headings: root
      .find('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]')
      .map((_, node) => ({
        level: Number(node.tagName.slice(1)),
        text: normalizeText($(node).text()),
        id: $(node).attr('id') ?? '',
      }))
      .get(),
    text: semanticText(root),
    links: root
      .find('a[href]')
      .map((_, node) =>
        normalizeAuthoredUrl($(node).attr('href') ?? '', baseUrl, pageUrl),
      )
      .get(),
    images: root
      .find('img[src]')
      .map((_, node) =>
        normalizeAuthoredUrl($(node).attr('src') ?? '', baseUrl, pageUrl),
      )
      .get(),
    codeBlocks: root
      .find('pre code')
      .map((_, node) => `${$(node).text().replace(/\n$/, '')}\n`)
      .get(),
    iframeSources: root
      .find('iframe[src]')
      .map((_, node) =>
        normalizeAuthoredUrl($(node).attr('src') ?? '', baseUrl, pageUrl),
      )
      .get(),
  };
}

function embedContracts($, baseUrl, pageUrl) {
  return $('figure[data-migrated-embed][data-embed-kind]')
    .map((_, node) => {
      const figure = $(node);
      const iframe = figure.find('iframe[src]').first();
      const fallbacks = figure.find('[data-embed-fallback]');
      const fallbackLinks = fallbacks.find('a[href]');
      return {
        src: normalizeAuthoredUrl(iframe.attr('src') ?? '', baseUrl, pageUrl),
        title: iframe.attr('title') ?? '',
        loading: iframe.attr('loading') ?? '',
        fallbackHref: normalizeAuthoredUrl(
          fallbackLinks.first().attr('href') ?? '',
          baseUrl,
          pageUrl,
        ),
        fallbackText: normalizeText(fallbacks.text()),
        fallbackCount: fallbacks.length,
        fallbackLinkCount: fallbackLinks.length,
        marked: true,
      };
    })
    .get();
}

function linksFrom($, element, baseUrl, pageUrl) {
  return element
    .find('a[href]')
    .map((_, node) => ({
      text: normalizeText($(node).text()),
      href: normalizeAuthoredUrl($(node).attr('href') ?? '', baseUrl, pageUrl),
    }))
    .get();
}

function legalSemantic($, requestedPath, baseUrl, pageUrl) {
  if (
    requestedPath !== '/listwithme/support/' &&
    requestedPath !== '/listwithme/privacy/'
  ) {
    return null;
  }
  const content = $('[data-legal-content]').first();
  if (!content.length) return null;
  const title = normalizeText($('[data-legal-title]').first().text());
  const blocks = [];
  content.children('h2, h3, p, ul, ol').each((_, node) => {
    const element = $(node);
    if (node.tagName === 'h2' || node.tagName === 'h3') {
      blocks.push({
        kind: 'heading',
        level: Number(node.tagName.slice(1)),
        text: normalizeText(element.text()),
      });
    } else if (node.tagName === 'p') {
      blocks.push({
        kind: 'paragraph',
        text: normalizeText(element.text()),
        links: linksFrom($, element, baseUrl, pageUrl),
      });
    } else {
      blocks.push({
        kind: 'list',
        ordered: node.tagName === 'ol',
        items: element
          .children('li')
          .map((_, item) => ({
            text: normalizeText($(item).text()),
            links: linksFrom($, $(item), baseUrl, pageUrl),
          }))
          .get(),
      });
    }
  });
  return { title, blocks };
}

function localInventory($, selector, attribute, baseUrl, pageUrl) {
  return [
    ...new Set(
      $(selector)
        .toArray()
        .flatMap((node) => {
          const raw = $(node).attr(attribute) ?? '';
          const values =
            attribute === 'srcset'
              ? raw.split(',').map((entry) => entry.trim().split(/\s+/)[0])
              : [raw];
          return values.flatMap((value) => {
            try {
              const url = new URL(value, pageUrl);
              return url.origin === baseUrl.origin || url.origin === SITE_ORIGIN
                ? [normalizePath(url.href)]
                : [];
            } catch {
              return [];
            }
          });
        }),
    ),
  ].toSorted();
}

async function crawlOne(baseUrl, requestedPath) {
  const requestUrl = new URL(requestedPath, baseUrl);
  const response = await fetch(requestUrl, {
    redirect: 'follow',
    signal: AbortSignal.timeout(30_000),
    headers: { 'user-agent': 'grantisom-release-verifier/1.0' },
  });
  const body = Buffer.from(await response.arrayBuffer());
  const rawType = (response.headers.get('content-type') ?? '')
    .split(';', 1)[0]
    .trim()
    .toLowerCase();
  const type = rawType === 'text/xml' ? 'application/xml' : rawType;
  const isHtml = type === 'text/html';
  const html = isHtml ? body.toString('utf8') : '';
  const $ = isHtml ? cheerio.load(html) : null;
  const finalUrl = normalizePath(response.url || requestUrl.href);
  const links = $
    ? localInventory($, 'a[href]', 'href', baseUrl, response.url)
    : [];
  const assets = $
    ? [
        ...localInventory(
          $,
          'img[src], script[src]',
          'src',
          baseUrl,
          response.url,
        ),
        ...localInventory(
          $,
          'link[rel="stylesheet"], link[rel~="icon"], link[rel="preload"], link[rel="modulepreload"]',
          'href',
          baseUrl,
          response.url,
        ),
        ...localInventory($, 'source[srcset]', 'srcset', baseUrl, response.url),
      ]
        .filter((value, index, values) => values.indexOf(value) === index)
        .toSorted()
    : [];
  return {
    requestedPath,
    status: response.status,
    finalUrl,
    canonical: $
      ? ($('head > link[rel="canonical"]').attr('href') ?? null)
      : null,
    contentType: type,
    title: $ ? normalizeText($('head > title').text()) : null,
    description: $
      ? ($('head > meta[name="description"]').attr('content')?.trim() ?? null)
      : null,
    links,
    assets,
    articleSemantic: $
      ? articleSemantics($, requestedPath, baseUrl, response.url)
      : null,
    embedContracts: $ ? embedContracts($, baseUrl, response.url) : [],
    legalSemantic: $
      ? legalSemantic($, requestedPath, baseUrl, response.url)
      : null,
    bodySha256: createHash('sha256').update(body).digest('hex'),
  };
}

export async function crawlSite(baseUrl, paths, concurrency = 6) {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error(`Concurrency must be a positive integer: ${concurrency}`);
  }
  const requestedPaths = [...new Set(paths.map(normalizePath))].toSorted();
  const results = new Array(requestedPaths.length);
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < requestedPaths.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await crawlOne(baseUrl, requestedPaths[index]);
    }
  };
  await Promise.all(
    Array.from(
      { length: Math.min(concurrency, requestedPaths.length) },
      worker,
    ),
  );
  return results;
}

async function fixturePaths() {
  const routeFixture = JSON.parse(
    await readFile(
      new URL('../tests/fixtures/public-routes.json', import.meta.url),
      'utf8',
    ),
  );
  const assetFixture = JSON.parse(
    await readFile(
      new URL('../tests/fixtures/legacy-assets.json', import.meta.url),
      'utf8',
    ),
  );
  return [
    ...routeFixture.routes.map(({ canonicalPath }) => canonicalPath),
    ...assetFixture.assets.map(({ path }) => path),
  ];
}

async function main() {
  const [, , origin, output] = process.argv;
  if (!origin || !output) {
    throw new Error(
      'Usage: node scripts/crawl-site.mjs <origin> <output.json>',
    );
  }
  const results = await crawlSite(new URL(origin), await fixturePaths());
  const outputPath = resolve(output);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(results, null, 2)}\n`);
  console.log(
    `Crawled ${results.length} deterministic paths into ${outputPath}`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
