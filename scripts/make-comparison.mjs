import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, relative, sep } from 'node:path';
import sharp from 'sharp';

const divider = 28;
const paper = '#f7f6f2';

const intentionalDifferences = [
  'Index references are illustrative switcher states; the implementation preserves the approved source-of-truth rosters of 23 blog posts, 4 used apps, 4 authored apps, 5 used skills, and 3 authored skills.',
  'Preview and companion controls shown only in the illustrative index mockup are intentionally omitted from the implementation.',
  'The implementation retains the approved 250px desktop rail, 210px mid-layout rail, and mobile shell breakpoints rather than treating mockup content length as layout truth.',
  'Detail pages preserve authored copy, actions, and facts, and omit illustrative detail media where the corresponding real record has no media.',
  'Mobile Browse-open and expanded-TOC captures demonstrate functional additions with no equivalent open state in the frozen references.',
  'The frozen article mockup overflows its configured width in tablet and phone full-page captures; those reference pixels are preserved and padded, while the implementation remains width-bounded by its no-overflow contract.',
];

export async function makeComparison(
  sourcePath,
  implementationPath,
  outputPath,
  {
    allowDimensionPadding = false,
    labels = { left: 'REFERENCE', right: 'IMPLEMENTATION' },
  } = {},
) {
  const [source, implementation] = await Promise.all([
    sharp(sourcePath).metadata(),
    sharp(implementationPath).metadata(),
  ]);
  if (
    !source.width ||
    !source.height ||
    !implementation.width ||
    !implementation.height ||
    (!allowDimensionPadding &&
      (source.width !== implementation.width ||
        source.height !== implementation.height))
  ) {
    throw new Error(
      `Comparison inputs must share exact dimensions unless padding is enabled: source ${source.width}x${source.height}, implementation ${implementation.width}x${implementation.height}.`,
    );
  }
  const width = Math.max(source.width, implementation.width);
  const height = Math.max(source.height, implementation.height);
  const label = Buffer.from(
    `<svg width="${divider}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#111214"/><text x="14" y="${Math.floor(height / 2)}" fill="${paper}" font-family="monospace" font-size="9" letter-spacing="1" text-anchor="middle" transform="rotate(-90 14 ${Math.floor(height / 2)})">${escapeXml(labels.left)}  |  ${escapeXml(labels.right)}</text></svg>`,
  );
  await mkdir(dirname(outputPath), { recursive: true });
  await sharp({
    create: {
      width: width * 2 + divider,
      height,
      channels: 4,
      background: paper,
    },
  })
    .composite([
      { input: sourcePath, left: 0, top: 0 },
      { input: label, left: width, top: 0 },
      { input: implementationPath, left: width + divider, top: 0 },
    ])
    .png()
    .toFile(outputPath);
}

export async function writeComparisonManifest(directory, outputPath) {
  const combinedDirectory = `${directory}/combined`;
  const artifact = async (absolutePath) => {
    const bytes = await readFile(absolutePath);
    const metadata = await sharp(bytes).metadata();
    return {
      path: relative(process.cwd(), absolutePath).split(sep).join('/'),
      sha256: createHash('sha256').update(bytes).digest('hex'),
      width: metadata.width,
      height: metadata.height,
    };
  };
  const entries = [];
  for (const filename of (await readdir(combinedDirectory))
    .filter((file) => file.endsWith('.png'))
    .toSorted()) {
    const combined = await artifact(`${combinedDirectory}/${filename}`);
    const stem = filename.replace(/\.png$/, '');
    const beforeAfter = [
      'interaction-mobile-browse-open-phone-viewport',
      'interaction-expanded-toc-phone-viewport',
    ].includes(stem);
    const [left, right] = await Promise.all([
      artifact(
        `${directory}/raw/${stem}-${beforeAfter ? 'closed' : 'reference'}.png`,
      ),
      artifact(
        `${directory}/raw/${stem}-${beforeAfter ? 'open' : 'implementation'}.png`,
      ),
    ]);
    entries.push({
      ...combined,
      mode: stem.endsWith('-full-page') ? 'full-page' : 'viewport',
      leftRole: beforeAfter ? 'closed' : 'reference',
      rightRole: beforeAfter ? 'open' : 'implementation',
      left,
      right,
    });
  }
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    `${JSON.stringify(
      {
        status: 'review-candidate-noncanonical',
        count: entries.length,
        canonicalMetadata:
          'Pending Step 7 after visual approval: OS, architecture, Chromium revision, route, viewport, state, and frozen-source checksum binding.',
        capturePolicy: {
          viewport:
            'Both halves retain the exact configured viewport dimensions.',
          fullPage:
            'Both halves retain their exact full-page dimensions; each gets the maximum raw width/height canvas, raw pixels remain top-left, and only the bottom/right is paper-padded. Neither side is cropped or scaled.',
          interactions:
            'Interaction comparisons are viewport-only; keyboard focus compares the frozen source with the implementation, while Browse and TOC use honest implementation CLOSED/OPEN pairs because the frozen sources have no equivalent open state. Baseline page-family comparisons include viewport and full-page pairs.',
        },
        intentionalDifferences,
        entries,
      },
      null,
      2,
    )}\n`,
  );
}

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export async function writeComparisonContactSheet(directory, outputPath) {
  const combinedDirectory = `${directory}/combined`;
  const filenames = (await readdir(combinedDirectory))
    .filter((file) => file.endsWith('.png'))
    .toSorted();
  const columns = 4;
  const cellWidth = 360;
  const cellHeight = 310;
  const imageWidth = 340;
  const imageHeight = 270;
  const rows = Math.ceil(filenames.length / columns);
  const composites = [];
  for (const [index, filename] of filenames.entries()) {
    const left = (index % columns) * cellWidth + 10;
    const top = Math.floor(index / columns) * cellHeight;
    const thumbnail = await sharp(`${combinedDirectory}/${filename}`)
      .resize({
        width: imageWidth,
        height: imageHeight,
        fit: 'contain',
        background: paper,
      })
      .png()
      .toBuffer();
    const label = Buffer.from(
      `<svg width="${imageWidth}" height="30" xmlns="http://www.w3.org/2000/svg"><text x="0" y="20" fill="#111214" font-family="monospace" font-size="11">${escapeXml(filename)}</text></svg>`,
    );
    composites.push(
      { input: label, left, top },
      { input: thumbnail, left, top: top + 30 },
    );
  }
  await mkdir(dirname(outputPath), { recursive: true });
  await sharp({
    create: {
      width: columns * cellWidth,
      height: rows * cellHeight,
      channels: 4,
      background: paper,
    },
  })
    .composite(composites)
    .png()
    .toFile(outputPath);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , sourcePath, implementationPath, outputPath] = process.argv;
  if (sourcePath === '--manifest' && implementationPath && outputPath) {
    await writeComparisonManifest(implementationPath, outputPath);
    process.exit(0);
  }
  if (sourcePath === '--contact-sheet' && implementationPath && outputPath) {
    await writeComparisonContactSheet(implementationPath, outputPath);
    process.exit(0);
  }
  if (!sourcePath || !implementationPath || !outputPath) {
    throw new Error(
      'Usage: node scripts/make-comparison.mjs SOURCE IMPLEMENTATION OUTPUT',
    );
  }
  await makeComparison(sourcePath, implementationPath, outputPath);
}
