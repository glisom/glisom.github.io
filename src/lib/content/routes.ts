import type { ContentGraph, RouteContract } from '../../types/content';

export function canonicalPathToOutputPath(path: string): string {
  if (path === '/') return 'index.html';
  const relative = path.slice(1);
  return path.endsWith('/') ? `${relative}index.html` : relative;
}

export function buildRouteManifest(
  graph: ContentGraph,
): readonly RouteContract[] {
  const records = Object.values(graph).flat();
  const contentRoutes = records
    .filter((record) => !record.data.draft && record.data.hasDetailPage)
    .map(
      (record) =>
        ({
          canonicalPath: record.data.canonicalPath,
          outputPath: canonicalPathToOutputPath(record.data.canonicalPath),
          kind: record.collection === 'blog' ? 'post' : 'page',
          inSitemap: true,
        }) satisfies RouteContract,
    );

  const permanentRoutes: RouteContract[] = [
    {
      canonicalPath: '/',
      outputPath: 'index.html',
      kind: 'page',
      inSitemap: true,
    },
    {
      canonicalPath: '/blog/',
      outputPath: 'blog/index.html',
      kind: 'page',
      inSitemap: true,
    },
    {
      canonicalPath: '/app-library/',
      outputPath: 'app-library/index.html',
      kind: 'page',
      inSitemap: true,
    },
    {
      canonicalPath: '/projects/',
      outputPath: 'projects/index.html',
      kind: 'page',
      inSitemap: true,
    },
    {
      canonicalPath: '/skill-library/',
      outputPath: 'skill-library/index.html',
      kind: 'page',
      inSitemap: true,
    },
    {
      canonicalPath: '/skills/',
      outputPath: 'skills/index.html',
      kind: 'page',
      inSitemap: true,
    },
    {
      canonicalPath: '/about/',
      outputPath: 'about/index.html',
      kind: 'page',
      inSitemap: true,
    },
    {
      canonicalPath: '/listwithme/support/',
      outputPath: 'listwithme/support/index.html',
      kind: 'utility',
      inSitemap: true,
    },
    {
      canonicalPath: '/listwithme/privacy/',
      outputPath: 'listwithme/privacy/index.html',
      kind: 'utility',
      inSitemap: true,
    },
    {
      canonicalPath: '/feed.xml',
      outputPath: 'feed.xml',
      kind: 'utility',
      inSitemap: false,
    },
    {
      canonicalPath: '/sitemap.xml',
      outputPath: 'sitemap.xml',
      kind: 'utility',
      inSitemap: false,
    },
    {
      canonicalPath: '/robots.txt',
      outputPath: 'robots.txt',
      kind: 'utility',
      inSitemap: false,
    },
    {
      canonicalPath: '/404.html',
      outputPath: '404.html',
      kind: 'utility',
      inSitemap: false,
    },
  ];

  return [...permanentRoutes, ...contentRoutes].toSorted((a, b) =>
    a.canonicalPath.localeCompare(b.canonicalPath),
  );
}
