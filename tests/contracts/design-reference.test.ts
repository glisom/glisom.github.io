import { describe, expect, it } from 'vitest';
import {
  verifyApprovedMockups,
  verifyDesignReference,
} from '../../scripts/verify-design-reference.mjs';

describe('frozen Vite reference', () => {
  it('contains exactly the approved source with matching checksums', async () => {
    await expect(
      verifyDesignReference(
        new URL('../../design-reference/vite-homepage/', import.meta.url),
      ),
    ).resolves.toBeUndefined();
    await expect(
      verifyApprovedMockups(new URL('../../', import.meta.url)),
    ).resolves.toBeUndefined();
  });
});
