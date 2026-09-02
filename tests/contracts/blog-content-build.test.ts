import { execFile } from 'node:child_process';
import {
  cp,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));

async function buildWithContentGraphRoute(): Promise<string> {
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'grantisom-content-'));
  const isolatedRoot = join(temporaryRoot, 'repository');
  const excludedRoots = new Set([
    '.astro',
    '.git',
    '.superpowers',
    'design-reference',
    'dist',
    'node_modules',
  ]);

  try {
    await cp(repositoryRoot, isolatedRoot, {
      recursive: true,
      filter: (source) => {
        const [topLevel] = relative(repositoryRoot, source).split('/');
        return !excludedRoots.has(topLevel);
      },
    });
    await symlink(
      join(repositoryRoot, 'node_modules'),
      join(isolatedRoot, 'node_modules'),
      'dir',
    );
    await writeFile(
      join(isolatedRoot, 'src/pages/content-load-regression.astro'),
      `---
import { loadContentGraph } from '../lib/content/load';
const graph = await loadContentGraph();
---
<p data-blog-count>{graph.blog.length}</p>
`,
      'utf8',
    );
    await execFileAsync('npm', ['run', 'build'], { cwd: isolatedRoot });
    return readFile(
      join(isolatedRoot, 'dist/content-load-regression.html'),
      'utf8',
    );
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

describe('generated blog content build', () => {
  it('loads every migrated post through Astro, including component-bearing MDX', async () => {
    const html = await buildWithContentGraphRoute();

    expect(html).toContain('<p data-blog-count>23</p>');
  }, 60_000);
});
