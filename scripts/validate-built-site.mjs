import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as cheerio from 'cheerio';
import fg from 'fast-glob';
import matter from 'gray-matter';
import {
  transformArticleSemantics,
  validateMigrationAllowances,
} from './lib/crawl-policy.ts';

const SITE_ORIGIN = 'https://grantisom.com';
const RELEASE_DATE = '2026-09-02';
const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const HTML_METADATA_FIELDS = [
  'og:type',
  'og:site_name',
  'og:title',
  'og:description',
  'og:url',
  'og:image',
];
const BLOCKED_LEGACY_RESOURCES = new Set([
  '/css/main.css',
  '/assets/js/darkmode.js',
]);
const ARTICLE_IMAGE_SIZES =
  '(max-width: 820px) calc(100vw - 32px), (max-width: 1219px) min(720px, calc(100vw - 258px)), min(920px, calc(100vw - 314px))';

function normalizeText(value) {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extension(pathname) {
  const last = pathname.split('/').at(-1) ?? '';
  const index = last.lastIndexOf('.');
  return index === -1 ? '' : last.slice(index);
}

function outputPathFor(pathname) {
  const decoded = decodeURIComponent(pathname);
  if (decoded === '/') return 'index.html';
  const trimmed = decoded.replace(/^\/+/, '');
  if (decoded.endsWith('/')) return `${trimmed}index.html`;
  if (extension(decoded) === '') return `${trimmed}/index.html`;
  return trimmed;
}

function distRootFor(file) {
  let current = dirname(fileURLToPath(file));
  while (current !== dirname(current)) {
    if (current.split(sep).at(-1) === 'dist') return current;
    current = dirname(current);
  }
  throw new Error(`Cannot locate dist ancestor for ${file.href}`);
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function normalizedLocalUrl(value, pagePath) {
  if (!value || /^(?:mailto:|tel:|javascript:|data:)/i.test(value)) return null;
  const url = new URL(value, new URL(pagePath, SITE_ORIGIN));
  if (url.origin !== SITE_ORIGIN) return null;
  return url;
}

async function resolvesReference(distRoot, pagePath, value, checkFragment) {
  try {
    const url = normalizedLocalUrl(value, pagePath);
    if (!url) return true;
    const outputPath = outputPathFor(url.pathname);
    const target = join(distRoot, outputPath);
    if (!(await pathExists(target))) return false;
    if (!checkFragment || !url.hash || !outputPath.endsWith('.html'))
      return true;
    const html = await readFile(target, 'utf8');
    const $ = cheerio.load(html);
    const id = decodeURIComponent(url.hash.slice(1));
    return $('[id]')
      .toArray()
      .some((node) => $(node).attr('id') === id);
  } catch {
    return false;
  }
}

export async function sha256File(file) {
  return createHash('sha256')
    .update(await readFile(file))
    .digest('hex');
}

export async function inspectHtml(file) {
  const distRoot = distRootFor(file);
  const path = `/${relative(distRoot, fileURLToPath(file)).split(sep).join('/')}`;
  const pagePath = path === '/index.html' ? '/' : path;
  const html = await readFile(file, 'utf8');
  const $ = cheerio.load(html);
  const hrefs = $('a[href]')
    .map((_, node) => $(node).attr('href') ?? '')
    .get();
  const internalValues = [
    ...hrefs,
    ...$('link[href]')
      .map((_, node) => $(node).attr('href') ?? '')
      .get(),
    ...$('script[src]')
      .map((_, node) => $(node).attr('src') ?? '')
      .get(),
  ].filter((value) => normalizedLocalUrl(value, pagePath));
  const imageValues = [
    ...$('img[src]')
      .map((_, node) => $(node).attr('src') ?? '')
      .get(),
    ...$('source[srcset]')
      .toArray()
      .flatMap((node) =>
        (
          ($(node).attr('srcset') ?? '').match(/(?:^|,)\s*([^\s,]+)/g) ?? []
        ).map((candidate) => candidate.replace(/^,?\s*/, '')),
      ),
  ].filter((value) => normalizedLocalUrl(value, pagePath));

  return {
    path: pagePath,
    h1Count: $('h1').length,
    canonicalCount: $('head > link[rel="canonical"]').length,
    titleCount: $('head > title').length,
    descriptionCount: $('head > meta[name="description"]').length,
    title: normalizeText($('head > title').text()),
    description:
      $('head > meta[name="description"]').attr('content')?.trim() ?? '',
    hrefs,
    internalLinks: await Promise.all(
      internalValues.map(async (value) => ({
        value,
        resolves: await resolvesReference(distRoot, pagePath, value, true),
      })),
    ),
    localImages: await Promise.all(
      imageValues.map(async (value) => ({
        value,
        resolves: await resolvesReference(distRoot, pagePath, value, false),
      })),
    ),
  };
}

function normalizeSemanticImage(value) {
  const url = new URL(value, SITE_ORIGIN);
  return url.origin === SITE_ORIGIN ? url.pathname : url.href;
}

function removeLinkSeparators($, root) {
  root
    .find('p')
    .contents()
    .each((_, node) => {
      if (node.type !== 'text' || !/^\s*\|\s*$/.test(node.data)) return;
      if (node.prev?.type === 'tag' && node.next?.type === 'tag') {
        $(node).remove();
      }
    });
}

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
    const block = SEMANTIC_BLOCKS.has(node.name);
    if (block) output += ' ';
    for (const child of node.children ?? []) visit(child);
    if (block) output += ' ';
  };
  for (const node of root.toArray()) visit(node);
  return normalizeText(output);
}

