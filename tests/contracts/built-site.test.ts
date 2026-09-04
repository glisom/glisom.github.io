import { access } from 'node:fs/promises';
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
});
