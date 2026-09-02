export function groupPostsByYear<T extends { data: { publishedAt: string } }>(
  posts: readonly T[],
): ReadonlyMap<string, readonly T[]> {
  const groups = new Map<string, T[]>();
  for (const post of posts) {
    const year = post.data.publishedAt.slice(0, 4);
    const bucket = groups.get(year) ?? [];
    bucket.push(post);
    groups.set(year, bucket);
  }
  return groups;
}
