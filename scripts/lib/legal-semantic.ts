import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';

export interface LegalLink {
  text: string;
  href: string;
}

export type LegalBlock =
  | { kind: 'heading'; level: 2 | 3; text: string }
  | { kind: 'paragraph'; text: string; links: readonly LegalLink[] }
  | {
      kind: 'list';
      ordered: boolean;
      items: readonly { text: string; links: readonly LegalLink[] }[];
    };

export interface LegalSemantic {
  title: string;
  blocks: readonly LegalBlock[];
}

const markdown = new MarkdownIt();

function normalize(value: string): string {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function linksFrom(
  $: ReturnType<typeof cheerio.load>,
  element: cheerio.Cheerio<Element>,
): LegalLink[] {
  return element
    .find('a[href]')
    .map((_, link) => ({
      text: normalize($(link).text()),
      href: $(link).attr('href') ?? '',
    }))
    .get();
}

function blocksFrom(
  $: ReturnType<typeof cheerio.load>,
  content: cheerio.Cheerio<Element>,
): LegalBlock[] {
  const blocks: LegalBlock[] = [];
  content.children('h2, h3, p, ul, ol').each((_, element) => {
    const block = $(element);
    if (element.tagName === 'h2' || element.tagName === 'h3') {
      blocks.push({
        kind: 'heading',
        level: Number(element.tagName.slice(1)) as 2 | 3,
        text: normalize(block.text()),
      });
      return;
    }
    if (element.tagName === 'p') {
      blocks.push({
        kind: 'paragraph',
        text: normalize(block.text()),
        links: linksFrom($, block),
      });
      return;
    }
    blocks.push({
      kind: 'list',
      ordered: element.tagName === 'ol',
      items: block
        .children('li')
        .map((_, item) => {
          const listItem = $(item);
          return {
            text: normalize(listItem.text()),
            links: linksFrom($, listItem),
          };
        })
        .get(),
    });
  });
  return blocks;
}

export function extractLegalMarkdown(markdownSource: string): LegalSemantic {
  const source = matter(markdownSource).content;
  const $ = cheerio.load(
    `<main data-legal-content>${markdown.render(source)}</main>`,
  );
  const content = $('[data-legal-content]').first();
  return {
    title: normalize(content.children('h1').first().text()),
    blocks: blocksFrom($, content),
  };
}

export function extractLegalHtml(html: string): LegalSemantic {
  const $ = cheerio.load(html);
  const title = $('[data-legal-title]').first();
  const content = $('[data-legal-content]').first();
  return {
    title: normalize(title.text()),
    blocks: blocksFrom($, content),
  };
}
