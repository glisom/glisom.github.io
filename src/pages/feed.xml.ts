import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { SITE } from '../data/site';
import { comparePostsNewestFirst } from '../lib/content/date';
import { renderRssBody, type RssSourceFormat } from '../lib/discovery/rss';

function sourceFormatFromFilePath(
  filePath: string | undefined,
): RssSourceFormat {
  if (filePath?.endsWith('.mdx')) return 'mdx';
  if (filePath?.endsWith('.md')) return 'md';
  throw new Error(`Unsupported blog source format: ${filePath ?? '(missing)'}`);
}

export const GET: APIRoute = async (context) => {
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .toSorted(comparePostsNewestFirst)
    .slice(0, 10);

  return rss({
    title: `${SITE.name} — Blog`,
    description: SITE.description,
    site: context.site ?? new URL(SITE.origin),
    customData: '<language>en-us</language>',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.summary,
      pubDate: new Date(
        post.data.originalTimestamp ?? `${post.data.publishedAt}T12:00:00Z`,
      ),
      link: post.data.canonicalPath,
      content: renderRssBody(
        post.body ?? '',
        post.data.title,
        sourceFormatFromFilePath(post.filePath),
      ),
    })),
  });
};
