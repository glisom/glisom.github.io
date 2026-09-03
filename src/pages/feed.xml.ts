import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { SITE } from '../data/site';
import { comparePostsNewestFirst } from '../lib/content/date';
import { renderRssBody } from '../lib/discovery/rss';

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
      content: renderRssBody(post.body ?? '', post.data.title),
    })),
  });
};
