export function e2eNetworkPolicy(
  value: string,
): 'continue' | 'fulfill' | 'abort' {
  const url = new URL(value);
  if (['localhost', '127.0.0.1'].includes(url.hostname)) return 'continue';
  if (['utteranc.es', 'open.spotify.com'].includes(url.hostname))
    return 'fulfill';
  return 'abort';
}
