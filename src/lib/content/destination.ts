import type { SiteRecord, PrimaryCollection } from '../../types/content';

/** Catalog entries open the product or source; articles stay on this site. */
export function recordDestination(
  record: SiteRecord<PrimaryCollection>,
): string | undefined {
  if (record.data.draft) return undefined;
  if (record.collection === 'blog')
    return record.data.hasDetailPage ? record.data.canonicalPath : undefined;
  if (
    record.collection === 'skills' &&
    (!('visibility' in record.data) || record.data.visibility !== 'public')
  )
    return undefined;
  return (
    record.data.links.find(
      (link) => link.kind === 'primary' && link.href.startsWith('https://'),
    )?.href ??
    record.data.links.find(
      (link) =>
        ['source', 'install', 'secondary'].includes(link.kind) &&
        link.href.startsWith('https://'),
    )?.href
  );
}
