import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { readFile } from 'node:fs/promises';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { crawlSite } from './crawl-site.mjs';
import { loadComparisonContext } from './compare-crawls.mjs';
import { compareCrawls } from './lib/crawl-policy.ts';
import { mkdir, writeFile } from 'node:fs/promises';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const crawlDirectory = new URL('../docs/qa/crawls/', import.meta.url);

async function availablePort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('No preview port');
  const { port } = address;
  server.close();
  await once(server, 'close');
  return port;
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repositoryRoot,
      env: process.env,
      stdio: 'inherit',
    });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) resolve(undefined);
      else reject(new Error(`${command} exited ${code ?? signal}`));
    });
  });
}

async function waitForPreview(origin, child) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`Astro preview exited early with ${child.exitCode}`);
    }
    try {
      const response = await fetch(origin, {
        signal: AbortSignal.timeout(500),
      });
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Astro preview did not become ready at ${origin}`);
}

async function stop(child) {
  if (child.exitCode !== null) return;
  process.kill(-child.pid, 'SIGTERM');
  await Promise.race([
    once(child, 'exit'),
    new Promise((resolve) => setTimeout(resolve, 3_000)),
  ]);
  if (child.exitCode === null) {
    process.kill(-child.pid, 'SIGKILL');
    await once(child, 'exit');
  }
}

async function fixturePaths() {
  const [routes, assets] = await Promise.all([
    readFile(
      new URL('../tests/fixtures/public-routes.json', import.meta.url),
      'utf8',
    ).then(JSON.parse),
    readFile(
      new URL('../tests/fixtures/legacy-assets.json', import.meta.url),
      'utf8',
    ).then(JSON.parse),
  ]);
  return [
    ...routes.routes.map(({ canonicalPath }) => canonicalPath),
    ...assets.assets.map(({ path }) => path),
  ];
}

async function main() {
  await run('npm', ['run', 'build']);
  const port = await availablePort();
  const origin = new URL(`http://127.0.0.1:${port}`);
  const preview = spawn(
    'npm',
    ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(port)],
    {
      cwd: repositoryRoot,
      env: { ...process.env, ASTRO_PREVIEW_BACKGROUND: '0' },
      stdio: 'inherit',
      detached: true,
    },
  );
  try {
    await waitForPreview(origin, preview);
    const paths = await fixturePaths();
    const [baseline, candidate, context] = await Promise.all([
      crawlSite(new URL('https://grantisom.com'), paths),
      crawlSite(origin, paths),
      loadComparisonContext(),
    ]);
    await mkdir(crawlDirectory, { recursive: true });
    await Promise.all([
      writeFile(
        new URL('production-before.json', crawlDirectory),
        `${JSON.stringify(baseline, null, 2)}\n`,
      ),
      writeFile(
        new URL('astro-preview.json', crawlDirectory),
        `${JSON.stringify(candidate, null, 2)}\n`,
      ),
    ]);
    const differences = compareCrawls(baseline, candidate, context);
    if (differences.length) {
      console.error(JSON.stringify(differences, null, 2));
      throw new Error(
        `Crawl comparison found ${differences.length} difference(s)`,
      );
    }
    console.log(
      'Fresh production and built-preview crawls satisfy all 76 policies.',
    );
  } finally {
    await stop(preview);
  }
}

await main();
