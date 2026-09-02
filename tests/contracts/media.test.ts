import { describe, expect, it } from 'vitest';
import { resolveLocalImage } from '../../src/lib/media';

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
});
