import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import {
  extractLegalHtml,
  extractLegalMarkdown,
} from '../../scripts/lib/legal-semantic';

const fixtureUrl = new URL(
  '../fixtures/listwithme-legal.json',
  import.meta.url,
);
const supportUrl = new URL(
  '../../_pages/listwithme-support.md',
  import.meta.url,
);
const privacyUrl = new URL(
  '../../_pages/listwithme-privacy.md',
  import.meta.url,
);

describe('ListWithMe legal semantic contract', () => {
  it('matches the frozen support and privacy sources', async () => {
    const fixture = JSON.parse(await readFile(fixtureUrl, 'utf8'));
    const [support, privacy] = await Promise.all([
      readFile(supportUrl, 'utf8'),
      readFile(privacyUrl, 'utf8'),
    ]);

    expect(extractLegalMarkdown(support)).toEqual(fixture.support);
    expect(extractLegalMarkdown(privacy)).toEqual(fixture.privacy);
  });

  it('detects changed legal claims and email destinations', async () => {
    const fixture = JSON.parse(await readFile(fixtureUrl, 'utf8'));
    const support = await readFile(supportUrl, 'utf8');
    const changedClaim = support.replace(
      "We don't collect any personal data or analytics.",
      'We collect analytics.',
    );
    const changedEmail = support.replace(
      'mailto:grant.isom@gmail.com',
      'mailto:privacy@example.com',
    );

    expect(extractLegalMarkdown(changedClaim)).not.toEqual(fixture.support);
    expect(extractLegalMarkdown(changedEmail)).not.toEqual(fixture.support);
  });

  it('reads only the marked title and content from rendered legal pages', () => {
    const html = `
      <nav><a href="/listwithme/">Back to ListWithMe</a></nav>
      <h1 data-legal-title>ListWithMe Support</h1>
      <aside><a href="#contact">Table of contents</a></aside>
      <main data-legal-content>
        <h2 id="contact">Contact</h2>
        <p> Email <a href="mailto:grant.isom@gmail.com">Grant</a> for help. </p>
        <ul><li>First item</li><li>Second <a href="/listwithme/privacy/">policy</a></li></ul>
      </main>
    `;

    expect(extractLegalHtml(html)).toEqual({
      title: 'ListWithMe Support',
      blocks: [
        { kind: 'heading', level: 2, text: 'Contact' },
        {
          kind: 'paragraph',
          text: 'Email Grant for help.',
          links: [{ text: 'Grant', href: 'mailto:grant.isom@gmail.com' }],
        },
        {
          kind: 'list',
          ordered: false,
          items: [
            { text: 'First item', links: [] },
            {
              text: 'Second policy',
              links: [{ text: 'policy', href: '/listwithme/privacy/' }],
            },
          ],
        },
      ],
    });
  });
});
