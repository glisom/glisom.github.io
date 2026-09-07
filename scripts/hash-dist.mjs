import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import {
  access,
  lstat,
  mkdir,
  readFile,
  readdir,
  writeFile,
} from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const SHA256 = /^[0-9a-f]{64}$/;

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function normalizeRelativePath(root, file) {
  const raw = relative(root, file);
  if (!raw || raw.startsWith('..') || raw.includes('\0')) {
    throw new Error(`Unsafe artifact path: ${raw || file}`);
  }
  const normalized = raw.split(sep).join('/').normalize('NFC');
  if (
    normalized.startsWith('/') ||
    normalized.split('/').some((part) => !part || part === '.' || part === '..')
  ) {
    throw new Error(`Unsafe normalized artifact path: ${normalized}`);
  }
  return normalized;
}

async function enumerateFiles(root) {
  const rootStat = await lstat(root).catch((error) => {
    throw new Error(`Artifact root is unreadable: ${root}`, { cause: error });
  });
  if (rootStat.isSymbolicLink()) {
    throw new Error(`Artifact root must not be a symbolic link: ${root}`);
  }
  if (!rootStat.isDirectory()) {
    throw new Error(`Artifact root is not a directory: ${root}`);
  }

  const files = [];
  const visit = async (directory) => {
    const entries = await readdir(directory, { withFileTypes: true }).catch(
      (error) => {
        throw new Error(`Artifact directory is unreadable: ${directory}`, {
          cause: error,
        });
      },
    );
    entries.sort((left, right) => left.name.localeCompare(right.name, 'en'));
    for (const entry of entries) {
      const absolutePath = resolve(directory, entry.name);
      const entryStat = await lstat(absolutePath).catch((error) => {
        throw new Error(`Artifact entry is unreadable: ${absolutePath}`, {
          cause: error,
        });
      });
      if (entryStat.isSymbolicLink()) {
        throw new Error(`Artifact contains a symbolic link: ${absolutePath}`);
      }
      if (entry.name === '.DS_Store') {
        throw new Error(
          `Artifact contains forbidden .DS_Store: ${absolutePath}`,
        );
      }
      if (entryStat.isDirectory()) {
        await visit(absolutePath);
      } else if (entryStat.isFile()) {
        files.push(absolutePath);
      } else {
        throw new Error(
          `Artifact contains a non-regular entry: ${absolutePath}`,
        );
      }
    }
  };
  await visit(root);
  return files;
}

export async function buildDistManifest(root = resolve('dist')) {
  const absoluteRoot = resolve(root);
  const seen = new Set();
  const files = [];
  for (const absolutePath of await enumerateFiles(absoluteRoot)) {
    const relativePath = normalizeRelativePath(absoluteRoot, absolutePath);
    if (seen.has(relativePath)) {
      throw new Error(`Duplicate normalized artifact path: ${relativePath}`);
    }
    seen.add(relativePath);
    await access(absolutePath, constants.R_OK).catch((error) => {
      throw new Error(`Artifact file is unreadable: ${relativePath}`, {
        cause: error,
      });
    });
    const bytes = await readFile(absolutePath).catch((error) => {
      throw new Error(`Artifact file is unreadable: ${relativePath}`, {
        cause: error,
      });
    });
    files.push({ relativePath, sha256: sha256(bytes) });
  }
  files.sort((left, right) =>
    left.relativePath < right.relativePath
      ? -1
      : left.relativePath > right.relativePath
        ? 1
        : 0,
  );
  return { files, distDigest: sha256(JSON.stringify(files)) };
}

