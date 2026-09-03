import { load } from 'cheerio';
import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';
import { mdxToMdast } from 'satteri';
import { SITE } from '../../data/site';

const markdown = new MarkdownIt({
  html: true,
  linkify: false,
  typographer: false,
});
const componentAttribute = /([A-Za-z][\w:-]*)=(?:"([^"]*)"|'([^']*)')/g;
const headingWithExplicitId =
  /^(\s{0,3}#{1,6}\s+.*?)(?:\s+\\?\{#[^{}\s]+\\?\})(\s*#*\s*)$/;

export type RssSourceFormat = 'md' | 'mdx';

interface SourceRange {
  start: number;
  end: number;
}

function mdxEsmRanges(
  body: string,
  protectedLines: ReadonlySet<number>,
): SourceRange[] {
  const tree = mdxToMdast(body, { position: true });
  if (tree.type !== 'root') {
    throw new Error('Expected the MDX parser to return a root node.');
  }

  return tree.children
    .filter((node) => node.type === 'mdxjsEsm')
    .map((node) => {
      const position = node.position;
      if (
        !position ||
        position.start.offset === undefined ||
        position.end.offset === undefined
      ) {
        throw new Error('Expected every MDX ESM node to have source offsets.');
      }
      const start = position.start.offset;
      const end = position.end.offset;
      const firstLine = position.start.line - 1;
      const lastLineExclusive =
        position.end.column === 1 ? position.end.line - 1 : position.end.line;
      for (let line = firstLine; line < lastLineExclusive; line += 1) {
        if (protectedLines.has(line)) return undefined;
      }
      return { start, end };
    })
    .filter((range): range is SourceRange => range !== undefined);
}

function stripMdxEsm(
  body: string,
  sourceFormat: RssSourceFormat,
  protectedLines: ReadonlySet<number>,
): string {
  if (sourceFormat === 'md') return body;

  return mdxEsmRanges(body, protectedLines)
    .toSorted((left, right) => right.start - left.start)
    .reduce((source, range) => {
      const preservedNewlines = source
        .slice(range.start, range.end)
        .replace(/[^\r\n]/g, '');
      return (
        source.slice(0, range.start) +
        preservedNewlines +
        source.slice(range.end)
      );
    }, body);
}

function protectedMarkdownLines(body: string): ReadonlySet<number> {
  const protectedLines = new Set<number>();

  for (const token of markdown.parse(body, {})) {
    if ((token.type !== 'fence' && token.type !== 'code_block') || !token.map) {
      continue;
    }

    for (let line = token.map[0]; line < token.map[1]; line += 1) {
      protectedLines.add(line);
    }
  }

  return protectedLines;
}

function parseAttributes(source: string): Readonly<Record<string, string>> {
  const attributes: Record<string, string> = {};
  for (const match of source.matchAll(componentAttribute)) {
    attributes[match[1]] = match[2] ?? match[3] ?? '';
  }
  return attributes;
}

function escapeMarkdownLabel(value: string): string {
  return value.replace(/([\\[\]])/g, '\\$1');
}

function transformGeneratedComponent(
  line: string,
  postTitle: string,
): string | undefined {
  const embed = /^\s*<EmbedFrame\s+([\s\S]*?)\s*\/>\s*$/.exec(line);
  if (embed) {
    const attributes = parseAttributes(embed[1]);
    if (!attributes.src) return '';
    const label = attributes.title || `Spotify playlist: ${postTitle}`;
    return `[${escapeMarkdownLabel(label)}](${attributes.src})`;
  }

  const figure = /^\s*<Figure\s+([\s\S]*?)\s*\/>\s*$/.exec(line);
  if (figure) {
    const attributes = parseAttributes(figure[1]);
    if (!attributes.src) return '';
    return `![${escapeMarkdownLabel(attributes.alt ?? '')}](${attributes.src})`;
  }

  return undefined;
}

function prepareMarkdown(
  body: string,
  postTitle: string,
  sourceFormat: RssSourceFormat,
): string {
  const output: string[] = [];
  const protectedLines = protectedMarkdownLines(body);
  const lines = stripMdxEsm(body, sourceFormat, protectedLines).split(
    /\r\n|\r|\n/,
  );

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (protectedLines.has(index)) {
      output.push(line);
      continue;
    }

    const component = transformGeneratedComponent(line, postTitle);
    if (component !== undefined) {
      output.push(component);
      continue;
    }

    output.push(line.replace(headingWithExplicitId, '$1$2'));
  }

  return output.join('\n');
}

function rewriteInternalUrls(html: string): string {
  const $ = load(html, null, false);
  $('[href], [src]').each((_, element) => {
    for (const attribute of ['href', 'src'] as const) {
      const value = $(element).attr(attribute);
      if (!value?.startsWith('/') || value.startsWith('//')) continue;
      $(element).attr(attribute, new URL(value, SITE.origin).href);
    }
  });
  return $.html();
}

export function renderRssBody(
  body: string,
  postTitle: string,
  sourceFormat: RssSourceFormat,
): string {
  const rendered = markdown.render(
    prepareMarkdown(body, postTitle, sourceFormat),
  );
  const sanitized = sanitizeHtml(rendered, {
    allowedTags: [
      'a',
      'blockquote',
      'br',
      'code',
      'del',
      'div',
      'em',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'hr',
      'iframe',
      'img',
      'li',
      'ol',
      'p',
      'pre',
      'span',
      'strong',
      'table',
      'tbody',
      'td',
      'th',
      'thead',
      'tr',
      'ul',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'class', 'target', 'rel'],
      code: ['class'],
      div: ['class'],
      iframe: [
        'src',
        'title',
        'loading',
        'allow',
        'allowfullscreen',
        'width',
        'height',
        'frameborder',
      ],
      img: ['src', 'alt', 'title', 'class', 'width', 'height', 'loading'],
      span: ['class'],
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      img: ['http', 'https'],
    },
    allowedIframeHostnames: ['open.spotify.com'],
    allowProtocolRelative: true,
  });

  return rewriteInternalUrls(sanitized);
}
