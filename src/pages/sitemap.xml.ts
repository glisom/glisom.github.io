import type { APIRoute } from 'astro';
import { SITE } from '../data/site';
import { loadContentGraph } from '../lib/content/load';
import { buildRouteManifest } from '../lib/content/routes';
import { escapeXml } from '../lib/discovery/xml';

const RELEASE_DATE = '2026-09-02';

export const GET: APIRoute = async () => {
  const graph = await loadContentGraph();
  const lastModifiedByPath = new Map(
    Object.values(graph)
      .flat()
      .map((record) => [
        record.data.canonicalPath,
        record.data.updatedAt ??
          record.data.reviewedAt ??
          record.data.publishedAt ??
          RELEASE_DATE,
      ]),
  );
  const routes = buildRouteManifest(graph)
    .filter((route) => route.inSitemap)
    .toSorted((a, b) => a.canonicalPath.localeCompare(b.canonicalPath));
  const entries = routes
    .map((route) => {
      const location = new URL(route.canonicalPath, SITE.origin).href;
      const lastModified =
        lastModifiedByPath.get(route.canonicalPath) ?? RELEASE_DATE;
      return [
        '  <url>',
        `    <loc>${escapeXml(location)}</loc>`,
        `    <lastmod>${escapeXml(lastModified)}</lastmod>`,
        '  </url>',
      ].join('\n');
    })
    .join('\n');
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries,
    '</urlset>',
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
