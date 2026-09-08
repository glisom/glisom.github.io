import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { crawlSite } from '../../scripts/crawl-site.mjs';

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));
const hashScript = resolve(repositoryRoot, 'scripts/hash-dist.mjs');
const verifierScript = resolve(
  repositoryRoot,
  'scripts/verify-isolated-preview.mjs',
);
const reviewedSha = '0123456789abcdef0123456789abcdef01234567';
const previewOrigin = 'https://isolated-preview.test';
const fixtureFiles = [
  {
    relativePath: 'index.html',
    sha256: '4ea140588150773ce3aace786aeef7f4049ce100fa649c94fbbddb960f1da942',
  },
  {
    relativePath: 'nested/asset.txt',
    sha256: 'd59386e0ae435e292fbe0ebcdb954b75ed5fb3922091277cb19f798fc5d50718',
  },
];
const fixtureManifest = {
  files: fixtureFiles,
  distDigest:
    '252af42323e471d8e8f72cef5a4a8b29437f3db0fefb9d0fa8c38090ea645ebc',
};

interface VerifierOptions {
  origin?: string;
  artifactCommitSha?: string;
  headCommitSha?: string;
  gitStatus?: string;
  distRoot?: string;
  distManifestPath?: string;
  previewManifestPath?: string;
  baselineCrawlPath?: string;
  fetchImplementation?: typeof fetch;
}

interface VerifierModule {
  verifyIsolatedPreview(options: VerifierOptions): Promise<unknown>;
}

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

async function temporaryDirectory() {
  const directory = await mkdtemp(
    join(tmpdir(), 'grantisom-isolated-preview-'),
  );
  temporaryDirectories.push(directory);
  return directory;
}

async function loadVerifier(): Promise<VerifierModule> {
  const moduleUrl = new URL(
    `../../scripts/verify-isolated-preview.mjs?test=${Date.now()}-${Math.random()}`,
    import.meta.url,
  );
  const loaded = (await import(moduleUrl.href).catch(() => undefined)) as
    VerifierModule | undefined;
  expect(
    loaded,
    'the isolated-preview verifier production module must exist and load',
  ).toBeDefined();
  expect(loaded?.verifyIsolatedPreview).toBeTypeOf('function');
  return loaded as VerifierModule;
}

