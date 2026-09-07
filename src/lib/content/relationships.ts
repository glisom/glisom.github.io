import type {
  AnySiteRecord,
  ContentGraph,
  PrimaryCollection,
  ResolvedRelationship,
  SiteRecord,
} from '../../types/content';
import { relationshipTargetIssueMessage } from './graph';

function findRecord<C extends PrimaryCollection>(
  graph: ContentGraph,
  collection: C,
  id: string,
): SiteRecord<C> | undefined {
  return graph[collection].find((record) => record.id === id);
}

export function resolveRelationships(
  source: AnySiteRecord,
  graph: ContentGraph,
): readonly ResolvedRelationship[] {
  return source.data.relationships.map((relationship) => {
    const target = findRecord(graph, relationship.collection, relationship.id);
    if (!target) {
      throw new Error(
        relationshipTargetIssueMessage(source, relationship, 'missing'),
      );
    }
    if (target.data.draft || !target.data.hasDetailPage) {
      throw new Error(
        relationshipTargetIssueMessage(source, relationship, 'unpublished'),
      );
    }
    return {
      ...relationship,
      title: target.data.title,
      summary: target.data.summary,
      canonicalPath: target.data.canonicalPath,
    };
  });
}