function extractArticleSemantic(html, path) {
  const $ = cheerio.load(html);
  const root = $('[data-article-prose]').first().clone();
  if (!root.length) throw new Error(`${path}: missing data-article-prose`);
  const fallbackNodes = root.find('[data-embed-fallback]');
  const embeds = root
    .find('figure[data-migrated-embed][data-embed-kind="spotify"]')
    .map((_, node) => {
      const figure = $(node);
      const iframe = figure.find('iframe').first();
      const fallback = figure.find('[data-embed-fallback] a').first();
      return {
        src: iframe.attr('src') ?? '',
        title: iframe.attr('title') ?? '',
        loading: iframe.attr('loading') ?? '',
        fallbackHref: fallback.attr('href') ?? '',
        fallbackText: normalizeText(fallback.text()),
      };
    })
    .get();
  fallbackNodes.remove();
  removeLinkSeparators($, root);
  return {
    headings: root
      .find('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]')
      .map((_, node) => ({
        level: Number(node.tagName.slice(1)),
        text: normalizeText($(node).text()),
        id: $(node).attr('id'),
      }))
      .get(),
    text: semanticText(root),
    links: root
      .find('a[href]')
      .map((_, node) => $(node).attr('href') ?? '')
      .get(),
    images: root
      .find('img[src]')
      .map((_, node) => normalizeSemanticImage($(node).attr('src') ?? ''))
      .get(),
    codeBlocks: root
      .find('pre code')
      .map((_, node) => `${$(node).text().replace(/\n$/, '')}\n`)
      .get(),
    iframeSources: root
      .find('iframe[src]')
      .map((_, node) => $(node).attr('src') ?? '')
      .get(),
    embeds,
  };
}

function expectedArticleSemantic(fixture, allowances, errors, path) {
  const semantic = {
    headings: fixture.headings,
    text: fixture.text,
    links: fixture.links,
    images: fixture.images.map(normalizeSemanticImage),
    codeBlocks: fixture.codeBlocks,
    iframeSources: fixture.iframeSources,
  };
  return transformArticleSemantics(
    semantic,
    allowances.map(({ id }) => id),
    allowances,
    (_field, expected, actual, message) =>
      errors.push(
        `${path}: ${message}; expected ${expected}, received ${actual}`,
      ),
  );
}

function deepEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function validateArticleSemantics(distRoot, errors) {
  const [fixtures, allowanceValue] = await Promise.all([
    readFile(
      new URL('../tests/fixtures/legacy-pages.json', import.meta.url),
      'utf8',
    ).then(JSON.parse),
    readFile(
      new URL('../tests/fixtures/migration-allowances.json', import.meta.url),
      'utf8',
    ).then(JSON.parse),
  ]);
  const allowances = validateMigrationAllowances(allowanceValue);
  for (const fixture of fixtures) {
    const path = new URL(fixture.url).pathname;
    const html = await readFile(join(distRoot, outputPathFor(path)), 'utf8');
    const actual = extractArticleSemantic(html, path);
    const pathAllowances = allowances.filter(
      (allowance) => allowance.path === path,
    );
    const expected = expectedArticleSemantic(
      fixture,
      pathAllowances,
      errors,
      path,
    );
    for (const field of Object.keys(expected)) {
      if (!deepEqual(actual[field], expected[field])) {
        errors.push(`${path}: migrated ${field} differs outside allowances`);
      }
    }
    const spotify = pathAllowances.find(
      ({ operation }) => operation === 'embed-with-fallback',
    );
    if (spotify) {
      if (actual.embeds.length !== spotify.expectedOccurrences) {
        errors.push(
          `${path}: expected exactly ${spotify.expectedOccurrences} marked Spotify embeds`,
        );
      }
      for (const embed of actual.embeds) {
        if (
          !embed.title ||
          embed.loading !== 'lazy' ||
          embed.fallbackHref !== embed.src ||
          embed.fallbackText !== `Open ${embed.title}`
        ) {
          errors.push(`${path}: invalid marked Spotify fallback contract`);
        }
      }
    } else if (actual.embeds.length) {
      errors.push(`${path}: unexpected marked Spotify embed`);
    }
  }
}

function validateMetadata($, contract, errors) {
  const prefix = contract.path;
  if (contract.h1Count !== 1) errors.push(`${prefix}: expected one h1`);
  if (contract.canonicalCount !== 1)
    errors.push(`${prefix}: expected one canonical`);
  if (contract.titleCount !== 1 || !contract.title)
    errors.push(`${prefix}: expected one nonempty title`);
  if (contract.descriptionCount !== 1 || !contract.description)
    errors.push(`${prefix}: expected one nonempty description`);
  for (const property of HTML_METADATA_FIELDS) {
    if ($(`head > meta[property="${property}"]`).length !== 1) {
      errors.push(`${prefix}: expected one ${property}`);
    }
  }
}

async function validatePictures($, pagePath, distRoot, errors) {
  const pictures = $('[data-article-prose] figure.article-figure picture');
  for (const picture of pictures.toArray()) {
    const root = $(picture);
    const image = root.find('img').first();
    const width = Number(image.attr('width'));
    const height = Number(image.attr('height'));
    if (!(width > 0 && height > 0))
      errors.push(`${pagePath}: article picture lacks intrinsic dimensions`);
    if (!(image.attr('src') ?? '').startsWith('/images/'))
      errors.push(`${pagePath}: article picture lacks /images/ fallback`);
    for (const mediaType of ['image/avif', 'image/webp']) {
      const source = root.find(`source[type="${mediaType}"]`).first();
      const sizes = source.attr('sizes') ?? '';
      const entries = (source.attr('srcset') ?? '')
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
      if (!entries.length || sizes !== ARTICLE_IMAGE_SIZES) {
        errors.push(`${pagePath}: invalid responsive sizes for ${mediaType}`);
      }
      const candidates = entries.map((entry) => {
        const match = /^(\S+)\s+([1-9]\d*)w$/.exec(entry);
        return {
          url: entry.split(/\s+/)[0],
          width: match ? Number(match[2]) : null,
        };
      });
      const widths = candidates.map(({ width }) => width);
      if (
        widths.some((candidateWidth) => candidateWidth === null) ||
        widths.some(
          (candidateWidth, index) =>
            candidateWidth !== null &&
            (candidateWidth > width ||
              (index > 0 && candidateWidth <= (widths[index - 1] ?? 0))),
        )
      ) {
        errors.push(
          `${pagePath}: invalid responsive descriptor for ${mediaType}`,
        );
      }
      for (const candidate of candidates) {
        const url = normalizedLocalUrl(candidate.url, pagePath);
        if (
          !url?.pathname.startsWith('/_astro/') ||
          !(await pathExists(join(distRoot, outputPathFor(url.pathname))))
        ) {
          errors.push(
            `${pagePath}: unresolved ${mediaType} derivative ${candidate.url}`,
          );
        }
      }
    }
  }
}

