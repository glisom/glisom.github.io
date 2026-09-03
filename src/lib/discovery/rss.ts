import { load } from 'cheerio';
import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';
import { mdxToMdast, type MdastNode } from 'satteri';
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
  startLine: number;
  endLineExclusive: number;
}

interface MarkdownCodeRange extends SourceRange {
  type: 'fence' | 'code_block';
}

interface SatteriCodeRange {
  range: SourceRange;
  value: string;
  lang?: string | null;
  meta?: string | null;
  inMarkdownContainer: boolean;
}

interface SourceEdit {
  start: number;
  end: number;
  replacement: string;
}

function rangeForNode(node: MdastNode): SourceRange {
  const position = node.position;
  if (
    !position ||
    position.start.offset === undefined ||
    position.end.offset === undefined
  ) {
    throw new Error(`Expected ${node.type} to have source offsets.`);
  }

  return {
    start: position.start.offset,
    end: position.end.offset,
    startLine: position.start.line - 1,
    endLineExclusive:
      position.end.column === 1 ? position.end.line - 1 : position.end.line,
  };
}

function visitMdast(
  node: MdastNode,
  visitor: (node: MdastNode, ancestors: readonly MdastNode[]) => void,
  ancestors: readonly MdastNode[] = [],
): void {
  visitor(node, ancestors);
  if (!('children' in node)) return;
  for (const child of node.children) {
    visitMdast(child, visitor, [...ancestors, node]);
  }
}

function satteriRanges(body: string): {
  esmRanges: SourceRange[];
  codeRanges: SatteriCodeRange[];
} {
  const tree = mdxToMdast(body, { position: true });
  if (tree.type !== 'root') {
    throw new Error('Expected the MDX parser to return a root node.');
  }

  const esmRanges: SourceRange[] = [];
  const codeRanges: SatteriCodeRange[] = [];
  visitMdast(tree, (node, ancestors) => {
    if (node.type === 'mdxjsEsm') esmRanges.push(rangeForNode(node));
    if (node.type === 'code') {
      codeRanges.push({
        range: rangeForNode(node),
        value: node.value,
        lang: node.lang,
        meta: node.meta,
        inMarkdownContainer: ancestors.some(
          (ancestor) =>
            ancestor.type === 'blockquote' || ancestor.type === 'listItem',
        ),
      });
    }
  });
  return { esmRanges, codeRanges };
}

function lineStartOffsets(body: string): number[] {
  const offsets = [0];
  for (let index = 0; index < body.length; index += 1) {
    if (body[index] === '\r' && body[index + 1] === '\n') index += 1;
    if (body[index] === '\r' || body[index] === '\n') {
      offsets.push(index + 1);
    }
  }
  return offsets;
}

function markdownCodeRanges(body: string): MarkdownCodeRange[] {
  const lineStarts = lineStartOffsets(body);
  return markdown
    .parse(body, {})
    .filter(
      (token) =>
        (token.type === 'fence' || token.type === 'code_block') && token.map,
    )
    .map((token) => {
      const [startLine, endLineExclusive] = token.map as [number, number];
      return {
        start: lineStarts[startLine] ?? body.length,
        end: lineStarts[endLineExclusive] ?? body.length,
        startLine,
        endLineExclusive,
        type: token.type as MarkdownCodeRange['type'],
      };
    });
}

function containsOffset(range: SourceRange, offset: number): boolean {
  return range.start <= offset && offset < range.end;
}

function containsRange(container: SourceRange, nested: SourceRange): boolean {
  return container.start <= nested.start && nested.end <= container.end;
}

function sourceLineEnding(source: string): string {
  return /\r\n|\r|\n/.exec(source)?.[0] ?? '\n';
}

function stripBlockquoteDepth(
  line: string,
  blockquoteDepth: number,
): string | undefined {
  let remainder = line;
  for (let depth = 0; depth < blockquoteDepth; depth += 1) {
    const marker = /^[\t ]*>[\t ]?/.exec(remainder);
    if (!marker) return undefined;
    remainder = remainder.slice(marker[0].length);
  }
  return remainder.trim();
}

