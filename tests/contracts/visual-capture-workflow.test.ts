import { createServer } from 'node:http';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { expect, test } from 'vitest';
import {
  assertCapturePortsAvailable,
  assertServedReferenceFingerprint,
  comparisonCaptureEnvironment,
} from '../../scripts/lib/visual-capture.mjs';

test('comparison capture clears inherited preview state and forces fresh servers', () => {
  const environment = comparisonCaptureEnvironment({
    PREVIEW_ORIGIN: 'http://127.0.0.1:9999',
    CI: '',
    SENTINEL: 'preserved',
  });
  expect(environment).toMatchObject({
    CAPTURE_COMPARISONS: '1',
    CI: '1',
    SENTINEL: 'preserved',
  });
  expect(environment).not.toHaveProperty('PREVIEW_ORIGIN');
});

test('comparison capture rejects an occupied local server port', async () => {
  const server = createServer((_request, response) => response.end('busy'));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No port');
  try {
    await expect(
      assertCapturePortsAvailable([{ host: '127.0.0.1', port: address.port }]),
    ).rejects.toThrow(/occupied.*127\.0\.0\.1.*port/i);
  } finally {
    server.close();
    await once(server, 'close');
  }
});

test('served reference bytes must match the frozen-source fingerprint', async () => {
  let bytes = await readFile(
    new URL(
      '../../docs/design/mockups/article-family-approved.html',
      import.meta.url,
    ),
  );
  const server = createServer((_request, response) => response.end(bytes));
  server.listen(4174, '127.0.0.1');
  await once(server, 'listening');
  try {
    await expect(
      assertServedReferenceFingerprint(
        'http://127.0.0.1:4174/article-family-approved.html',
      ),
    ).resolves.toBeUndefined();
    bytes = Buffer.from('stale reference bytes');
    await expect(
      assertServedReferenceFingerprint(
        'http://127.0.0.1:4174/article-family-approved.html',
      ),
    ).rejects.toThrow(/served reference fingerprint/i);
  } finally {
    server.close();
    await once(server, 'close');
  }
});

test('homepage proof accepts exact frozen source bytes and rejects stale served source', async () => {
  const [app, main, styles] = await Promise.all(
    ['App.jsx', 'main.jsx', 'styles.css'].map((name) =>
      readFile(
        new URL(
          `../../design-reference/vite-homepage/src/${name}`,
          import.meta.url,
        ),
        'utf8',
      ),
    ),
  );
  let stale = false;
  const server = createServer((request, response) => {
    if (stale) {
      response.end('stale Vite source');
      return;
    }
    const sources = new Map([
      ['/src/App.jsx?raw', `export default ${JSON.stringify(app)}`],
      ['/src/main.jsx?raw', main],
      ['/src/styles.css?raw', `export default ${JSON.stringify(styles)}`],
    ]);
    response.end(sources.get(request.url ?? '') ?? 'not found');
  });
  server.listen(4173, '127.0.0.1');
  await once(server, 'listening');
  try {
    await expect(
      assertServedReferenceFingerprint('http://127.0.0.1:4173/#top'),
    ).resolves.toBeUndefined();
    stale = true;
    await expect(
      assertServedReferenceFingerprint('http://127.0.0.1:4173/#top'),
    ).rejects.toThrow(/served reference fingerprint/i);
  } finally {
    server.close();
    await once(server, 'close');
  }
});

test('comparison mode disables Playwright server reuse', async () => {
  const previousCapture = process.env.CAPTURE_COMPARISONS;
  const previousCi = process.env.CI;
  const previousPreview = process.env.PREVIEW_ORIGIN;
  process.env.CAPTURE_COMPARISONS = '1';
  delete process.env.CI;
  delete process.env.PREVIEW_ORIGIN;
  try {
    const config = (await import('../../playwright.config.ts')).default;
    const configuredServers = config.webServer;
    expect(configuredServers).toBeDefined();
    const servers = Array.isArray(configuredServers)
      ? configuredServers
      : configuredServers
        ? [configuredServers]
        : [];
    expect(servers).toHaveLength(3);
    expect(
      servers.every((server) => server.reuseExistingServer === false),
    ).toBe(true);
  } finally {
    if (previousCapture === undefined) delete process.env.CAPTURE_COMPARISONS;
    else process.env.CAPTURE_COMPARISONS = previousCapture;
    if (previousCi === undefined) delete process.env.CI;
    else process.env.CI = previousCi;
    if (previousPreview === undefined) delete process.env.PREVIEW_ORIGIN;
    else process.env.PREVIEW_ORIGIN = previousPreview;
  }
});
