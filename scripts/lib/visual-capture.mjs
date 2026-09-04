import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { runInNewContext } from 'node:vm';

const captureEndpoints = [
  { host: '127.0.0.1', port: 4321 },
  { host: '127.0.0.1', port: 4173 },
  { host: '127.0.0.1', port: 4174 },
];

const referenceProofs = new Map([
  [
    'http://127.0.0.1:4173/',
    [
      {
        url: 'http://127.0.0.1:4173/src/App.jsx?raw',
        sha256:
          'b4f5db54c201bed782110fca82f999d905250e8c8ae1be92e0df917ba5c79c3f',
        viteRawModule: true,
      },
      {
        url: 'http://127.0.0.1:4173/src/main.jsx?raw',
        sha256:
          '832f752c6b6a454a26dbc4f2654f5bd633f2b103516c8c0abac648308c133a7e',
      },
      {
        url: 'http://127.0.0.1:4173/src/styles.css?raw',
        sha256:
          'b7befee81f1df7c5bcd1dce2250ba48c7f5a7f534e139e2cb48006e09cff6ce3',
        viteRawModule: true,
      },
    ],
  ],
  [
    'http://127.0.0.1:4174/article-family-approved.html',
    [
      {
        url: 'http://127.0.0.1:4174/article-family-approved.html',
        sha256:
          'efa474e3b08488a09efd617e15c99bb7ac1a156ea858068ffb35ee325296117e',
      },
    ],
  ],
  [
    'http://127.0.0.1:4174/index-family-approved.html',
    [
      {
        url: 'http://127.0.0.1:4174/index-family-approved.html',
        sha256:
          '0a7c45a605b562873215f5e129152fe5031b0d3fdeb06cef5d9d9f405b70b363',
      },
    ],
  ],
  [
    'http://127.0.0.1:4174/detail-family-approved.html',
    [
      {
        url: 'http://127.0.0.1:4174/detail-family-approved.html',
        sha256:
          '60b6a3a27166f70d035cf37ccb7c0c2541e7057273a1df178698ea0b038e75ec',
      },
    ],
  ],
]);

export function comparisonCaptureEnvironment(environment = process.env) {
  const { PREVIEW_ORIGIN: _previewOrigin, ...inherited } = environment;
  return {
    ...Object.fromEntries(
      Object.entries(inherited).filter(([, value]) => value !== undefined),
    ),
    CAPTURE_COMPARISONS: '1',
    CI: '1',
  };
}

function reserve(endpoint) {
  return new Promise((resolve, reject) => {
    const server = createServer();
    const onError = (error) => {
      reject(
        new Error(
          `Visual capture port occupied at ${endpoint.host} port ${endpoint.port}: ${error.code ?? error.message}`,
          { cause: error },
        ),
      );
    };
    server.once('error', onError);
    server.listen(endpoint.port, endpoint.host, () => {
      server.off('error', onError);
      resolve(server);
    });
  });
}

export async function assertCapturePortsAvailable(
  endpoints = captureEndpoints,
) {
  const reservations = [];
  try {
    for (const endpoint of endpoints) {
      reservations.push(await reserve(endpoint));
    }
  } finally {
    await Promise.all(
      reservations.map(
        (server) => new Promise((resolve) => server.close(resolve)),
      ),
    );
  }
}

export async function assertServedReferenceFingerprint(sourceUrl) {
  const key = new URL(sourceUrl);
  key.hash = '';
  const proofs = referenceProofs.get(key.href);
  if (!proofs) throw new Error(`No frozen-source fingerprint for ${key.href}`);
  for (const proof of proofs) {
    const response = await fetch(proof.url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(
        `Served reference fingerprint request failed for ${proof.url}: ${response.status}`,
      );
    }
    let bytes = Buffer.from(await response.arrayBuffer());
    if (proof.viteRawModule) {
      const moduleText = bytes.toString('utf8').trim();
      if (!moduleText.startsWith('export default ')) {
        throw new Error(
          `Served reference fingerprint invalid Vite raw module for ${proof.url}`,
        );
      }
      const expression = moduleText
        .slice('export default '.length)
        .replace(/;$/, '');
      const source = runInNewContext(expression, Object.create(null), {
        timeout: 100,
      });
      if (typeof source !== 'string') {
        throw new Error(
          `Served reference fingerprint invalid Vite source for ${proof.url}`,
        );
      }
      bytes = Buffer.from(source);
    }
    const actual = createHash('sha256').update(bytes).digest('hex');
    if (actual !== proof.sha256) {
      throw new Error(
        `Served reference fingerprint mismatch for ${proof.url}: expected ${proof.sha256}, received ${actual}`,
      );
    }
  }
}