function runNodeScript(script: string, args: string[], cwd = repositoryRoot) {
  return new Promise<{
    exitCode: number | null;
    stdout: string;
    stderr: string;
  }>((resolveResult, reject) => {
    const child = spawn(process.execPath, [script, ...args], {
      cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.once('error', reject);
    child.once('exit', (exitCode) => {
      resolveResult({ exitCode, stdout, stderr });
    });
  });
}

async function writeTwoFileRoot(root: string) {
  await mkdir(join(root, 'nested'), { recursive: true });
  await Promise.all([
    writeFile(join(root, 'index.html'), 'home'),
    writeFile(join(root, 'nested/asset.txt'), 'asset'),
  ]);
}

async function createHarness() {
  const directory = await temporaryDirectory();
  const distRoot = join(directory, 'dist');
  const distManifestPath = join(directory, 'dist-manifest.json');
  const previewManifestPath = join(directory, 'preview-manifest.json');
  await writeTwoFileRoot(distRoot);
  await writeFile(
    distManifestPath,
    `${JSON.stringify(fixtureManifest, null, 2)}\n`,
  );

  const [{ routes }, { assets }, expectedCandidate] = await Promise.all([
    readFile(
      resolve(repositoryRoot, 'tests/fixtures/public-routes.json'),
      'utf8',
    ).then(JSON.parse),
    readFile(
      resolve(repositoryRoot, 'tests/fixtures/legacy-assets.json'),
      'utf8',
    ).then(JSON.parse),
    readFile(
      resolve(repositoryRoot, 'docs/qa/crawls/astro-preview.json'),
      'utf8',
    ).then(JSON.parse),
  ]);
  const outputByPath = new Map<string, string>([
    ...routes.map((route: { canonicalPath: string; outputPath: string }) => [
      route.canonicalPath,
      route.outputPath,
    ]),
    ...assets.map((asset: { path: string; outputPath: string }) => [
      asset.path,
      asset.outputPath,
    ]),
  ]);
  const responseContractByPath = new Map<
    string,
    { status: number; contentType: string }
  >(
    expectedCandidate.map(
      (record: {
        requestedPath: string;
        status: number;
        contentType: string;
      }) => [
        record.requestedPath,
        { status: record.status, contentType: record.contentType },
      ],
    ),
  );
  // These pages were added after the captured launch crawl.
  for (const path of ['/projects/vampire/', '/skills/skill-thief/']) {
    responseContractByPath.set(path, { status: 200, contentType: 'text/html' });
  }
  const requestedUrls: string[] = [];

  function fetchFixture({
    remoteDifference = false,
    missingRoute,
    crossOriginRoute,
  }: {
    remoteDifference?: boolean;
    missingRoute?: string;
    crossOriginRoute?: string;
  } = {}): typeof fetch {
    return async (input) => {
      const url = new URL(
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url,
      );
      requestedUrls.push(url.href);
      let body: Uint8Array;
      let status = 200;
      let contentType = 'application/octet-stream';

      if (url.pathname === '/index.html') {
        body = Buffer.from('home');
        contentType = 'text/html';
      } else if (url.pathname === '/nested/asset.txt') {
        body = Buffer.from(remoteDifference ? 'asseu' : 'asset');
        contentType = 'text/plain';
      } else {
        const outputPath = outputByPath.get(url.pathname);
        const contract = responseContractByPath.get(url.pathname);
        if (!outputPath || !contract) {
          throw new Error(`Unexpected injected request: ${url.href}`);
        }
        if (url.pathname === missingRoute) {
          body = Buffer.from('missing');
          status = 404;
          contentType = 'text/html';
        } else {
          body = await readFile(resolve(repositoryRoot, 'dist', outputPath));
          status = contract.status;
          contentType = contract.contentType;
        }
      }

      const responseBody = new ArrayBuffer(body.byteLength);
      new Uint8Array(responseBody).set(body);
      const response = new Response(responseBody, {
        status,
        headers: { 'content-type': contentType },
      });
      Object.defineProperty(response, 'url', {
        value:
          url.pathname === crossOriginRoute
            ? new URL(`${url.pathname}${url.search}`, 'https://grantisom.com')
                .href
            : url.href,
      });
      return response;
    };
  }

  return {
    options: {
      origin: previewOrigin,
      artifactCommitSha: reviewedSha,
      headCommitSha: reviewedSha,
      gitStatus: '?? docs/qa/dist-manifest.json\0',
      distRoot,
      distManifestPath,
      previewManifestPath,
      baselineCrawlPath: resolve(
        repositoryRoot,
        'docs/qa/crawls/production-before.json',
      ),
      fetchImplementation: fetchFixture(),
    } satisfies VerifierOptions,
    distRoot,
    previewManifestPath,
    requestedUrls,
    fetchFixture,
  };
}

describe('exact dist artifact hashing', () => {
  it('hashes a copied two-file root and rejects a later tooling-only file', async () => {
    const directory = await temporaryDirectory();
    const sourceRoot = join(directory, 'source');
    const copiedRoot = join(directory, 'copy');
    const manifestPath = join(directory, 'manifest.json');
    await writeTwoFileRoot(sourceRoot);
    await writeTwoFileRoot(copiedRoot);

    const written = await runNodeScript(hashScript, [
      '--root',
      sourceRoot,
      manifestPath,
    ]);
    expect(written).toMatchObject({ exitCode: 0, stderr: '' });
    expect(JSON.parse(await readFile(manifestPath, 'utf8'))).toEqual(
      fixtureManifest,
    );

    const matching = await runNodeScript(hashScript, [
      '--root',
      copiedRoot,
      '--check',
      manifestPath,
    ]);
    expect(matching).toMatchObject({ exitCode: 0, stderr: '' });

    await mkdir(join(copiedRoot, '.vercel'));
    await writeFile(join(copiedRoot, '.vercel/project.json'), '{}');
    const changed = await runNodeScript(hashScript, [
      '--root',
      copiedRoot,
      '--check',
      manifestPath,
    ]);
    expect(changed.exitCode).toBe(1);
    expect(changed.stderr).toMatch(/manifest|artifact|digest/i);
  });

  it('fails closed on missing manifest arguments and unsafe filesystem entries', async () => {
    const noManifest = await runNodeScript(hashScript, []);
    expect(noManifest.exitCode).toBe(1);
    expect(noManifest.stderr).toMatch(/manifest|usage/i);

    const directory = await temporaryDirectory();
    const root = join(directory, 'dist');
    const manifestPath = join(directory, 'manifest.json');
    await writeTwoFileRoot(root);
    await writeFile(manifestPath, `${JSON.stringify(fixtureManifest)}\n`);

    await writeFile(join(root, '.DS_Store'), 'metadata');
    const metadata = await runNodeScript(hashScript, [
      '--root',
      root,
      '--check',
      manifestPath,
    ]);
    expect(metadata.exitCode).toBe(1);
    expect(metadata.stderr).toMatch(/\.DS_Store/);
    await rm(join(root, '.DS_Store'));

    await symlink('index.html', join(root, 'linked.html'));
    const linked = await runNodeScript(hashScript, [
      '--root',
      root,
      '--check',
      manifestPath,
    ]);
    expect(linked.exitCode).toBe(1);
    expect(linked.stderr).toMatch(/symbolic link|symlink/i);
    await rm(join(root, 'linked.html'));

    const unreadablePath = join(root, 'unreadable.txt');
    await writeFile(unreadablePath, 'closed');
    await chmod(unreadablePath, 0o000);
    const unreadable = await runNodeScript(hashScript, [
      '--root',
      root,
      '--check',
      manifestPath,
    ]);
    await chmod(unreadablePath, 0o600);
    expect(unreadable.exitCode).toBe(1);
    expect(unreadable.stderr).toMatch(/unreadable|permission|EACCES/i);

    const duplicateManifest = {
      files: [
        { relativePath: 'caf\u00e9.txt', sha256: 'a'.repeat(64) },
        { relativePath: 'cafe\u0301.txt', sha256: 'b'.repeat(64) },
      ],
      distDigest: 'c'.repeat(64),
    };
    await writeFile(
      manifestPath,
      `${JSON.stringify(duplicateManifest, null, 2)}\n`,
    );
    const duplicate = await runNodeScript(hashScript, [
      '--root',
      root,
      '--check',
      manifestPath,
    ]);
    expect(duplicate.exitCode).toBe(1);
    expect(duplicate.stderr).toMatch(/duplicate|normalized/i);
  });
});

describe('isolated preview policy', () => {
  it.each([
    [undefined, 'missing'],
    ['http://preview.test', 'non-HTTPS'],
    ['https://user:secret@preview.test', 'credentials'],
    ['https://preview.test/path', 'path'],
    ['https://preview.test/.', 'URL-normalized path'],
    ['https://preview.test?mode=unsafe', 'query'],
    ['https://preview.test#unsafe', 'fragment'],
    ['https://localhost', 'localhost'],
    ['https://preview.localhost', 'localhost subdomain'],
    ['https://127.0.0.1', 'IPv4 loopback'],
    ['https://10.0.0.1', '10/8 private IPv4'],
    ['https://172.16.0.1', '172.16/12 private IPv4'],
    ['https://192.168.1.1', '192.168/16 private IPv4'],
    ['https://[::1]', 'IPv6 loopback'],
    ['https://[::ffff:7f00:1]', 'IPv4-mapped IPv6 loopback'],
    ['https://[fc00::1]', 'IPv6 unique-local'],
    ['https://[fe80::1]', 'IPv6 link-local'],
    ['https://grantisom.com', 'production apex'],
    ['https://www.grantisom.com', 'production www'],
  ])(
    'rejects the %s invalid-origin class (%s)',
    async (origin, _description) => {
      const { verifyIsolatedPreview } = await loadVerifier();
      const harness = await createHarness();
      await expect(
        verifyIsolatedPreview({ ...harness.options, origin }),
      ).rejects.toThrow(/origin|https|host|preview/i);
      await expect(readFile(harness.previewManifestPath)).rejects.toThrow();
    },
  );

  it('requires a full artifact SHA equal to HEAD', async () => {
    const { verifyIsolatedPreview } = await loadVerifier();
    const harness = await createHarness();
    for (const artifactCommitSha of [
      undefined,
      '0123456',
      'z'.repeat(40),
      'fedcba9876543210fedcba9876543210fedcba98',
    ]) {
      await expect(
        verifyIsolatedPreview({
          ...harness.options,
          artifactCommitSha,
        }),
      ).rejects.toThrow(/commit|sha|head/i);
    }
  });

  it('rejects staged, tracked, and unexpected untracked repository changes', async () => {
    const { verifyIsolatedPreview } = await loadVerifier();
    const harness = await createHarness();
    for (const gitStatus of [
      'M  README.md\0',
      ' M README.md\0',
      '?? unexpected.txt\0',
      '?? docs/qa/dist-manifest.json\0?? unexpected.txt\0',
    ]) {
      await expect(
        verifyIsolatedPreview({ ...harness.options, gitStatus }),
      ).rejects.toThrow(/clean|change|untracked|status/i);
    }
  });

  it('rejects a local dist change before any remote request or success record', async () => {
    const { verifyIsolatedPreview } = await loadVerifier();
    const harness = await createHarness();
    await writeFile(join(harness.distRoot, 'index.html'), 'changed');

    await expect(verifyIsolatedPreview(harness.options)).rejects.toThrow(
      /manifest|artifact|digest|sha/i,
    );
    expect(harness.requestedUrls).toEqual([]);
    await expect(readFile(harness.previewManifestPath)).rejects.toThrow();
  });

  it('rejects a one-byte remote difference without writing a preview manifest', async () => {
    const { verifyIsolatedPreview } = await loadVerifier();
    const harness = await createHarness();

    await expect(
      verifyIsolatedPreview({
        ...harness.options,
        fetchImplementation: harness.fetchFixture({ remoteDifference: true }),
      }),
    ).rejects.toThrow(/byte|sha|artifact|nested\/asset\.txt/i);
    await expect(readFile(harness.previewManifestPath)).rejects.toThrow();
  });

  it('requests every manifest file before accepting the artifact', async () => {
    const { verifyIsolatedPreview } = await loadVerifier();
    const harness = await createHarness();

    await verifyIsolatedPreview(harness.options);

    expect(harness.requestedUrls).toEqual(
      expect.arrayContaining([
        `${previewOrigin}/index.html`,
        `${previewOrigin}/nested/asset.txt`,
      ]),
    );
  });

  it('fails the exact policy crawl when a required route is missing', async () => {
    const { verifyIsolatedPreview } = await loadVerifier();
    const harness = await createHarness();

    await expect(
      verifyIsolatedPreview({
        ...harness.options,
        fetchImplementation: harness.fetchFixture({
          missingRoute: '/blog/',
        }),
      }),
    ).rejects.toThrow(/crawl|difference|blog/i);
    await expect(readFile(harness.previewManifestPath)).rejects.toThrow();
  });

  it('rejects a policy response whose final URL escapes the preview origin', async () => {
    const { verifyIsolatedPreview } = await loadVerifier();
    const harness = await createHarness();

    await expect(
      verifyIsolatedPreview({
        ...harness.options,
        fetchImplementation: harness.fetchFixture({
          crossOriginRoute: '/blog/',
        }),
      }),
    ).rejects.toThrow(/origin|isolated|redirect/i);
    await expect(readFile(harness.previewManifestPath)).rejects.toThrow();
  });

  it('accepts matching bytes and all 61 policies, then records exact provenance', async () => {
    const { verifyIsolatedPreview } = await loadVerifier();
    const harness = await createHarness();

    await verifyIsolatedPreview(harness.options);

    expect(
      JSON.parse(await readFile(harness.previewManifestPath, 'utf8')),
    ).toEqual({
      origin: previewOrigin,
      artifactCommitSha: reviewedSha,
      distDigest: fixtureManifest.distDigest,
    });
  });

  it.each(['--allow-origin-policy-bypass', '--fetch-module=fixture.mjs'])(
    'does not expose the hidden CLI bypass %s',
    async (flag) => {
      const directory = await temporaryDirectory();
      const result = await new Promise<{
        exitCode: number | null;
        stdout: string;
        stderr: string;
      }>((resolveResult, reject) => {
        const child = spawn(process.execPath, [verifierScript, flag], {
          cwd: directory,
          env: {
            ...process.env,
            PREVIEW_ORIGIN: 'https://localhost',
            ARTIFACT_COMMIT_SHA: reviewedSha,
          },
          stdio: ['ignore', 'pipe', 'pipe'],
        });
        let stdout = '';
        let stderr = '';
        child.stdout.setEncoding('utf8');
        child.stderr.setEncoding('utf8');
        child.stdout.on('data', (chunk) => {
          stdout += chunk;
        });
        child.stderr.on('data', (chunk) => {
          stderr += chunk;
        });
        child.once('error', reject);
        child.once('exit', (exitCode) =>
          resolveResult({ exitCode, stdout, stderr }),
        );
      });

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toBe('');
      expect(result.stderr).toMatch(/argument|usage|unsupported/i);
      await expect(
        readFile(join(directory, 'docs/qa/preview-manifest.json')),
      ).rejects.toThrow();
    },
  );
});

describe('crawl fetch boundary', () => {
  it('keeps global fetch as the default and uses injection only when supplied', async () => {
    const server = createServer((_request, response) => {
      response.statusCode = 200;
      response.setHeader('content-type', 'text/plain');
      response.end('global');
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('No port');
    try {
      const globalResult = await crawlSite(
        new URL(`http://127.0.0.1:${address.port}`),
        ['/boundary'],
      );
      expect(globalResult[0].bodySha256).toBe(
        '8001c27439650c5c5a6b4ed94163b5ddeb4476362c71380e613fa20dfffcef50',
      );

      const injectedFetch: typeof fetch = async (input) => {
        const url =
          typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.href
              : input.url;
        const response = new Response('injected', {
          status: 200,
          headers: { 'content-type': 'text/plain' },
        });
        Object.defineProperty(response, 'url', { value: url });
        return response;
      };
      const injectedResult = await crawlSite(
        new URL('https://injected.test'),
        ['/boundary'],
        1,
        injectedFetch,
      );
      expect(injectedResult[0].bodySha256).toBe(
        'c6c331958744bb3f00902fd3e507045e2fa152ea81b0f53f56299c6f8f0e82a2',
      );
    } finally {
      server.close();
      await once(server, 'close');
    }
  });
});
