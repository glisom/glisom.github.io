import { expect, test } from 'vitest';
import { e2eNetworkPolicy } from '../helpers/e2e-network-contract';

test('E2E network defaults deny while known integrations are fulfilled locally', () => {
  const allowedOrigins = [
    'http://127.0.0.1:4321',
    'http://127.0.0.1:4173',
    'http://127.0.0.1:4174',
  ];
  expect(e2eNetworkPolicy('http://127.0.0.1:4321/blog/', allowedOrigins)).toBe(
    'continue',
  );
  expect(
    e2eNetworkPolicy('http://127.0.0.1:4173/asset.png', allowedOrigins),
  ).toBe('continue');
  expect(
    e2eNetworkPolicy('http://localhost:4321/image.png', allowedOrigins),
  ).toBe('abort');
  expect(
    e2eNetworkPolicy('http://127.0.0.1:9999/private', allowedOrigins),
  ).toBe('abort');
  expect(
    e2eNetworkPolicy('https://utteranc.es/client.js', allowedOrigins),
  ).toBe('fulfill');
  expect(
    e2eNetworkPolicy('https://open.spotify.com/embed/playlist', allowedOrigins),
  ).toBe('fulfill');
  expect(
    e2eNetworkPolicy('https://apps.apple.com/app/example', allowedOrigins),
  ).toBe('abort');
  expect(
    e2eNetworkPolicy('https://example.com/analytics.js', allowedOrigins),
  ).toBe('abort');
});
