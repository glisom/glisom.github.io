import { access, cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import routeFixture from '../fixtures/public-routes.json';
import {
  assertDistContract,
  inspectHtml,
  sha256File,
} from '../helpers/build-contract';
import type { RouteContract } from '../../src/types/content';

const repositoryRoot = new URL('../../', import.meta.url);
const dist = new URL('dist/', repositoryRoot);
const routeManifest = routeFixture.routes as RouteContract[];
const file = (path: string) => new URL(path, repositoryRoot);

async function exists(path: string): Promise<boolean> {
  try {
    await access(file(path));
    return true;
  } catch {
    return false;
  }
}

describe('built-site release contract', () => {
  it('catches missing routes, compatibility bytes, or broken rendered HTML', async () => {
    expect(routeManifest).toHaveLength(52);
    await expect(
      assertDistContract(dist, routeManifest),
    ).resolves.toBeUndefined();
    expect(await exists('dist/projects/listwithme/index.html')).toBe(false);
    expect(await sha256File(file('dist/uploads/2023/f159196842.png'))).toBe(
      await sha256File(file('dist/images/f159196842.png')),
    );

    const htmlRoutes = routeManifest.filter(({ outputPath }) =>
      outputPath.endsWith('.html'),
    );
    const allHtml = await Promise.all(
      htmlRoutes.map(({ outputPath }) =>
        inspectHtml(new URL(outputPath, dist)),
      ),
    );
    const renderedBlogPages = routeManifest.filter(
      ({ kind, outputPath }) => kind === 'post' && outputPath.endsWith('.html'),
    );
    const allInternalLinks = allHtml.flatMap(
      ({ internalLinks }) => internalLinks,
    );
    const allLocalImages = allHtml.flatMap(({ localImages }) => localImages);
    const allRenderedHrefs = allHtml.flatMap(({ hrefs }) => hrefs);

    expect(renderedBlogPages).toHaveLength(23);
    expect(allInternalLinks.every((link) => link.resolves)).toBe(true);
    expect(allLocalImages.every((image) => image.resolves)).toBe(true);
    expect(allHtml.every((page) => page.h1Count === 1)).toBe(true);
    expect(allHtml.every((page) => page.canonicalCount === 1)).toBe(true);
    expect(allRenderedHrefs).not.toContain('#');
  });

  it('rejects RSS identity drift and false sitemap modification dates', async () => {
    const temporary = await mkdtemp(join(tmpdir(), 'built-discovery-'));
    const candidate = join(temporary, 'dist');
    try {
      await cp(new URL('dist/', repositoryRoot), candidate, {
        recursive: true,
      });
      const feedPath = join(candidate, 'feed.xml');
      const originalFeed = await readFile(feedPath, 'utf8');
      await writeFile(
        feedPath,
        originalFeed.replace(
          '<title>Vampire:',
          '<title>Incorrect release identity:',
        ),
      );
      await expect(
        assertDistContract(pathToFileURL(`${candidate}/`), routeManifest),
      ).rejects.toThrow(/feed\.xml:.*(?:identity|title|order)/i);

      await writeFile(feedPath, originalFeed);
      const sitemapPath = join(candidate, 'sitemap.xml');
      const sitemap = await readFile(sitemapPath, 'utf8');
      await writeFile(
        sitemapPath,
        sitemap.replace(
          /<lastmod>[^<]+<\/lastmod>/,
          '<lastmod>1999-01-01</lastmod>',
        ),
      );
      await expect(
        assertDistContract(pathToFileURL(`${candidate}/`), routeManifest),
      ).rejects.toThrow(/sitemap\.xml:.*lastmod/i);
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  });

  it('rejects malformed responsive descriptors and unbounded sizes hints', async () => {
    const temporary = await mkdtemp(join(tmpdir(), 'built-images-'));
    const candidate = join(temporary, 'dist');
    try {
      await cp(new URL('dist/', repositoryRoot), candidate, {
        recursive: true,
      });
      const pagePath = join(candidate, '2020/09/28/next-chapter.html');
      const original = await readFile(pagePath, 'utf8');
      await writeFile(
        pagePath,
        original.replace(
          '(max-width: 820px) calc(100vw - 32px), (max-width: 1219px) min(720px, calc(100vw - 258px)), min(920px, calc(100vw - 314px)',
          '99999px',
        ),
      );
      await expect(
        assertDistContract(pathToFileURL(`${candidate}/`), routeManifest),
      ).rejects.toThrow(/responsive.*sizes|sizes.*responsive/i);

      await writeFile(pagePath, original.replace(/ 320w(?=,)/, ' 320q'));
      await expect(
        assertDistContract(pathToFileURL(`${candidate}/`), routeManifest),
      ).rejects.toThrow(/responsive.*descriptor|descriptor.*responsive/i);
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  });
});
