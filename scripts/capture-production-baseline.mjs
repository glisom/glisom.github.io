import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

export function extractSemanticPage(html) {
  const $ = cheerio.load(html);
  const semanticRoot = $('.c-article__main').first().length
    ? $('.c-article__main').first()
    : $('.prose').first();
  return {
    title: $('h1').first().text().trim(),
    headings: semanticRoot
      .find('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]')
      .map((_, node) => ({
        level: Number(node.tagName.slice(1)),
        text: $(node).text().trim(),
        id: $(node).attr('id'),
      }))
      .get(),
    text: semanticRoot.text().replace(/\s+/g, ' ').trim(),
    links: semanticRoot
      .find('a[href]')
      .map((_, node) => $(node).attr('href'))
      .get(),
    images: semanticRoot
      .find('img[src]')
      .map((_, node) => $(node).attr('src'))
      .get(),
    codeBlocks: semanticRoot
      .find('pre code')
      .map((_, node) => $(node).text())
      .get(),
    iframeSources: semanticRoot
      .find('iframe[src]')
      .map((_, node) => $(node).attr('src'))
      .get(),
  };
}

export async function capturePage(url) {
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  const html = await response.text();
  const semantic = extractSemanticPage(html);
  return {
    url: url.href,
    status: response.status,
    ...semantic,
    semanticDigest: createHash('sha256')
      .update(JSON.stringify(semantic))
      .digest('hex'),
  };
}

async function captureProductionBaseline() {
  const routes = JSON.parse(
    await readFile(
      new URL('../tests/fixtures/public-routes.json', import.meta.url),
      'utf8',
    ),
  ).routes;
  const postPaths = routes
    .filter((route) => route.kind === 'post')
    .map((route) => route.canonicalPath);
  if (postPaths.length !== 23)
    throw new Error(`Expected 23 post routes, received ${postPaths.length}`);
  const pages = await Promise.all(
    postPaths.map((path) =>
      capturePage(new URL(path, 'https://grantisom.com')),
    ),
  );
  for (const page of pages) {
    if (page.status !== 200)
      throw new Error(
        `Expected ${page.url} to return 200, received ${page.status}`,
      );
  }
  pages.sort((left, right) => left.url.localeCompare(right.url));
  await writeFile(
    new URL('../tests/fixtures/legacy-pages.json', import.meta.url),
    `${JSON.stringify(pages, null, 2)}\n`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await captureProductionBaseline();
}

export { captureProductionBaseline };
