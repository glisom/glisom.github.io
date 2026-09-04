import { expect, test } from 'vitest';
import { e2eNetworkPolicy } from '../helpers/e2e-network-contract';

test('E2E network defaults deny while known integrations are fulfilled locally', () => {
  expect(e2eNetworkPolicy('http://127.0.0.1:4321/blog/')).toBe('continue');
  expect(e2eNetworkPolicy('http://localhost:4321/image.png')).toBe('continue');
  expect(e2eNetworkPolicy('https://utteranc.es/client.js')).toBe('fulfill');
  expect(e2eNetworkPolicy('https://open.spotify.com/embed/playlist')).toBe(
    'fulfill',
  );
  expect(e2eNetworkPolicy('https://apps.apple.com/app/example')).toBe('abort');
  expect(e2eNetworkPolicy('https://example.com/analytics.js')).toBe('abort');
});
