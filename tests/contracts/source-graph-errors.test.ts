import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadSourceGraph } from '../../scripts/lib/source-graph';

const fixtureRoots: string[] = [];

async function sourceFixture(
  collection: string,
  filename: string,
  source: string,
): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'grantisom-source-graph-'));
  fixtureRoots.push(root);
  const file = join(root, 'src', 'content', collection, filename);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, source);
  return root;
}

async function capturedError(promise: Promise<unknown>): Promise<Error> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof Error) return error;
    throw new Error(`Expected an Error, received ${String(error)}`);
  }
  throw new Error('Expected source loading to fail.');
}

afterEach(async () => {
  await Promise.all(
    fixtureRoots.splice(0).map((root) =>
      rm(root, {
        recursive: true,
        force: true,
      }),
    ),
  );
});

describe('source graph errors', () => {
  it.each([
    {
      name: 'malformed frontmatter',
      collection: 'app-library',
      filename: 'broken-yaml.md',
      source: '---\ntitle: [unterminated\n---\n',
    },
    {
      name: 'schema-invalid frontmatter',
      collection: 'app-library',
      filename: 'invalid-app.md',
      source: `---
title: Invalid App
slug: invalid-app
canonicalPath: /app-library/invalid-app/
summary: This fixture reaches the real collection schema with invalid ownership.
ownership: made
category: Testing
reasonItStays: This value exists only to reach the ownership validation branch.
---
`,
    },
    {
      name: 'unsafe blog HTML',
      collection: 'blog',
      filename: 'unsafe-html.md',
      source: `---
title: Unsafe HTML
slug: unsafe-html
canonicalPath: /2026/09/02/unsafe-html.html
summary: This fixture reaches the real legacy HTML validator with a script element.
draft: false
hasDetailPage: true
featured: false
tags: []
links: []
relationships: []
publishedAt: '2026-09-02'
kind: Post
comments: true
preservedHeadingIds: []
numberHeadings: false
---
<script>alert('unsafe')</script>
`,
    },
  ])('reports the repository-relative path for $name', async (fixture) => {
    const repositoryRoot = await sourceFixture(
      fixture.collection,
      fixture.filename,
      fixture.source,
    );

    const error = await capturedError(loadSourceGraph({ repositoryRoot }));
    const cause = error.cause;

    expect(error.message).toContain(
      `src/content/${fixture.collection}/${fixture.filename}`,
    );
    expect(cause).toBeInstanceOf(Error);
    expect(error.message).toContain((cause as Error).message);
  });
});
