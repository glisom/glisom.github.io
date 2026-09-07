export function contentIdFromData(data: Record<string, unknown>): string {
  if (typeof data.slug !== 'string' || data.slug.trim() === '') {
    throw new Error(
      'Content entry requires a nonblank frontmatter slug before ID generation.',
    );
  }
  return data.slug;
}
