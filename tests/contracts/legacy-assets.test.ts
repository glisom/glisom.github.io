import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const publicRoot = new URL('../../public/', import.meta.url);
const distRoot = new URL('../../dist/', import.meta.url);
const digest = async (path: string, root: URL) =>
  createHash('sha256')
    .update(await readFile(new URL(path.replace(/^\//, ''), root)))
    .digest('hex');

const expectedPaths = [
  '/assets/js/darkmode.js',
  '/css/main.css',
  '/favicon.ico',
  '/images/45d7f5784d.jpg',
  '/images/475c3984d0.jpg',
  '/images/5f538d59de.jpg',
  '/images/5fd90bfbf1.png',
  '/images/6647450a28.png',
  '/images/7337cde14c.jpg',
  '/images/96ce2ec5a6.jpg',
  '/images/a37debf5ab.jpg',
  '/images/a97bedecb3.jpg',
  '/images/cloud.png',
  '/images/develop_menu.png',
  '/images/e1d2ad7014.jpg',
  '/images/ec18f32904.jpg',
  '/images/f159196842.png',
  '/images/fa6c5dfe53.png',
  '/images/logo.png',
  '/images/safari_settings.png',
  '/uploads/2023/5fd90bfbf1.png',
  '/uploads/2023/6647450a28.png',
  '/uploads/2023/f159196842.png',
  '/uploads/2023/fa6c5dfe53.png',
];

describe('legacy asset contract', () => {
  it('preserves every original and exact-byte alias', async () => {
    const fixture = JSON.parse(
      await readFile(new URL('../fixtures/legacy-assets.json', import.meta.url), 'utf8'),
    );
    expect(fixture.assets).toHaveLength(24);
    const paths = fixture.assets.map((asset: { path: string }) => asset.path);
    expect(new Set(paths).size).toBe(paths.length);
    expect([...paths].sort()).toEqual([...expectedPaths].sort());
    for (const asset of fixture.assets) {
      expect(await digest(asset.path, publicRoot)).toBe(asset.sha256);
      expect(await digest(`/${asset.outputPath}`, distRoot)).toBe(asset.sha256);
      if (asset.aliasOf) {
        expect(await digest(asset.path, publicRoot)).toBe(await digest(asset.aliasOf, publicRoot));
        expect(await digest(`/${asset.outputPath}`, distRoot)).toBe(
          await digest(asset.aliasOf, distRoot),
        );
      }
    }
  });

  it('preserves the custom domain', async () => {
    expect((await readFile(new URL('CNAME', publicRoot), 'utf8')).trim()).toBe('grantisom.com');
  });
});
