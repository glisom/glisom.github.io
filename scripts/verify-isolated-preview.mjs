import { execFile } from 'node:child_process';
import { isIP } from 'node:net';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { checkDistManifest } from './hash-dist.mjs';
import { crawlSite } from './crawl-site.mjs';
import { loadComparisonContext } from './compare-crawls.mjs';
import { compareCrawls } from './lib/crawl-policy.ts';

const execFileAsync = promisify(execFile);
const FULL_COMMIT_SHA = /^[0-9a-f]{40}$/;
const ALLOWED_UNTRACKED_MANIFEST = 'docs/qa/dist-manifest.json';
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const MAX_REDIRECTS = 20;
const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));

function privateIpv4(hostname) {
  const octets = hostname.split('.').map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet))) {
    return false;
  }
  const [first, second] = octets;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    first >= 224
  );
}

function privateIpv6(hostname) {
  const value = hostname.toLowerCase();
  if (value === '::' || value === '::1') return true;
  const first = Number.parseInt(value.split(':', 1)[0] || '0', 16);
  if ((first & 0xfe00) === 0xfc00 || (first & 0xffc0) === 0xfe80) return true;
  const mappedIpv4 = value.match(/(?:^|:)ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  if (mappedIpv4) return privateIpv4(mappedIpv4);
  const mappedWords = value.match(
    /^(?:::ffff:|0:0:0:0:0:ffff:)([0-9a-f]{1,4}):([0-9a-f]{1,4})$/,
  );
  if (!mappedWords) return false;
  const high = Number.parseInt(mappedWords[1], 16);
  const low = Number.parseInt(mappedWords[2], 16);
  return privateIpv4([high >> 8, high & 0xff, low >> 8, low & 0xff].join('.'));
}

export function validatePreviewOrigin(value) {
  if (typeof value !== 'string' || !value || value.trim() !== value) {
    throw new Error('PREVIEW_ORIGIN is required as one exact HTTPS origin');
  }
  if (!/^https:\/\/[^/?#]+\/?$/.test(value)) {
    throw new Error('PREVIEW_ORIGIN must contain only an HTTPS origin');
  }
  let url;
  try {
    url = new URL(value);
  } catch (error) {
    throw new Error('PREVIEW_ORIGIN must be a valid HTTPS origin', {
      cause: error,
    });
  }
  if (url.protocol !== 'https:') {
    throw new Error('PREVIEW_ORIGIN must use HTTPS');
  }
  if (url.username || url.password) {
    throw new Error('PREVIEW_ORIGIN must not contain credentials');
  }
  if (url.pathname !== '/' || url.search || url.hash) {
    throw new Error(
      'PREVIEW_ORIGIN must not contain a path, query, or fragment',
    );
  }
  const hostname = url.hostname
    .replace(/^\[|\]$/g, '')
    .replace(/\.$/, '')
    .toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    throw new Error('PREVIEW_ORIGIN must not use localhost');
  }
  if (hostname === 'grantisom.com' || hostname === 'www.grantisom.com') {
    throw new Error('PREVIEW_ORIGIN must not use a production host');
  }
  const ipVersion = isIP(hostname);
  if (
    (ipVersion === 4 && privateIpv4(hostname)) ||
    (ipVersion === 6 && privateIpv6(hostname))
  ) {
    throw new Error('PREVIEW_ORIGIN must not use a loopback or private IP');
  }
  return url.origin;
}

function validateArtifactCommit(artifactCommitSha, headCommitSha) {
  if (
    typeof artifactCommitSha !== 'string' ||
    !FULL_COMMIT_SHA.test(artifactCommitSha)
  ) {
    throw new Error('ARTIFACT_COMMIT_SHA must be a full lowercase commit SHA');
  }
  if (
    typeof headCommitSha !== 'string' ||
    artifactCommitSha !== headCommitSha
  ) {
    throw new Error('ARTIFACT_COMMIT_SHA must equal HEAD');
  }
}

export function validateGitStatus(gitStatus) {
  if (typeof gitStatus !== 'string') {
    throw new Error('Git status is required for isolated-preview verification');
  }
  const records = gitStatus.split('\0').filter(Boolean);
  for (const record of records) {
    if (record === `?? ${ALLOWED_UNTRACKED_MANIFEST}`) continue;
    throw new Error(
      `Repository must be clean except for ${ALLOWED_UNTRACKED_MANIFEST}; found ${JSON.stringify(record)}`,
    );
  }
}

async function loadCrawlPaths() {
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
  const paths = [
    ...routes.routes.map(({ canonicalPath }) => canonicalPath),
    ...assets.assets.map(({ path }) => path),
  ];
  if (paths.length !== 76 || new Set(paths).size !== 76) {
    throw new Error(
      `Expected exactly 76 unique crawl policy paths; found ${paths.length}`,
    );
  }
  return paths;
}

function artifactUrl(origin, relativePath) {
  const encoded = relativePath
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
  return new URL(`/${encoded}`, `${origin}/`);
}

function originEnforcingFetch(origin, fetchImplementation) {
  return async (input, init) => {
    let requestUrl = new URL(
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url,
    );
    let redirects = 0;

    while (true) {
      if (requestUrl.origin !== origin) {
        throw new Error(
          `Request escaped the isolated preview origin: ${requestUrl.href}`,
        );
      }
      const response = await fetchImplementation(requestUrl, {
        ...init,
        redirect: 'manual',
      });
      const responseUrl = response.url ? new URL(response.url) : requestUrl;
      if (responseUrl.origin !== origin) {
        throw new Error(
          `Response escaped the isolated preview origin: ${responseUrl.href}`,
        );
      }
      if (!REDIRECT_STATUSES.has(response.status)) return response;

      const location = response.headers.get('location');
      if (!location) return response;
      if (redirects >= MAX_REDIRECTS) {
        throw new Error(`Too many isolated preview redirects: ${requestUrl}`);
      }
      const nextUrl = new URL(location, responseUrl);
      if (nextUrl.origin !== origin) {
        throw new Error(
          `Redirect escaped the isolated preview origin: ${nextUrl.href}`,
        );
      }
      requestUrl = nextUrl;
      redirects += 1;
    }
  };
}

async function verifyRemoteFiles(
  origin,
  distRoot,
  manifest,
  fetchImplementation,
) {
  await Promise.all(
    manifest.files.map(async ({ relativePath }) => {
      const localBytes = await readFile(
        resolve(distRoot, ...relativePath.split('/')),
      );
      const url = artifactUrl(origin, relativePath);
      const response = await fetchImplementation(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(30_000),
        headers: { 'user-agent': 'grantisom-release-verifier/1.0' },
      });
      if (!response.ok) {
        throw new Error(
          `Remote artifact request failed for ${relativePath}: ${response.status}`,
        );
      }
      if (response.url && new URL(response.url).origin !== origin) {
        throw new Error(
          `Remote artifact escaped the isolated origin: ${relativePath}`,
        );
      }
      const remoteBytes = Buffer.from(await response.arrayBuffer());
      if (!localBytes.equals(remoteBytes)) {
        throw new Error(`Remote artifact byte mismatch: ${relativePath}`);
      }
    }),
  );
}

