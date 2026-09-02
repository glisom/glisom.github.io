import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { assertLegacyImageAsset } from '../../scripts/lib/legacy-markdown';
import { resolveLocalImage } from '../../src/lib/media';

interface ImageOracleEntry {
  assetKey: string;
  width: number;
  height: number;
}

describe('local image resolver', () => {
  it('eagerly resolves a migrated image by stable asset key', () => {
    const image = resolveLocalImage('legacy/f159196842.png');
    expect(image.width).toBe(1594);
    expect(image.height).toBe(878);
  });

  it('reports the missing asset key', () => {
    expect(() => resolveLocalImage('legacy/missing.png')).toThrow(
      /legacy\/missing\.png/,
    );
  });

  it('matches source bytes and independent metadata for all 16 copied assets', async () => {
    const repositoryRoot = resolve(new URL('../..', import.meta.url).pathname);
    const oracle = JSON.parse(
      await readFile(
        resolve(repositoryRoot, 'tests/fixtures/migration/image-oracle.json'),
        'utf8',
      ),
    ) as Record<string, ImageOracleEntry>;
    expect(Object.keys(oracle)).toHaveLength(16);

    for (const [publicPath, expected] of Object.entries(oracle)) {
      const fileName = publicPath.slice('/images/'.length);
      const sourceBytes = await readFile(
        resolve(repositoryRoot, 'images', fileName),
      );
      const copiedBytes = await readFile(
        resolve(repositoryRoot, 'src/assets', expected.assetKey),
      );
      expect(copiedBytes.equals(sourceBytes), publicPath).toBe(true);

      const sourceMetadata = await sharp(sourceBytes).metadata();
      const copiedMetadata = await sharp(copiedBytes).metadata();
      expect(
        { width: sourceMetadata.width, height: sourceMetadata.height },
        `${publicPath} source metadata`,
      ).toEqual({ width: expected.width, height: expected.height });
      expect(
        { width: copiedMetadata.width, height: copiedMetadata.height },
        `${publicPath} copied metadata`,
      ).toEqual({ width: expected.width, height: expected.height });

      const imported = resolveLocalImage(expected.assetKey);
      expect(
        { width: imported.width, height: imported.height },
        `${publicPath} imported metadata`,
      ).toEqual({ width: expected.width, height: expected.height });
      expect(() => assertLegacyImageAsset(publicPath)).not.toThrow();
    }
  });
});
