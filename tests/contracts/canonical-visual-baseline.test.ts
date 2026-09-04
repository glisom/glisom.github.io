import { expect, test } from 'vitest';
import {
  canonicalBaselineMatrix,
  canonicalCaptureSpecs,
  formatMediaDiagnostic,
  mockupControlsToHide,
  requiredVisualFontFaces,
  visualNetworkPolicy,
} from '../helpers/visual-contract';

const pageFamilyStates = [
  ['homepage', 'desktop'],
  ['homepage', 'tablet'],
  ['homepage', 'phone'],
  ['article-listwithme', 'desktop'],
  ['article-listwithme', 'tablet'],
  ['article-listwithme', 'phone'],
  ['index-blog', 'desktop'],
  ['index-blog', 'tablet'],
  ['index-blog', 'phone'],
  ['index-app-library', 'desktop'],
  ['index-app-library', 'phone'],
  ['index-my-apps', 'desktop'],
  ['index-my-apps', 'phone'],
  ['index-skill-library', 'desktop'],
  ['index-skill-library', 'phone'],
  ['index-my-skills', 'desktop'],
  ['index-my-skills', 'phone'],
  ['detail-my-app', 'desktop'],
  ['detail-my-app', 'tablet'],
  ['detail-my-app', 'phone'],
  ['detail-used-app', 'desktop'],
  ['detail-used-app', 'phone'],
  ['detail-used-skill', 'desktop'],
  ['detail-used-skill', 'phone'],
  ['detail-my-skill', 'desktop'],
  ['detail-my-skill', 'phone'],
] as const;

const interactionStates = [
  ['interaction-mobile-browse-open-phone', 'phone'],
  ['interaction-keyboard-focus-desktop', 'desktop'],
  ['interaction-expanded-toc-phone', 'phone'],
] as const;

test('canonical baselines exercise distinct viewport and full-page screenshots', () => {
  expect(canonicalCaptureSpecs('homepage')).toEqual([
    {
      name: 'homepage-viewport.png',
      fullPage: false,
      preloadAllMedia: false,
    },
    {
      name: 'homepage-full-page.png',
      fullPage: true,
      preloadAllMedia: true,
    },
  ]);
});

test('lazy-media failures identify the asset, render state, and nearest record', () => {
  expect(
    formatMediaDiagnostic({
      url: 'http://127.0.0.1:4321/_astro/example.webp',
      loading: 'lazy',
      complete: true,
      naturalWidth: 0,
      currentSrc: 'http://127.0.0.1:4321/_astro/example.webp',
      nearest: '[data-record="listwithme"]',
    }),
  ).toBe(
    'url=http://127.0.0.1:4321/_astro/example.webp loading=lazy complete=true naturalWidth=0 currentSrc=http://127.0.0.1:4321/_astro/example.webp nearest=[data-record="listwithme"]',
  );
});

test('canonical snapshot matrix exactly matches the reviewed comparison matrix', () => {
  const expected = [
    ...pageFamilyStates.flatMap(([name, project]) => [
      `${name}:${project}:viewport`,
      `${name}:${project}:full-page`,
    ]),
    ...interactionStates.map(
      ([name, project]) => `${name}:${project}:viewport`,
    ),
  ].toSorted();

  expect(canonicalBaselineMatrix()).toHaveLength(55);
  expect(
    canonicalBaselineMatrix()
      .map(({ name, project, mode }) => `${name}:${project}:${mode}`)
      .toSorted(),
  ).toEqual(expected);
});

test('reference capture policy removes only mockup companion controls', () => {
  expect(mockupControlsToHide('article', 'desktop')).toEqual([
    '.companion-bar',
  ]);
  expect(mockupControlsToHide('index', 'desktop')).toEqual(['.companion-bar']);
  expect(mockupControlsToHide('index', 'phone')).toEqual([
    '.companion-bar',
    '.mobile-collection-switcher',
  ]);
  expect(mockupControlsToHide('detail', 'tablet')).toEqual([
    '.companion-bar',
    '.type-switcher',
  ]);
});

test('visual network policy fulfills every external dependency from deterministic local bytes', () => {
  expect(visualNetworkPolicy('http://localhost:4173/asset.png')).toBe(
    'continue',
  );
  expect(visualNetworkPolicy('https://fonts.googleapis.com/css2')).toBe(
    'fulfill',
  );
  expect(visualNetworkPolicy('https://fonts.gstatic.com/font.woff2')).toBe(
    'fulfill',
  );
  expect(visualNetworkPolicy('https://utteranc.es/client.js')).toBe('fulfill');
  expect(visualNetworkPolicy('https://open.spotify.com/embed/one')).toBe(
    'fulfill',
  );
  expect(visualNetworkPolicy('https://example.com/tracker.js')).toBe('reject');
  expect(requiredVisualFontFaces()).toEqual([
    ['DM Sans', 400, 'normal'],
    ['DM Sans', 500, 'normal'],
    ['DM Sans', 600, 'normal'],
    ['IBM Plex Mono', 400, 'normal'],
    ['IBM Plex Mono', 500, 'normal'],
    ['Source Serif 4', 400, 'normal'],
    ['Source Serif 4', 400, 'italic'],
    ['Source Serif 4', 600, 'normal'],
  ]);
});