export async function verifyIsolatedPreview({
  origin,
  artifactCommitSha,
  headCommitSha,
  gitStatus,
  distRoot = resolve(repositoryRoot, 'dist'),
  distManifestPath = resolve(repositoryRoot, 'docs/qa/dist-manifest.json'),
  previewManifestPath = resolve(
    repositoryRoot,
    'docs/qa/preview-manifest.json',
  ),
  baselineCrawlPath = resolve(
    repositoryRoot,
    'docs/qa/crawls/production-before.json',
  ),
  fetchImplementation,
}) {
  const validatedOrigin = validatePreviewOrigin(origin);
  validateArtifactCommit(artifactCommitSha, headCommitSha);
  validateGitStatus(gitStatus);
  if (typeof fetchImplementation !== 'function') {
    throw new Error('An injected fetch implementation is required');
  }
  const isolatedFetch = originEnforcingFetch(
    validatedOrigin,
    fetchImplementation,
  );

  const manifest = await checkDistManifest(distRoot, distManifestPath);
  await verifyRemoteFiles(validatedOrigin, distRoot, manifest, isolatedFetch);

  const [paths, baseline, context] = await Promise.all([
    loadCrawlPaths(),
    readFile(baselineCrawlPath, 'utf8').then(JSON.parse),
    loadComparisonContext(),
  ]);
  if (context.policies.length !== 76) {
    throw new Error(
      `Expected exactly 76 structured crawl policies; found ${context.policies.length}`,
    );
  }
  const candidate = await crawlSite(
    new URL(validatedOrigin),
    paths,
    6,
    isolatedFetch,
  );
  const differences = compareCrawls(baseline, candidate, context);
  if (differences.length) {
    throw new Error(
      `Isolated preview crawl found ${differences.length} difference(s): ${JSON.stringify(differences)}`,
    );
  }

  const previewManifest = {
    origin: validatedOrigin,
    artifactCommitSha,
    distDigest: manifest.distDigest,
  };
  await mkdir(dirname(previewManifestPath), { recursive: true });
  await writeFile(
    previewManifestPath,
    `${JSON.stringify(previewManifest, null, 2)}\n`,
  );
  return previewManifest;
}

async function repositoryState(cwd) {
  const [{ stdout: head }, { stdout: status }] = await Promise.all([
    execFileAsync('git', ['rev-parse', 'HEAD'], { cwd, encoding: 'utf8' }),
    execFileAsync(
      'git',
      ['status', '--porcelain=v1', '-z', '--untracked-files=all'],
      { cwd, encoding: 'utf8' },
    ),
  ]);
  return { headCommitSha: head.trim(), gitStatus: status };
}

async function main() {
  if (process.argv.length !== 2) {
    throw new Error(
      'Unsupported argument: verify-isolated-preview.mjs accepts no CLI arguments',
    );
  }
  const cwd = process.cwd();
  const state = await repositoryState(cwd);
  const result = await verifyIsolatedPreview({
    origin: process.env.PREVIEW_ORIGIN,
    artifactCommitSha: process.env.ARTIFACT_COMMIT_SHA,
    ...state,
    distRoot: resolve(cwd, 'dist'),
    distManifestPath: resolve(cwd, 'docs/qa/dist-manifest.json'),
    previewManifestPath: resolve(cwd, 'docs/qa/preview-manifest.json'),
    baselineCrawlPath: resolve(cwd, 'docs/qa/crawls/production-before.json'),
    fetchImplementation: globalThis.fetch,
  });
  console.log(
    `Verified isolated preview ${result.origin} at ${result.distDigest}`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
