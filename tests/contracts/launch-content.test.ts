import { describe, expect, it } from 'vitest';
import { loadSourceGraph } from '../../scripts/lib/source-graph';
import { contentIdFromData } from '../../src/lib/content/id';
import type {
  AnySiteRecord,
  ContentGraph,
  PrimaryCollection,
} from '../../src/types/content';

const NON_BLOG_COLLECTIONS = [
  'app-library',
  'projects',
  'skill-library',
  'skills',
] as const;

const ALLOWED_FIELD_NOTE_KEYS = {
  'app-library': [
    'workflow',
    'details-i-love',
    'friction-and-limits',
    'who-it-suits',
  ],
  projects: [
    'why-it-exists',
    'what-it-does',
    'how-it-was-built',
    'what-i-learned',
    'current-state',
  ],
  'skill-library': [
    'trigger',
    'inputs-and-outputs',
    'example',
    'guardrails',
    'source',
    'what-i-adapted',
  ],
  skills: [
    'when-to-use',
    'how-it-works',
    'example',
    'use-or-installation',
    'design-decisions',
  ],
} as const;

const ids = (records: readonly AnySiteRecord[]) => records.map(({ id }) => id);

function find(
  graph: ContentGraph,
  collection: PrimaryCollection,
  id: string,
): AnySiteRecord {
  const record = graph[collection].find((candidate) => candidate.id === id);
  if (!record) throw new Error(`Missing ${collection}/${id}`);
  return record as AnySiteRecord;
}

const allPaths = (graph: ContentGraph) =>
  Object.values(graph)
    .flat()
    .map((record) => record.data.canonicalPath);

describe('launch content', () => {
  it('loads the exact approved launch manifest in deterministic order', async () => {
    const graph = await loadSourceGraph();

    expect(ids(graph['app-library'])).toEqual([
      'obsidian',
      'codex',
      'hermes-agent',
      'superhuman',
    ]);
    expect(ids(graph.projects)).toEqual([
      'hermes-ios',
      'listwithme',
      'healthql',
      'drift-dreams',
    ]);
    expect(ids(graph['skill-library'])).toEqual([
      'deep-research',
      'browser-control',
      'frontend-design',
      'documents',
      'pdf',
    ]);
    expect(ids(graph.skills)).toEqual([
      'write-like-grant',
      'goodreads-export',
      'hatch-pet',
    ]);
    expect(find(graph, 'projects', 'listwithme').data.canonicalPath).toBe(
      '/listwithme/',
    );
    expect(allPaths(graph)).not.toContain('/projects/listwithme/');
    expect(
      find(graph, 'projects', 'listwithme').data.links.find(
        (link) => link.kind === 'primary',
      )?.href,
    ).toBe('https://apps.apple.com/us/app/listwithme/id1224284271');
    expect(
      graph.skills
        .flatMap((record) => record.data.links)
        .some((link) => link.kind === 'install'),
    ).toBe(false);
    expect(
      graph.skills
        .filter((record) => record.data.visibility === 'private')
        .every((record) => record.data.links.length === 0),
    ).toBe(true);

    for (const collection of NON_BLOG_COLLECTIONS) {
      const allowedKeys: readonly string[] =
        ALLOWED_FIELD_NOTE_KEYS[collection];
      for (const record of graph[collection].filter(
        ({ data }) => data.hasDetailPage,
      )) {
        const actual = record.data.fieldNotes.map(({ key }) => key);
        expect(
          new Set(actual).size,
          `${collection}/${record.id}: duplicate field-note key`,
        ).toBe(actual.length);
        expect(
          actual.length,
          `${collection}/${record.id}: sparse-detail minimum`,
        ).toBeGreaterThanOrEqual(2);
        expect(
          actual.every((key) => allowedKeys.includes(key)),
          `${collection}/${record.id}: approved variant keys`,
        ).toBe(true);
      }
    }

    for (const record of Object.values(graph).flat()) {
      expect(record.id, `${record.collection}/${record.id}: shared ID`).toBe(
        contentIdFromData(record.data),
      );
    }
  });

  it('treats bundle placeholders in the real Accessibility Testing code block as code', async () => {
    const graph = await loadSourceGraph();
    const post = find(graph, 'blog', 'accessibility-testing-in');

    expect(post.body).toContain('appId: <your_bundle_id>');
  });
});
