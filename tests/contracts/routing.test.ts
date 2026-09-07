import { describe, expect, it } from 'vitest';
import {
  buildRouteManifest,
  canonicalPathToOutputPath,
} from '../../src/lib/content/routes';
import { blogSchema, projectSchema } from '../../src/lib/content/schema';
import type {
  BlogRecord,
  ContentGraph,
  ProjectRecord,
} from '../../src/types/content';

describe('canonicalPathToOutputPath', () => {
  it.each([
    ['/', 'index.html'],
    ['/projects/hermes-ios/', 'projects/hermes-ios/index.html'],
    ['/2020/05/23/mac_apps.html', '2020/05/23/mac_apps.html'],
    ['/feed.xml', 'feed.xml'],
    ['/404.html', '404.html'],
  ])('maps %s to %s', (canonicalPath, outputPath) => {
    expect(canonicalPathToOutputPath(canonicalPath)).toBe(outputPath);
  });
});

describe('buildRouteManifest', () => {
  const blog = (
    id: string,
    canonicalPath: string,
    draft = false,
    hasDetailPage = true,
  ): BlogRecord => ({
    collection: 'blog',
    id,
    data: blogSchema.parse({
      title: id,
      slug: id,
      canonicalPath,
      summary: `Summary for ${id}`,
      draft,
      hasDetailPage,
      featured: false,
      tags: [],
      links: [],
      relationships: [],
      publishedAt: '2026-09-01',
    }),
  });
  const project = (id: string, canonicalPath: string): ProjectRecord => ({
    collection: 'projects',
    id,
    data: projectSchema.parse({
      title: id,
      slug: id,
      canonicalPath,
      summary: `Summary for ${id}`,
      draft: false,
      hasDetailPage: true,
      featured: false,
      tags: [],
      links: [],
      relationships: [],
      ownership: 'made',
      status: 'Active',
      platform: 'Web',
    }),
  });

  it('includes permanent and generated content routes while filtering unavailable records', () => {
    const graph: ContentGraph = {
      blog: [
        blog('published-post', '/2026/09/01/published-post.html'),
        blog('draft-post', '/2026/09/01/draft-post.html', true),
        blog('listing-only', '/2026/09/01/listing-only.html', false, false),
      ],
      'app-library': [],
      projects: [project('route-project', '/projects/route-project/')],
      'skill-library': [],
      skills: [],
    };

    const manifest = buildRouteManifest(graph);

    expect(manifest).toContainEqual({
      canonicalPath: '/',
      outputPath: 'index.html',
      kind: 'page',
      inSitemap: true,
    });
    expect(manifest).toContainEqual({
      canonicalPath: '/feed.xml',
      outputPath: 'feed.xml',
      kind: 'utility',
      inSitemap: false,
    });
    expect(manifest).toContainEqual({
      canonicalPath: '/2026/09/01/published-post.html',
      outputPath: '2026/09/01/published-post.html',
      kind: 'post',
      inSitemap: true,
    });
    expect(manifest).toContainEqual({
      canonicalPath: '/projects/route-project/',
      outputPath: 'projects/route-project/index.html',
      kind: 'page',
      inSitemap: true,
    });
    expect(manifest.map(({ canonicalPath }) => canonicalPath)).not.toContain(
      '/2026/09/01/draft-post.html',
    );
    expect(manifest.map(({ canonicalPath }) => canonicalPath)).not.toContain(
      '/2026/09/01/listing-only.html',
    );
    expect(manifest.map(({ canonicalPath }) => canonicalPath)).toEqual([
      '/',
      '/2026/09/01/published-post.html',
      '/404.html',
      '/about/',
      '/app-library/',
      '/blog/',
      '/feed.xml',
      '/listwithme/privacy/',
      '/listwithme/support/',
      '/projects/',
      '/projects/route-project/',
      '/robots.txt',
      '/sitemap.xml',
      '/skill-library/',
      '/skills/',
    ]);
  });
});