export function validateDistManifest(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Dist manifest must be an object');
  }
  const keys = Object.keys(value).sort();
  if (keys.join(',') !== 'distDigest,files') {
    throw new Error('Dist manifest must contain only files and distDigest');
  }
  if (!Array.isArray(value.files)) {
    throw new Error('Dist manifest files must be an array');
  }
  const files = [];
  const seen = new Set();
  for (const entry of value.files) {
    if (
      !entry ||
      typeof entry !== 'object' ||
      Array.isArray(entry) ||
      Object.keys(entry).sort().join(',') !== 'relativePath,sha256' ||
      typeof entry.relativePath !== 'string' ||
      typeof entry.sha256 !== 'string'
    ) {
      throw new Error('Dist manifest contains an invalid file entry');
    }
    const normalized = entry.relativePath
      .split('\\')
      .join('/')
      .normalize('NFC');
    if (
      !normalized ||
      normalized.startsWith('/') ||
      normalized
        .split('/')
        .some((part) => !part || part === '.' || part === '..')
    ) {
      throw new Error(`Unsafe normalized manifest path: ${entry.relativePath}`);
    }
    if (seen.has(normalized)) {
      throw new Error(`Duplicate normalized manifest path: ${normalized}`);
    }
    seen.add(normalized);
    if (normalized !== entry.relativePath) {
      throw new Error(`Manifest path is not normalized: ${entry.relativePath}`);
    }
    if (!SHA256.test(entry.sha256)) {
      throw new Error(`Invalid SHA-256 for ${entry.relativePath}`);
    }
    files.push({ relativePath: entry.relativePath, sha256: entry.sha256 });
  }
  const sorted = [...files].sort((left, right) =>
    left.relativePath < right.relativePath
      ? -1
      : left.relativePath > right.relativePath
        ? 1
        : 0,
  );
  if (JSON.stringify(files) !== JSON.stringify(sorted)) {
    throw new Error('Dist manifest file entries are not sorted');
  }
  if (typeof value.distDigest !== 'string' || !SHA256.test(value.distDigest)) {
    throw new Error('Dist manifest has an invalid aggregate digest');
  }
  const calculatedDigest = sha256(JSON.stringify(files));
  if (calculatedDigest !== value.distDigest) {
    throw new Error(
      'Dist manifest aggregate digest does not match its file list',
    );
  }
  return { files, distDigest: value.distDigest };
}

export async function readDistManifest(manifestPath) {
  const source = await readFile(manifestPath, 'utf8').catch((error) => {
    throw new Error(`Dist manifest is unreadable: ${manifestPath}`, {
      cause: error,
    });
  });
  let parsed;
  try {
    parsed = JSON.parse(source);
  } catch (error) {
    throw new Error(`Dist manifest is invalid JSON: ${manifestPath}`, {
      cause: error,
    });
  }
  return validateDistManifest(parsed);
}

export async function checkDistManifest(root, manifestPath) {
  const [actual, expected] = await Promise.all([
    buildDistManifest(root),
    readDistManifest(manifestPath),
  ]);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Artifact does not match dist manifest: ${resolve(manifestPath)}`,
    );
  }
  return actual;
}

export async function writeDistManifest(root, manifestPath) {
  const manifest = await buildDistManifest(root);
  const absoluteManifestPath = resolve(manifestPath);
  await mkdir(dirname(absoluteManifestPath), { recursive: true });
  await writeFile(
    absoluteManifestPath,
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  return manifest;
}

function parseArguments(args) {
  let root = resolve('dist');
  let manifestPath;
  let check = false;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--root') {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(
          'Usage: hash-dist.mjs [--root directory] [--check] manifest',
        );
      }
      root = resolve(value);
      index += 1;
    } else if (argument === '--check') {
      if (check) throw new Error('The --check option may appear only once');
      check = true;
      const value = args[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(
          'Usage: hash-dist.mjs [--root directory] --check manifest',
        );
      }
      manifestPath = resolve(value);
      index += 1;
    } else if (argument.startsWith('--')) {
      throw new Error(`Unsupported argument: ${argument}`);
    } else if (manifestPath) {
      throw new Error(`Unexpected extra manifest argument: ${argument}`);
    } else {
      manifestPath = resolve(argument);
    }
  }
  if (!manifestPath) {
    throw new Error(
      'A manifest path is required: hash-dist.mjs [--root directory] [--check] manifest',
    );
  }
  return { root, manifestPath, check };
}

async function main() {
  const { root, manifestPath, check } = parseArguments(process.argv.slice(2));
  const manifest = check
    ? await checkDistManifest(root, manifestPath)
    : await writeDistManifest(root, manifestPath);
  console.log(
    `${check ? 'Verified' : 'Wrote'} ${manifest.files.length} files with digest ${manifest.distDigest}`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
