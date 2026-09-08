import { describe, expect, it } from 'vitest';
import { loadSourceGraph } from '../../scripts/lib/source-graph';
import { recordDestination } from '../../src/lib/content/destination';
import { buildRouteManifest } from '../../src/lib/content/routes';

describe('direct catalog destinations', () => {
  it('does not generate individual catalog pages', async () => {
    const graph = await loadSourceGraph();
    const routes = buildRouteManifest(graph).map(
      (route) => route.canonicalPath,
    );
    expect(
      routes.filter((path) =>
        /^\/(app-library|skills|skill-library|projects)\/[^/]+\/$/.test(path),
      ),
    ).toEqual([]);
    expect(routes).toContain('/listwithme/');
    expect(routes).toContain('/listwithme/support/');
    expect(routes).toContain('/listwithme/privacy/');
  });

  it('links public catalog entries externally and keeps private skills unlinked', async () => {
    const graph = await loadSourceGraph();
    for (const collection of [
      'app-library',
      'projects',
      'skill-library',
      'skills',
    ] as const) {
      for (const record of graph[collection]) {
        const destination = recordDestination(record);
        if (
          record.collection === 'skills' &&
          record.data.visibility === 'private'
        ) {
          expect(destination, record.id).toBeUndefined();
        } else if (record.data.links.length) {
          expect(destination, record.id).toMatch(/^https:\/\//);
        }
      }
    }
    expect(
      recordDestination(
        graph.projects.find((record) => record.id === 'hermes-ios')!,
      ),
    ).toBe('https://github.com/glisom/hermes-ios');
    expect(
      recordDestination(
        graph.skills.find((record) => record.id === 'skill-thief')!,
      ),
    ).toBe('https://github.com/glisom/skill-thief');
  });
});
