import { createHash } from 'node:crypto';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, test } from 'vitest';
import { makeComparison } from '../../scripts/make-comparison.mjs';

const repositoryRoot = new URL('../../', import.meta.url);

const baselineCases = [
  'homepage-desktop',
  'homepage-tablet',
  'homepage-phone',
  'article-listwithme-desktop',
  'article-listwithme-tablet',
  'article-listwithme-phone',
  'index-blog-desktop',
  'index-blog-tablet',
  'index-blog-phone',
  'index-app-library-desktop',
  'index-app-library-phone',
  'index-my-apps-desktop',
  'index-my-apps-phone',
  'index-skill-library-desktop',
  'index-skill-library-phone',
  'index-my-skills-desktop',
  'index-my-skills-phone',
  'detail-my-app-desktop',
  'detail-my-app-tablet',
  'detail-my-app-phone',
  'detail-used-app-desktop',
  'detail-used-app-phone',
  'detail-used-skill-desktop',
  'detail-used-skill-phone',
  'detail-my-skill-desktop',
  'detail-my-skill-phone',
] as const;

const interactionCases = [
  'interaction-mobile-browse-open-phone',
  'interaction-keyboard-focus-desktop',
  'interaction-expanded-toc-phone',
] as const;

const viewports = {
  desktop: { width: 1586, height: 992 },
  tablet: { width: 1024, height: 768 },
  phone: { width: 390, height: 844 },
} as const;

describe('visual comparison release-gate artifacts', () => {
  test('every baseline has explicit viewport and full-page captures while interactions stay viewport-only', async () => {
    const manifest = JSON.parse(
      await readFile(
        new URL(
          '../../docs/qa/visual-comparisons/manifest.json',
          import.meta.url,
        ),
        'utf8',
      ),
    ) as {
      count: number;
      entries: Array<{
        path: string;
        sha256: string;
        width: number;
        height: number;
        mode: 'viewport' | 'full-page';
        leftRole: string;
        rightRole: string;
        left: { path: string; sha256: string; width: number; height: number };
        right: { path: string; sha256: string; width: number; height: number };
      }>;
    };
    const filenames = manifest.entries.map(({ path }) =>
      path.split('/').at(-1),
    );

    expect(manifest.count).toBe(55);
    expect(filenames).toEqual(
      [
        ...baselineCases.flatMap((name) => [
          `${name}-viewport.png`,
          `${name}-full-page.png`,
        ]),
        ...interactionCases.map((name) => `${name}-viewport.png`),
      ].toSorted(),
    );
    for (const name of [
      'interaction-mobile-browse-open-phone',
      'interaction-expanded-toc-phone',
    ]) {
      expect(
        manifest.entries.find(({ path }) =>
          path.endsWith(`${name}-viewport.png`),
        ),
      ).toMatchObject({ leftRole: 'closed', rightRole: 'open' });
    }
    expect(
      manifest.entries.find(({ path }) =>
        path.endsWith('interaction-keyboard-focus-desktop-viewport.png'),
      ),
    ).toMatchObject({ leftRole: 'reference', rightRole: 'implementation' });
    expect(
      new Set(
        manifest.entries.flatMap(({ left, right }) => [left.path, right.path]),
      ).size,
    ).toBe(110);

    for (const entry of manifest.entries) {
      const project = (
        Object.keys(viewports) as Array<keyof typeof viewports>
      ).find((candidate) => entry.path.includes(`-${candidate}-`));
      expect(project, entry.path).toBeDefined();
      const viewport = viewports[project!];
      expect(entry.path.startsWith('/'), entry.path).toBe(false);
      expect(entry.left.path.startsWith('/'), entry.left.path).toBe(false);
      expect(entry.right.path.startsWith('/'), entry.right.path).toBe(false);
      for (const artifact of [entry, entry.left, entry.right]) {
        await expect(
          access(new URL(artifact.path, repositoryRoot)),
        ).resolves.toBeUndefined();
        const bytes = await readFile(new URL(artifact.path, repositoryRoot));
        expect(
          createHash('sha256').update(bytes).digest('hex'),
          artifact.path,
        ).toBe(artifact.sha256);
        await expect(sharp(bytes).metadata()).resolves.toMatchObject({
          width: artifact.width,
          height: artifact.height,
        });
      }
      expect(entry.width).toBe(
        Math.max(entry.left.width, entry.right.width) * 2 + 28,
      );
      expect(entry.height).toBe(
        Math.max(entry.left.height, entry.right.height),
      );
      if (entry.mode === 'viewport') {
        expect([entry.left.width, entry.left.height], entry.left.path).toEqual([
          viewport.width,
          viewport.height,
        ]);
        expect(
          [entry.right.width, entry.right.height],
          entry.right.path,
        ).toEqual([viewport.width, viewport.height]);
      } else {
        const frozenArticleOverflow = entry.path.includes('article-listwithme')
          ? { tablet: 1043, phone: 413 }[project! as 'tablet' | 'phone']
          : undefined;
        expect(entry.left.width, entry.left.path).toBe(
          frozenArticleOverflow ?? viewport.width,
        );
        expect(entry.right.width, entry.right.path).toBe(viewport.width);
        expect(entry.left.height, entry.left.path).toBeGreaterThanOrEqual(
          viewport.height,
        );
        expect(entry.right.height, entry.right.path).toBeGreaterThanOrEqual(
          viewport.height,
        );
      }
    }
    await expect(
      access(
        new URL('docs/qa/visual-comparisons/contact-sheet.png', repositoryRoot),
      ),
    ).resolves.toBeUndefined();
  });

  test('full-page comparisons pad unequal source dimensions without resizing either side', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'visual-comparison-'));
    const source = join(directory, 'source.png');
    const implementation = join(directory, 'implementation.png');
    const output = join(directory, 'combined.png');
    const labeledOutput = join(directory, 'labeled.png');
    try {
      await Promise.all([
        sharp({
          create: {
            width: 120,
            height: 150,
            channels: 4,
            background: '#ff0000',
          },
        })
          .png()
          .toFile(source),
        sharp({
          create: {
            width: 100,
            height: 200,
            channels: 4,
            background: '#0000ff',
          },
        })
          .png()
          .toFile(implementation),
      ]);

      await makeComparison(source, implementation, output, {
        allowDimensionPadding: true,
      });
      await makeComparison(source, implementation, labeledOutput, {
        allowDimensionPadding: true,
        labels: { left: 'CLOSED', right: 'OPEN' },
      });

      await expect(sharp(output).metadata()).resolves.toMatchObject({
        width: 268,
        height: 200,
      });
      expect(await readFile(labeledOutput)).not.toEqual(await readFile(output));
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
