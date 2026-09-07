const LONG = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Chicago',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});
const SHORT = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Chicago',
  month: 'short',
  day: '2-digit',
});

export function formatPublicDate(
  isoDate: string,
  style: 'long' | 'short' = 'long',
): string {
  const date = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(date.getTime()))
    throw new Error(`Invalid public date: ${isoDate}`);
  return (style === 'long' ? LONG : SHORT).format(date);
}

export function comparePostsNewestFirst<
  T extends {
    data: {
      canonicalPath: string;
      publishedAt?: string;
      originalTimestamp?: string;
    };
  },
>(a: T, b: T): number {
  const aTime = String(a.data.originalTimestamp ?? a.data.publishedAt);
  const bTime = String(b.data.originalTimestamp ?? b.data.publishedAt);
  return (
    bTime.localeCompare(aTime) ||
    a.data.canonicalPath.localeCompare(b.data.canonicalPath)
  );
}
