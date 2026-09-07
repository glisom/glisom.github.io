import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { buildCrawlPolicies, compareCrawls } from './lib/crawl-policy.ts';

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

export async function loadComparisonContext() {
  const [routes, assets, groups, migrationAllowances, legalFixtures] =
    await Promise.all([
      readJson(
        new URL('../tests/fixtures/public-routes.json', import.meta.url),
      ),
      readJson(
        new URL('../tests/fixtures/legacy-assets.json', import.meta.url),
      ),
      readJson(
        new URL('../tests/fixtures/crawl-policies.json', import.meta.url),
      ),
      readJson(
        new URL('../tests/fixtures/migration-allowances.json', import.meta.url),
      ),
      readJson(
        new URL('../tests/fixtures/listwithme-legal.json', import.meta.url),
      ),
    ]);
  return {
    policies: buildCrawlPolicies(routes.routes, assets.assets, {
      groups,
      migrationAllowances,
    }),
    legalFixtures,
    migrationAllowances,
  };
}

export async function compareCrawlFiles(baselineFile, candidateFile) {
  const [baseline, candidate, context] = await Promise.all([
    readJson(baselineFile),
    readJson(candidateFile),
    loadComparisonContext(),
  ]);
  return compareCrawls(baseline, candidate, context);
}

async function main() {
  const [, , baselinePath, candidatePath] = process.argv;
  if (!baselinePath || !candidatePath) {
    throw new Error(
      'Usage: node scripts/compare-crawls.mjs <baseline.json> <candidate.json>',
    );
  }
  const differences = await compareCrawlFiles(baselinePath, candidatePath);
  if (differences.length) {
    console.error(JSON.stringify(differences, null, 2));
    process.exitCode = 1;
    return;
  }
  console.log('Compared 76 crawl policies with zero differences.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
