import type { DetailPageProps, NonBlogRecord } from '../../types/content';

export function buildDetailPageProps<T extends NonBlogRecord>(
  records: readonly T[],
  collectionLabel: string,
  record: T,
): DetailPageProps {
  const currentIndex = records.findIndex(
    (candidate) =>
      candidate.collection === record.collection && candidate.id === record.id,
  );
  if (currentIndex === -1) {
    throw new Error(
      `${record.collection}/${record.id} is not present in the published detail sequence.`,
    );
  }

  const next = records[currentIndex + 1];
  return {
    record,
    collectionLabel,
    recordNumber: currentIndex + 1,
    recordCount: records.length,
    nextRecord: next
      ? {
          title: next.data.title,
          canonicalPath: next.data.canonicalPath,
        }
      : null,
  };
}
