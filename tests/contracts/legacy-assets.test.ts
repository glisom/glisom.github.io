import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const root = new URL('../../public/', import.meta.url);
const digest = async (path: string) =>
  createHash('sha256').update(await readFile(new URL(path.replace(/^\//, ''), root))).digest('hex');

describe('legacy asset contract', () => {
  it('preserves every original and exact-byte alias', async () => {
    const fixture = JSON.parse(
      await readFile(new URL('../fixtures/legacy-assets.json', import.meta.url), 'utf8'),
    );
    expect(fixture.assets).toHaveLength(24);
    for (const asset of fixture.assets) {
      expect(await digest(asset.path)).toBe(asset.sha256);
      if (asset.aliasOf) expect(await digest(asset.path)).toBe(await digest(asset.aliasOf));
    }
  });

  it('preserves the custom domain', async () => {
    expect((await readFile(new URL('CNAME', root), 'utf8')).trim()).toBe('grantisom.com');
  });
});
