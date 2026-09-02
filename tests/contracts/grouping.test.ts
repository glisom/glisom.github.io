import { describe, expect, it } from 'vitest';
import { groupPostsByYear } from '../../src/lib/content/grouping';

describe('blog year grouping', () => {
  it('preserves input order within first-seen year buckets', () => {
    const post = (id: string, publishedAt: string) => ({
      collection: 'blog',
      id,
      data: {
        canonicalPath: `/${publishedAt.replaceAll('-', '/')}/${id}.html`,
        publishedAt,
      },
    });
    const grouped = groupPostsByYear([
      post('newest', '2026-09-01'),
      post('older-same-year', '2026-02-24'),
      post('previous-year', '2023-07-19'),
    ]);
    expect([...grouped.keys()]).toEqual(['2026', '2023']);
    expect(grouped.get('2026')?.map(({ id }) => id)).toEqual([
      'newest',
      'older-same-year',
    ]);
  });
});