async function loadDiscoveryRecords() {
  const paths = await fg('src/content/**/*.{md,mdx}', {
    cwd: repositoryRoot,
    absolute: true,
  });
  return Promise.all(
    paths.map(async (path) => ({
      ...matter(await readFile(path, 'utf8')).data,
      collection: path.includes('/src/content/blog/') ? 'blog' : 'other',
    })),
  );
}

async function validateDiscovery(distRoot, routes, errors) {
  const records = await loadDiscoveryRecords();
  const feed = await readFile(join(distRoot, 'feed.xml'), 'utf8');
  const feedDocument = cheerio.load(feed, { xmlMode: true });
  const items = feedDocument('channel > item');
  if (items.length !== 10) errors.push('feed.xml: expected exactly 10 items');
  const expectedFeed = records
    .filter(({ collection, draft }) => collection === 'blog' && !draft)
    .toSorted(
      (left, right) =>
        new Date(right.originalTimestamp ?? right.publishedAt).getTime() -
        new Date(left.originalTimestamp ?? left.publishedAt).getTime(),
    )
    .slice(0, 10);
  items.each((index, node) => {
    const item = feedDocument(node);
    const title = item.children('title').text();
    const link = item.children('link').text();
    const guid = item.children('guid').text();
    const pubDate = item.children('pubDate').text();
    const description = item.children('description').text();
    const content = item.children('content\\:encoded').text();
    const expected = expectedFeed[index];
    const expectedLink = expected
      ? new URL(expected.canonicalPath, SITE_ORIGIN).href
      : '';
    const expectedDate = expected
      ? new Date(
          expected.originalTimestamp ?? `${expected.publishedAt}T12:00:00Z`,
        ).toUTCString()
      : '';
    if (
      !expected ||
      title !== expected.title ||
      link !== expectedLink ||
      guid !== expectedLink ||
      pubDate !== expectedDate ||
      description !== expected.summary
    ) {
      errors.push(
        `feed.xml: post identity/title/order/date/description drift at item ${index + 1}`,
      );
    }
    if (
      !link.startsWith(`${SITE_ORIGIN}/`) ||
      guid !== link ||
      !content.includes('<p>')
    ) {
      errors.push(
        `feed.xml: invalid item contract for ${link || '(missing link)'}`,
      );
    }
    if (
      content.length <= description.length ||
      /(?:href|src)="\/(?!\/)/.test(content)
    ) {
      errors.push(`feed.xml: incomplete or relative full content for ${link}`);
    }
  });

  const sitemap = await readFile(join(distRoot, 'sitemap.xml'), 'utf8');
  const sitemapDocument = cheerio.load(sitemap, { xmlMode: true });
  const actual = sitemapDocument('urlset > url > loc')
    .map((_, node) => sitemapDocument(node).text())
    .get();
  const expected = routes
    .filter(({ inSitemap }) => inSitemap)
    .map(({ canonicalPath }) => new URL(canonicalPath, SITE_ORIGIN).href)
    .sort();
  if (!deepEqual(actual, expected))
    errors.push('sitemap.xml: route contract drift');
  const lastModifiedByPath = new Map(
    records.map((record) => [
      record.canonicalPath,
      record.updatedAt ??
        record.reviewedAt ??
        record.publishedAt ??
        RELEASE_DATE,
    ]),
  );
  for (const node of sitemapDocument('urlset > url').toArray()) {
    const item = sitemapDocument(node);
    const pagePath = new URL(item.children('loc').text()).pathname;
    const lastModified = item.children('lastmod').text();
    const expectedLastModified =
      lastModifiedByPath.get(pagePath) ?? RELEASE_DATE;
    if (lastModified !== expectedLastModified)
      errors.push(`sitemap.xml: lastmod drift for ${pagePath}`);
  }

  const robots = await readFile(join(distRoot, 'robots.txt'), 'utf8');
  if (
    robots !==
    'User-agent: *\nAllow: /\nSitemap: https://grantisom.com/sitemap.xml\n'
  ) {
    errors.push('robots.txt: policy drift');
  }
}

