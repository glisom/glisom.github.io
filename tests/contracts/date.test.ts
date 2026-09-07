import { describe, expect, it } from 'vitest';
import {
  comparePostsNewestFirst,
  formatPublicDate,
} from '../../src/lib/content/date';

describe('public dates', () => {
  it('never shifts the authored calendar day across Chicago time', () => {
    expect(formatPublicDate('2026-02-24', 'long')).toBe('February 24, 2026');
    expect(formatPublicDate('2026-09-01', 'short')).toBe('Sep 01');
  });

  it('sorts equal public dates by timestamp, then canonical path', () => {
    const record = (canonicalPath: string, originalTimestamp?: string) => ({
      collection: 'blog' as const,
      id: canonicalPath,
      data: {
        title: canonicalPath,
        slug: canonicalPath,
        canonicalPath,
        summary: canonicalPath,
        draft: false,
        hasDetailPage: true,
        featured: false,
        tags: [],
        links: [],
        relationships: [],
        publishedAt: '2026-09-01',
        originalTimestamp,
      },
    });
    const posts = [
      record('/2026/09/01/zeta.html', '2026-09-01T08:00:00.000Z'),
      record('/2026/09/01/alpha.html', '2026-09-01T10:00:00.000Z'),
      record('/2026/09/01/beta.html', '2026-09-01T10:00:00.000Z'),
    ].toSorted(comparePostsNewestFirst);
    expect(posts.map((post) => post.data.canonicalPath)).toEqual([
      '/2026/09/01/alpha.html',
      '/2026/09/01/beta.html',
      '/2026/09/01/zeta.html',
    ]);
  });
});
