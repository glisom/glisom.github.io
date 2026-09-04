import { spawn } from 'node:child_process';
import { mkdir, readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
  writeComparisonContactSheet,
  writeComparisonManifest,
} from './make-comparison.mjs';
import {
  assertCapturePortsAvailable,
  comparisonCaptureEnvironment,
} from './lib/visual-capture.mjs';

const root = fileURLToPath(
  new URL('../docs/qa/visual-comparisons/', import.meta.url),
);
const raw = `${root}/raw`;
const combined = `${root}/combined`;
const manifest = `${root}/manifest.json`;
const contactSheet = `${root}/contact-sheet.png`;

export async function captureVisualComparisons() {
  await assertCapturePortsAvailable();
  await Promise.all([
    rm(raw, { recursive: true, force: true }),
    rm(combined, { recursive: true, force: true }),
    rm(manifest, { force: true }),
    rm(contactSheet, { force: true }),
  ]);
  await Promise.all([
    mkdir(raw, { recursive: true }),
    mkdir(combined, { recursive: true }),
  ]);

  const child = spawn('npm', ['run', 'test:visual'], {
    cwd: process.cwd(),
    env: comparisonCaptureEnvironment(process.env),
    stdio: 'inherit',
  });
  const code = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', resolve);
  });
  if (code !== 0) return code ?? 1;

  await writeComparisonManifest(root, manifest);
  const parsed = JSON.parse(await readFile(manifest, 'utf8'));
  if (parsed.count !== 55)
    throw new Error(
      `Expected 55 combined comparisons, received ${parsed.count}`,
    );
  await writeComparisonContactSheet(root, contactSheet);
  console.log(
    `Finalized ${parsed.count} visual comparisons with manifest and contact sheet.`,
  );
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = await captureVisualComparisons();
}
