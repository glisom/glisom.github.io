import { describe, expect, it } from 'vitest';
import config from '../../astro.config.mjs';

describe('Astro output contract', () => {
  it('preserves index and dated-file source shapes', () => {
    expect(config.site).toBe('https://grantisom.com');
    expect(config.output).toBe('static');
    expect(config.trailingSlash).toBe('ignore');
    expect(config.build).toMatchObject({ format: 'preserve' });
  });
});
