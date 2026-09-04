import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import sharp from 'sharp';

export async function makeComparison(
  sourcePath,
  implementationPath,
  outputPath,
) {
  const [source, implementation] = await Promise.all([
    sharp(sourcePath).metadata(),
    sharp(implementationPath).metadata(),
  ]);
  if (
    !source.width ||
    !source.height ||
    source.width !== implementation.width ||
    source.height !== implementation.height
  ) {
    throw new Error(
      `Comparison inputs must share exact dimensions: source ${source.width}x${source.height}, implementation ${implementation.width}x${implementation.height}.`,
    );
  }
  const divider = 28;
  const label = Buffer.from(
    `<svg width="${divider}" height="${source.height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#111214"/><text x="14" y="${Math.floor(source.height / 2)}" fill="#f7f6f2" font-family="monospace" font-size="9" letter-spacing="1" text-anchor="middle" transform="rotate(-90 14 ${Math.floor(source.height / 2)})">REFERENCE  |  IMPLEMENTATION</text></svg>`,
  );
  await mkdir(dirname(outputPath), { recursive: true });
  await sharp({
    create: {
      width: source.width * 2 + divider,
      height: source.height,
      channels: 4,
      background: '#111214',
    },
  })
    .composite([
      { input: sourcePath, left: 0, top: 0 },
      { input: label, left: source.width, top: 0 },
      { input: implementationPath, left: source.width + divider, top: 0 },
    ])
    .png()
    .toFile(outputPath);
}

export async function writeComparisonManifest(directory, outputPath) {
  const combinedDirectory = `${directory}/combined`;
  const entries = [];
  for (const filename of (await readdir(combinedDirectory))
    .filter((file) => file.endsWith('.png'))
    .toSorted()) {
    const path = `${combinedDirectory}/${filename}`;
    const bytes = await readFile(path);
    const metadata = await sharp(bytes).metadata();
    entries.push({
      path,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      width: metadata.width,
      height: metadata.height,
    });
  }
  await writeFile(
    outputPath,
    `${JSON.stringify({ count: entries.length, entries }, null, 2)}\n`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , sourcePath, implementationPath, outputPath] = process.argv;
  if (sourcePath === '--manifest' && implementationPath && outputPath) {
    await writeComparisonManifest(implementationPath, outputPath);
    process.exit(0);
  }
  if (!sourcePath || !implementationPath || !outputPath) {
    throw new Error(
      'Usage: node scripts/make-comparison.mjs SOURCE IMPLEMENTATION OUTPUT',
    );
  }
  await makeComparison(sourcePath, implementationPath, outputPath);
}
