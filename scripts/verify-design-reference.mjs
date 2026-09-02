import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const EXPECTED = new Map([
  [
    '.npmrc',
    'f7dbda001b627b3a792fb6929303b517f047f03916f2c55227e81216d38a2008',
  ],
  [
    'README.md',
    'bc9600070bd25300459cc00558de2782a1b2200e387b2e07456d0bb5deca97d8',
  ],
  [
    'design-qa.md',
    '3ec6e2871c93c4cc9edc4fcbba704b558978ff8286f6cb6036894f288c19cad8',
  ],
  [
    'implementation-1586x992-final.png',
    'fe0025d3b2546ab61bd01b08cd3434d87d87797d0d7e1443542ff6199a9c1bb5',
  ],
  [
    'implementation-mobile-390x844-final.png',
    '954634babc032e85d5f69fe40ad31d9796fa77de7fbe4368d0afa399f4d73e7c',
  ],
  [
    'implementation-tablet-1024x768-final.png',
    'ff17196da17b5e3049c1cce42c4465f3178758109f58e55b12d474d2be9a0ea9',
  ],
  [
    'index.html',
    'e7835ed4449617c4b8e03f65d11a85a0d94f2723034bf918a80b5eef26adf70b',
  ],
  [
    'package-lock.json',
    '7f92505e9b14ce43b19098f912dadfaf4b2d9e00946515b27164056cdf2f8cb7',
  ],
  [
    'package.json',
    '6da7b5fa00ce08c5ade67b451b76d3a7c0a0c2daf8a58f9579d7181c3b5c87a5',
  ],
  [
    'public/assets/belief-rings.png',
    'd3c35899bd468d03ae4d378bd189e51da380e9d186ad6172ec6516249ebb3a4c',
  ],
  [
    'public/assets/evidence-map.png',
    '4efca1a712c17c2c3e18e230901cc907efdd640eeeab75ae131bdbb3c16e4fca',
  ],
  [
    'public/assets/groundwork-surveyor.png',
    'a7c86040a97c815f75cf993fc4b259b047acad9c2cb09e70c17327ce02d7c3d2',
  ],
  [
    'public/assets/healthql-hands.png',
    '51a0197ad6cab814220c56a8fa9b95ebbb2fbaa40d8d2b71803aca89c0de92f9',
  ],
  [
    'public/assets/listwithme-hand.png',
    '7a07122b810641ba0bd6c316f0ffa3597699cb663b190089aa209f4609264545',
  ],
  [
    'public/assets/production-hands.png',
    '5ef3e3896769f764cc6d81852bb9db06f252825cdba390fbe30e7e9e7e089a9b',
  ],
  [
    'qa-comparison-final.png',
    '643c44948f7471f88ea24ff1eb50618e4b7e9a8e14628718f9174146fef8cea7',
  ],
  [
    'src/App.jsx',
    'b4f5db54c201bed782110fca82f999d905250e8c8ae1be92e0df917ba5c79c3f',
  ],
  [
    'src/main.jsx',
    '832f752c6b6a454a26dbc4f2654f5bd633f2b103516c8c0abac648308c133a7e',
  ],
  [
    'src/styles.css',
    'b7befee81f1df7c5bcd1dce2250ba48c7f5a7f534e139e2cb48006e09cff6ce3',
  ],
  [
    'vite.config.mjs',
    '5f20ad6ef5aa89956c8791d8caefa224bc80718ca38df213b5e0c9c883d4bfee',
  ],
]);

const APPROVED_MOCKUPS = new Map([
  [
    'docs/design/mockups/article-family-approved.html',
    'efa474e3b08488a09efd617e15c99bb7ac1a156ea858068ffb35ee325296117e',
  ],
  [
    'docs/design/mockups/index-family-approved.html',
    '0a7c45a605b562873215f5e129152fe5031b0d3fdeb06cef5d9d9f405b70b363',
  ],
  [
    'docs/design/mockups/detail-family-approved.html',
    '60b6a3a27166f70d035cf37ccb7c0c2541e7057273a1df178698ea0b038e75ec',
  ],
]);

async function listImmutableFiles(root, relative = '') {
  const entries = await readdir(new URL(relative || './', root), {
    withFileTypes: true,
  });
  const files = [];
  for (const entry of entries) {
    const path = `${relative}${entry.name}`;
    if (
      !relative &&
      entry.isDirectory() &&
      ['node_modules', 'dist'].includes(entry.name)
    )
      continue;
    if (entry.isDirectory())
      files.push(...(await listImmutableFiles(root, `${path}/`)));
    else if (entry.isFile()) files.push(path);
    else throw new Error(`Unsupported reference entry: ${path}`);
  }
  return files.toSorted();
}

export async function verifyDesignReference(root) {
  const actualPaths = await listImmutableFiles(root);
  const expectedPaths = [...EXPECTED.keys()].toSorted();
  if (JSON.stringify(actualPaths) !== JSON.stringify(expectedPaths)) {
    throw new Error(
      `Reference manifest mismatch:\nexpected ${expectedPaths.join('\n')}\nreceived ${actualPaths.join('\n')}`,
    );
  }
  for (const [relativePath, expected] of EXPECTED) {
    const bytes = await readFile(new URL(relativePath, root));
    const actual = createHash('sha256').update(bytes).digest('hex');
    if (actual !== expected)
      throw new Error(
        `${relativePath}: expected ${expected}, received ${actual}`,
      );
  }
}

export async function verifyApprovedMockups(repoRoot) {
  for (const [relativePath, expected] of APPROVED_MOCKUPS) {
    const bytes = await readFile(new URL(relativePath, repoRoot));
    const actual = createHash('sha256').update(bytes).digest('hex');
    if (actual !== expected)
      throw new Error(
        `${relativePath}: expected ${expected}, received ${actual}`,
      );
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await verifyDesignReference(
    new URL('../design-reference/vite-homepage/', import.meta.url),
  );
  await verifyApprovedMockups(new URL('../', import.meta.url));
}
