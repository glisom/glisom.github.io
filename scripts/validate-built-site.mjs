import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as cheerio from 'cheerio';

const SITE_ORIGIN = 'https://grantisom.com';
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
const SPOTIFY_PATH = '/2020/02/10/2019-playlists.html';
const SPOTIFY_COUNT = 4;
const APP_STORE_URL = 'https://apps.apple.com/us/app/listwithme/id1224284271';
const NOTION_IMAGE_REPLACEMENTS = new Map([
  ['/uploads/2023/f159196842.png', '/images/f159196842.png'],
  ['/uploads/2023/fa6c5dfe53.png', '/images/fa6c5dfe53.png'],
  ['/uploads/2023/5fd90bfbf1.png', '/images/5fd90bfbf1.png'],
  ['/uploads/2023/6647450a28.png', '/images/6647450a28.png'],
]);

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
  const replaced = NOTION_IMAGE_REPLACEMENTS.get(url.pathname);
  return replaced ?? (url.origin === SITE_ORIGIN ? url.pathname : url.href);
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

function expectedArticleSemantic(fixture, path) {
  return {
    headings: fixture.headings.map((heading) => ({
      ...heading,
      level:
        (path === '/2018/11/27/playlists.html' ||
          path === '/2019/06/04/wwdc-day-1.html') &&
        heading.level === 1
          ? 2
          : heading.level,
    })),
    text: fixture.text,
    links: fixture.links.map((href) =>
      path === '/2026/02/24/listwithme-returns.html' && href === '#'
        ? APP_STORE_URL
        : href,
    ),
    images: fixture.images.map(normalizeSemanticImage),
    codeBlocks: fixture.codeBlocks,
    iframeSources: fixture.iframeSources,
  };
}

function deepEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function validateArticleSemantics(distRoot, errors) {
  const fixtures = JSON.parse(
    await readFile(
      new URL('../tests/fixtures/legacy-pages.json', import.meta.url),
      'utf8',
    ),
  );
  for (const fixture of fixtures) {
    const path = new URL(fixture.url).pathname;
    const html = await readFile(join(distRoot, outputPathFor(path)), 'utf8');
    const actual = extractArticleSemantic(html, path);
    const expected = expectedArticleSemantic(fixture, path);
    for (const field of Object.keys(expected)) {
      if (!deepEqual(actual[field], expected[field])) {
        errors.push(`${path}: migrated ${field} differs outside allowances`);
      }
    }
    if (path === SPOTIFY_PATH) {
      if (actual.embeds.length !== SPOTIFY_COUNT) {
        errors.push(`${path}: expected exactly four marked Spotify embeds`);
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
      const candidates = (source.attr('srcset') ?? '')
        .split(',')
        .map((entry) => entry.trim().split(/\s+/)[0])
        .filter(Boolean);
      if (!candidates.length || !sizes || sizes.trim() === '100vw') {
        errors.push(`${pagePath}: incomplete ${mediaType} responsive source`);
      }
      for (const candidate of candidates) {
        const url = normalizedLocalUrl(candidate, pagePath);
        if (
          !url?.pathname.startsWith('/_astro/') ||
          !(await pathExists(join(distRoot, outputPathFor(url.pathname))))
        ) {
          errors.push(
            `${pagePath}: unresolved ${mediaType} derivative ${candidate}`,
          );
        }
      }
    }
  }
}

async function validateDiscovery(distRoot, routes, errors) {
  const feed = await readFile(join(distRoot, 'feed.xml'), 'utf8');
  const feedDocument = cheerio.load(feed, { xmlMode: true });
  const items = feedDocument('channel > item');
  if (items.length !== 10) errors.push('feed.xml: expected exactly 10 items');
  items.each((_, node) => {
    const item = feedDocument(node);
    const link = item.children('link').text();
    const guid = item.children('guid').text();
    const description = item.children('description').text();
    const content = item.children('content\\:encoded').text();
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
  for (const node of sitemapDocument('urlset > url').toArray()) {
    if (!sitemapDocument(node).children('lastmod').text())
      errors.push('sitemap.xml: missing lastmod');
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
