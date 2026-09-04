export function e2eNetworkPolicy(
  value: string,
  allowedOrigins: readonly string[],
): 'continue' | 'fulfill' | 'abort' {
  const url = new URL(value);
  const exactOrigins = new Set(
    allowedOrigins.map((origin) => new URL(origin).origin),
  );
  if (exactOrigins.has(url.origin)) return 'continue';
  if (['utteranc.es', 'open.spotify.com'].includes(url.hostname))
    return 'fulfill';
  return 'abort';
}