function isClosedFence(source: string, linePrefix: string): boolean {
  const lines = source.split(/\r\n|\r|\n/);
  const opening = /^(`{3,}|~{3,})/.exec(lines[0] ?? '');
  if (!opening || lines.length < 2) return false;

  const lastLine = lines.at(-1) ?? '';
  const candidates = [lastLine.trim()];
  if (linePrefix !== '' && lastLine.startsWith(linePrefix)) {
    candidates.push(lastLine.slice(linePrefix.length).trim());
  }
  const blockquoteDepth = linePrefix.match(/>/g)?.length ?? 0;
  if (blockquoteDepth > 0) {
    const normalized = stripBlockquoteDepth(lastLine, blockquoteDepth);
    if (normalized !== undefined) candidates.push(normalized);
  }

  return candidates.some(
    (closing) =>
      closing.length >= opening[1].length &&
      [...closing].every((character) => character === opening[1][0]),
  );
}

function canonicalFence(
  code: SatteriCodeRange,
  source: string,
  linePrefix: string,
): string {
  const lineEnding = sourceLineEnding(source);
  const value = code.value.replace(/\r\n|\r|\n/g, lineEnding);
  const longestTildeRun = Math.max(
    0,
    ...[...value.matchAll(/~+/g)].map((match) => match[0].length),
  );
  const marker = '~'.repeat(Math.max(3, longestTildeRun + 1));
  const info = [code.lang, code.meta]
    .filter((value): value is string => Boolean(value))
    .join(' ');
  const opening = info === '' ? marker : `${marker} ${info}`;

  if (!isClosedFence(source, linePrefix)) {
    return `${opening}${lineEnding}${value}`;
  }
  return `${opening}${lineEnding}${value}${lineEnding}${marker}`;
}

function needsBlankLineBefore(body: string, offset: number): boolean {
  if (offset === 0) return false;
  const prefix = body.slice(0, offset);
  const withoutLastEnding = prefix.replace(/(?:\r\n|\r|\n)$/, '');
  if (withoutLastEnding === prefix) return true;
  const previousLine = withoutLastEnding.split(/\r\n|\r|\n/).at(-1) ?? '';
  return previousLine.trim() !== '';
}

function startsWithListMarker(linePrefix: string): boolean {
  const withoutBlockquotes = linePrefix.replace(/^(?:[\t ]*>[\t ]*)+/, '');
  return /^(?:[\t ]*)(?:[-+*]|\d+[.)])[\t ]+$/.test(withoutBlockquotes);
}

function canonicalCodeEdit(
  body: string,
  lineStarts: readonly number[],
  code: SatteriCodeRange,
): SourceEdit {
  const lineStart = lineStarts[code.range.startLine] ?? code.range.start;
  const linePrefix = body.slice(lineStart, code.range.start);
  const liftFromListMarker = startsWithListMarker(linePrefix);
  const preserveLinePrefix =
    !liftFromListMarker &&
    (code.inMarkdownContainer || !/^[\t ]*$/.test(linePrefix));
  const start = preserveLinePrefix ? code.range.start : lineStart;
  const original = body.slice(code.range.start, code.range.end);
  const lineEnding = sourceLineEnding(original);
  const canonical = canonicalFence(code, original, linePrefix);
  const prefixedCanonical = preserveLinePrefix
    ? canonical.replaceAll(lineEnding, `${lineEnding}${linePrefix}`)
    : canonical;
  const boundary = needsBlankLineBefore(body, lineStart)
    ? preserveLinePrefix
      ? `${lineEnding}${linePrefix}`
      : lineEnding
    : '';

  return {
    start,
    end: code.range.end,
    replacement: `${boundary}${prefixedCanonical}`,
  };
}

function applySourceEdits(body: string, edits: readonly SourceEdit[]): string {
  if (edits.length === 0) return body;

  return edits
    .toSorted((left, right) => right.start - left.start)
    .reduce((source, edit) => {
      return (
        source.slice(0, edit.start) + edit.replacement + source.slice(edit.end)
      );
    }, body);
}

function prepareSourceSyntax(
  body: string,
  sourceFormat: RssSourceFormat,
): string {
  if (sourceFormat === 'md') return body;

  const lineStarts = lineStartOffsets(body);
  const markdownRanges = markdownCodeRanges(body);
  const { esmRanges, codeRanges } = satteriRanges(body);
  // A Markdown-looking token that begins inside ESM is JavaScript text (often
  // a comment), not a code block that can override the MDX parser's ESM node.
  const genuineMarkdownRanges = markdownRanges.filter(
    (range) =>
      !esmRanges.some((esmRange) => containsOffset(esmRange, range.start)),
  );
  const protectedCodeRanges = [
    ...codeRanges.map((code) => code.range),
    ...genuineMarkdownRanges,
  ];
  const removableEsmRanges = esmRanges.filter(
    (esmRange) =>
      !protectedCodeRanges.some((codeRange) =>
        containsOffset(codeRange, esmRange.start),
      ),
  );
  // Keep source bytes when Markdown-It already protects the complete Satteri
  // node. Otherwise materialize that node as an unambiguous fenced block so
  // adjacent MDX JSX cannot make Markdown-It treat its contents as live HTML.
  const canonicalCodeRanges = codeRanges.filter(
    (code) =>
      !genuineMarkdownRanges.some((range) => containsRange(range, code.range)),
  );
  const edits: SourceEdit[] = [
    ...removableEsmRanges.map((range) => ({
      start: range.start,
      end: range.end,
      replacement: body.slice(range.start, range.end).replace(/[^\r\n]/g, ''),
    })),
    ...canonicalCodeRanges.map((code) =>
      canonicalCodeEdit(body, lineStarts, code),
    ),
  ];

  return applySourceEdits(body, edits);
}

function protectedLines(ranges: readonly SourceRange[]): ReadonlySet<number> {
  const protectedLines = new Set<number>();
  for (const range of ranges) {
    for (let line = range.startLine; line < range.endLineExclusive; line += 1) {
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

function ensureBlankBoundary(output: string[]): void {
  if (output.length > 0 && output.at(-1)?.trim() !== '') output.push('');
}

function appendFlowBlock(output: string[], block: string): void {
  ensureBlankBoundary(output);
  if (block !== '') output.push(block);
  ensureBlankBoundary(output);
}

function prepareMarkdown(
  body: string,
  postTitle: string,
  sourceFormat: RssSourceFormat,
): string {
  const output: string[] = [];
  const source = prepareSourceSyntax(body, sourceFormat);
  const protectedLineNumbers = protectedLines(markdownCodeRanges(source));
  const lines = source.split(/\r\n|\r|\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (protectedLineNumbers.has(index)) {
      output.push(line);
      continue;
    }

    const component = transformGeneratedComponent(line, postTitle);
    if (component !== undefined) {
      appendFlowBlock(output, component);
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
