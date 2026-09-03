import { SITE } from '../../data/site';

export function resolveCanonicalUrl(
  canonicalPath: string,
  canonicalOverride?: string,
): string {
  return canonicalOverride ?? new URL(canonicalPath, SITE.origin).href;
}
