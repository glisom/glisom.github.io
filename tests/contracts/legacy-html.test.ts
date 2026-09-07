import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { validateLegacyHtml } from '../../scripts/lib/legacy-html';

describe('legacy HTML validation', () => {
  it('accepts the exact authored and generated allowlist', () => {
    expect(() =>
      validateLegacyHtml('<span class="note">Safe</span>'),
    ).not.toThrow();
    expect(() =>
      validateLegacyHtml(
        '<iframe src="https://open.spotify.com/embed/playlist/abc" title="Playlist"></iframe>',
      ),
    ).not.toThrow();
    expect(() =>
      validateLegacyHtml(
        '<Figure src="/images/logo.png" assetKey="legacy/logo.png" alt="Logo" width={350} height={43} />',
      ),
    ).not.toThrow();
  });

  it('rejects unsafe elements, attributes, URLs, and embed hosts', () => {
    expect(() => validateLegacyHtml('<script>alert(1)</script>')).toThrow(
      /script/,
    );
    expect(() =>
      validateLegacyHtml('<img src="x" onerror="alert(1)">'),
    ).toThrow(/onerror/);
    expect(() =>
      validateLegacyHtml('<a href="javascript:alert(1)">x</a>'),
    ).toThrow(/javascript/);
    expect(() =>
      validateLegacyHtml('<iframe src="https://example.com/embed"></iframe>'),
    ).toThrow(/Spotify/);
  });

  it('ignores angle-bracket examples in fenced and indented code', () => {
    expect(() =>
      validateLegacyHtml('```html\n<your_bundle_id>\n```'),
    ).not.toThrow();
    expect(() =>
      validateLegacyHtml('    <script>document.example()</script>'),
    ).not.toThrow();
  });

  it('rejects every unsafe fragment in the representative fixture', async () => {
    const source = await readFile(
      new URL('../fixtures/migration/unsafe-script.md', import.meta.url),
      'utf8',
    );
    expect(() => validateLegacyHtml(source)).toThrow(/script/);
    expect(() =>
      validateLegacyHtml(source.replace('<script>alert(1)</script>', '')),
    ).toThrow(/onerror/);
  });

  it('does not exempt malformed or extra generated component attributes', () => {
    expect(() =>
      validateLegacyHtml(
        '<Figure src="/images/logo.png" assetKey="legacy/logo.png" alt="Logo" width={350} height={43} onerror="x" />',
      ),
    ).toThrow(/Figure/);
    expect(() =>
      validateLegacyHtml(
        '<EmbedFrame src="https://example.com/embed" title="Example" />',
      ),
    ).toThrow(/EmbedFrame/);
  });
});
