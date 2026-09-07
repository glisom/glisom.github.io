import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { assertValidContentGraph } from '../src/lib/content/graph';
import { buildRouteManifest } from '../src/lib/content/routes';
import type { RouteContract } from '../src/types/content';
import { loadSourceGraph } from './lib/source-graph';

const EXPECTED_COUNTS = {
  blog: 23,
  'app-library': 4,
  projects: 4,
  'skill-library': 5,
  skills: 3,
} as const;

interface RouteOracle {
  routes: RouteContract[];
}

export async function validateSource(): Promise<void> {
  const graph = await loadSourceGraph();
  assertValidContentGraph(graph);

  for (const [collection, expected] of Object.entries(EXPECTED_COUNTS)) {
    const actual = graph[collection as keyof typeof EXPECTED_COUNTS].length;
    assert.equal(
      actual,
      expected,
      `${collection} must contain ${expected} launch records; received ${actual}`,
    );
  }

  const oracle = JSON.parse(
    await readFile(
      new URL('../tests/fixtures/public-routes.json', import.meta.url),
      'utf8',
    ),
  ) as RouteOracle;
  const byCanonicalPath = (left: RouteContract, right: RouteContract) =>
    left.canonicalPath.localeCompare(right.canonicalPath);
  const actualRoutes = buildRouteManifest(graph)
    .map(({ canonicalPath, outputPath, kind, inSitemap }) => ({
      canonicalPath,
      outputPath,
      kind,
      inSitemap,
    }))
    .toSorted(byCanonicalPath);
  const expectedRoutes = oracle.routes
    .map(({ canonicalPath, outputPath, kind, inSitemap }) => ({
      canonicalPath,
      outputPath,
      kind,
      inSitemap,
    }))
    .toSorted(byCanonicalPath);

  assert.deepEqual(
    actualRoutes,
    expectedRoutes,
    'Generated route manifest must match the independent public route oracle.',
  );

  console.log(
    `Validated source counts ${Object.values(EXPECTED_COUNTS).join('/')} and ${actualRoutes.length} routes.`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await validateSource();