export async function assertDistContract(distDir, routes) {
  const distRoot = fileURLToPath(distDir);
  const errors = [];
  const assets = JSON.parse(
    await readFile(
      new URL('../tests/fixtures/legacy-assets.json', import.meta.url),
      'utf8',
    ),
  ).assets;

  for (const route of routes) {
    if (!(await pathExists(join(distRoot, route.outputPath)))) {
      errors.push(`${route.canonicalPath}: missing ${route.outputPath}`);
    }
  }
  for (const asset of assets) {
    const target = join(distRoot, asset.outputPath);
    if (!(await pathExists(target))) {
      errors.push(`${asset.path}: missing compatibility asset`);
    } else if ((await sha256File(pathToFileURL(target))) !== asset.sha256) {
      errors.push(`${asset.path}: compatibility checksum drift`);
    }
  }
  if (await pathExists(join(distRoot, 'projects/listwithme/index.html'))) {
    errors.push('/projects/listwithme/: forbidden duplicate route');
  }

  const htmlRoutes = routes.filter(({ outputPath }) =>
    outputPath.endsWith('.html'),
  );
  const titles = new Map();
  const descriptions = new Map();
  for (const route of htmlRoutes) {
    const target = pathToFileURL(join(distRoot, route.outputPath));
    if (!(await pathExists(fileURLToPath(target)))) continue;
    const html = await readFile(target, 'utf8');
    const $ = cheerio.load(html);
    const contract = await inspectHtml(target);
    contract.path = route.canonicalPath;
    validateMetadata($, contract, errors);
    if (titles.has(contract.title))
      errors.push(
        `${route.canonicalPath}: duplicate title with ${titles.get(contract.title)}`,
      );
    else titles.set(contract.title, route.canonicalPath);
    if (descriptions.has(contract.description))
      errors.push(
        `${route.canonicalPath}: duplicate description with ${descriptions.get(contract.description)}`,
      );
    else descriptions.set(contract.description, route.canonicalPath);
    for (const reference of contract.internalLinks) {
      if (!reference.resolves)
        errors.push(
          `${route.canonicalPath}: broken reference ${reference.value}`,
        );
    }
    for (const image of contract.localImages) {
      if (!image.resolves)
        errors.push(`${route.canonicalPath}: broken image ${image.value}`);
    }
    for (const node of $('link[href], script[src]').toArray()) {
      const value = $(node).attr('href') ?? $(node).attr('src') ?? '';
      const local = normalizedLocalUrl(value, route.canonicalPath);
      if (local && BLOCKED_LEGACY_RESOURCES.has(local.pathname)) {
        errors.push(`${route.canonicalPath}: loads dormant ${local.pathname}`);
      }
    }
    if (contract.hrefs.includes('#'))
      errors.push(`${route.canonicalPath}: rendered href="#"`);
    for (const image of $('img').toArray()) {
      const alt = $(image).attr('alt');
      if (alt === undefined)
        errors.push(`${route.canonicalPath}: img missing alt`);
      if (alt === '' && $(image).attr('data-decorative') !== 'true')
        errors.push(
          `${route.canonicalPath}: empty img alt lacks decorative marker`,
        );
    }
    await validatePictures($, route.canonicalPath, distRoot, errors);
  }

  await validateDiscovery(distRoot, routes, errors);
  await validateArticleSemantics(distRoot, errors);

  if (errors.length) {
    throw new Error(
      `Built-site validation failed (${errors.length}):\n${errors.join('\n')}`,
    );
  }
}

async function main() {
  const routes = JSON.parse(
    await readFile(
      new URL('../tests/fixtures/public-routes.json', import.meta.url),
      'utf8',
    ),
  ).routes;
  await assertDistContract(new URL('../dist/', import.meta.url), routes);
  console.log(
    `Validated ${routes.length} route artifacts, 24 compatibility assets, 23 blog pages, and all HTML contracts.`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
