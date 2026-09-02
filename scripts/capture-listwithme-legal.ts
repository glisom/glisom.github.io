import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { extractLegalMarkdown } from './lib/legal-semantic';

const root = new URL('../', import.meta.url);

async function captureLegal() {
  const [support, privacy] = await Promise.all([
    readFile(new URL('_pages/listwithme-support.md', root), 'utf8'),
    readFile(new URL('_pages/listwithme-privacy.md', root), 'utf8'),
  ]);
  const fixture = {
    support: extractLegalMarkdown(support),
    privacy: extractLegalMarkdown(privacy),
  };
  await writeFile(
    new URL('tests/fixtures/listwithme-legal.json', root),
    `${JSON.stringify(fixture, null, 2)}\n`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await captureLegal();

export { captureLegal };
