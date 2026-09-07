import { createProcessor } from '@mdx-js/mdx';
import { load } from 'cheerio';
import type { Nodes } from 'mdast';
import MarkdownIt, { type StateBlock, type StateCore } from 'markdown-it';
import sanitizeHtml from 'sanitize-html';
import { SITE } from '../../data/site';

const markdown = new MarkdownIt({
  html: true,
  linkify: false,
  typographer: false,
});
const mdxParser = createProcessor({ format: 'mdx' });
const figureAttribute = /^(?:alt|assetKey|height|src|variant|width)$/;
const figureVariant = /^(?:full|gallery|portrait|wide)$/;
const passthroughElement = /^(?:a|br|div|iframe|img|span)$/;

export type RssSourceFormat = 'md' | 'mdx';

type Node = Nodes;
type JsxNode = Extract<Node, { attributes: unknown }>;
type AttributeValue = Extract<
  JsxNode['attributes'][number],
  { name: string }
>['value'];
type Component =
  | { kind: 'figure'; src: string; alt: string }
  | { kind: 'embed'; src: string; label: string };

function nodeRange(node: Node) {
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
    line: position.start.line - 1,
    column: position.start.column - 1,
    endLine:
      position.end.column === 1 ? position.end.line - 1 : position.end.line,
  };
}

type Range = ReturnType<typeof nodeRange>;
type Edit = Pick<Range, 'start' | 'end'> & { replacement: string };
type Block = Range &
  (
    | { kind: 'component'; component: Component }
    | { kind: 'passthrough'; html: string }
  );
type RssEnvironment = { rssBlocks?: ReadonlyMap<string, Block> };

function visit(
  node: Node,
  visitor: (node: Node, ancestors: readonly Node[]) => void,
  ancestors: readonly Node[] = [],
): void {
  visitor(node, ancestors);
  if ('children' in node) {
    for (const child of node.children) {
      visit(child, visitor, [...ancestors, node]);
    }
  }
}

function applyEdits(source: string, edits: readonly Edit[]): string {
  let result = source;
  for (const edit of edits.toSorted(
    (left, right) => right.start - left.start,
  )) {
    result =
      result.slice(0, edit.start) + edit.replacement + result.slice(edit.end);
  }
  return result;
}

function attributes(node: JsxNode): Map<string, AttributeValue> | undefined {
  const result = new Map<string, AttributeValue>();
  for (const attribute of node.attributes ?? []) {
    if (attribute.type !== 'mdxJsxAttribute' || result.has(attribute.name)) {
      return undefined;
    }
    result.set(attribute.name, attribute.value);
  }
  return result;
}

function generatedComponent(
  node: Node,
  postTitle: string,
): Component | undefined {
  if (
    (node.type !== 'mdxJsxFlowElement' && node.type !== 'mdxJsxTextElement') ||
    (node.children?.length ?? 0) > 0
  ) {
    return undefined;
  }
  const values = attributes(node);
  if (!values) return undefined;
  const text = (name: string): string | undefined => {
    const value = values.get(name);
    return typeof value === 'string' ? value : undefined;
  };
  const numeric = (name: string): boolean => {
    const value = values.get(name);
    return (
      typeof value === 'object' &&
      value?.type === 'mdxJsxAttributeValueExpression' &&
      /^\s*\d+\s*$/.test(value.value ?? '')
    );
  };
  const src = text('src')?.trim();
  if (!src) return undefined;

  if (node.name === 'Figure') {
    const alt = text('alt');
    const variant = text('variant');
    if (
      [...values.keys()].some((name) => !figureAttribute.test(name)) ||
      alt === undefined ||
      !text('assetKey')?.trim() ||
      !numeric('width') ||
      !numeric('height') ||
      (variant !== undefined && !figureVariant.test(variant))
    ) {
      return undefined;
    }
    return { kind: 'figure', src, alt };
  }

  if (node.name !== 'EmbedFrame') return undefined;
  const title = values.has('title') ? text('title') : undefined;
  if (
    [...values.keys()].some((name) => name !== 'src' && name !== 'title') ||
    (values.has('title') && title === undefined)
  ) {
    return undefined;
  }
  return {
    kind: 'embed',
    src,
    label: title?.trim() || `Spotify playlist: ${postTitle}`,
  };
}

function placement(
  node: Node,
  ancestors: readonly Node[],
): 'block' | 'inline' | undefined {
  let result: 'block' | 'inline' =
    node.type === 'mdxJsxTextElement' ? 'inline' : 'block';
  for (const ancestor of ancestors) {
    if (ancestor.type === 'code' || ancestor.type === 'inlineCode') return;
    if (
      ancestor.type === 'mdxJsxFlowElement' ||
      ancestor.type === 'mdxJsxTextElement'
    ) {
      if (!['div', 'span'].includes(ancestor.name ?? '')) return;
      result = 'inline';
    }
  }
  return result;
}

function safeUrl(value: string): string | undefined {
  const normalized = markdown.normalizeLink(value);
  return markdown.validateLink(normalized) ? normalized : undefined;
}

function componentHtml(component: Component): string {
  const url = safeUrl(component.src);
  if (!url) return '';
  const escapedUrl = markdown.utils.escapeHtml(url);
  return component.kind === 'figure'
    ? `<img src="${escapedUrl}" alt="${markdown.utils.escapeHtml(component.alt)}">`
    : `<a href="${escapedUrl}">${markdown.utils.escapeHtml(component.label)}</a>`;
}

function passthroughHtml(node: Node, source: string): string | undefined {
  if (
    node.type !== 'mdxJsxFlowElement' ||
    !node.name ||
    !passthroughElement.test(node.name) ||
    (node.children?.length ?? 0) > 0
  ) {
    return undefined;
  }
  const values = attributes(node);
  const range = nodeRange(node);
  const raw = source.slice(range.start, range.end);
  if (
    values === undefined ||
    [...values.values()].some(
      (value) => typeof value !== 'string' && value !== null,
    ) ||
    raw.includes('\n') ||
    !/^<[a-z][\s\S]*\/>$/.test(raw.trim())
  ) {
    return undefined;
  }
  return ['br', 'img'].includes(node.name)
    ? raw
    : raw.replace(/\/>$/, `></${node.name}>`);
}

function prepareMdx(
  source: string,
  postTitle: string,
): { source: string; blocks: ReadonlyMap<string, Block> } {
  const tree = mdxParser.parse(source);
  const edits: Edit[] = [];
  const blocks = new Map<string, Block>();

  visit(tree, (node, ancestors) => {
    const estree =
      node.type === 'mdxFlowExpression' || node.type === 'mdxTextExpression'
        ? node.data?.estree
        : undefined;
    if (
      node.type === 'mdxjsEsm' ||
      (estree?.body.length === 0 && (estree.comments?.length ?? 0) > 0)
    ) {
      const range = nodeRange(node);
      edits.push({
        ...range,
        replacement: source
          .slice(range.start, range.end)
          .replace(/[^\n]/g, ' '),
      });
      return;
    }
    const component = generatedComponent(node, postTitle);
    const position = component && placement(node, ancestors);
    if (!component || !position) return;
    const range = nodeRange(node);
    if (source.slice(range.start, range.end).includes('\n')) return;
    if (position === 'inline') {
      edits.push({ ...range, replacement: componentHtml(component) });
      return;
    }
    const block: Block = { ...range, kind: 'component', component };
    blocks.set(`${block.line}:${block.column}`, block);
    const parent = ancestors.at(-1);
    if (!parent || !('children' in parent)) return;
    let nextStart = block.start;
    const ownIndex = parent.children.findIndex((child) => child === node);
    for (let index = ownIndex - 1; index >= 0; index -= 1) {
      const sibling = parent.children[index];
      if (!sibling) break;
      const siblingRange = nodeRange(sibling);
      const html = passthroughHtml(sibling, source);
      if (
        html === undefined ||
        !/^\n(?:[ \t]*>[ \t]?)*[ \t]*$/.test(
          source.slice(siblingRange.end, nextStart),
        )
      ) {
        break;
      }
      const passthrough: Block = { ...siblingRange, kind: 'passthrough', html };
      blocks.set(`${siblingRange.line}:${siblingRange.column}`, passthrough);
      nextStart = siblingRange.start;
    }
  });

  return { source: applyEdits(source, edits), blocks };
}

function renderBlock(
  state: StateBlock,
  startLine: number,
  endLine: number,
  silent: boolean,
): boolean {
  const offset = state.bMarks[startLine] + state.tShift[startLine];
  const column =
    offset - (state.src.lastIndexOf('\n', Math.max(0, offset - 1)) + 1);
  const block = (state.env as RssEnvironment).rssBlocks?.get(
    `${startLine}:${column}`,
  );
  if (!block || block.endLine > endLine) return false;
  if (silent) return true;

  if (block.kind === 'passthrough') {
    const token = state.push('html_block', '', 0);
    token.map = [startLine, block.endLine];
    token.content = block.html;
  } else {
    const open = state.push('paragraph_open', 'p', 1);
    open.map = [startLine, block.endLine];
    const component = state.push('rss_component', '', 0);
    component.map = [startLine, block.endLine];
    component.meta = { component: block.component };
    state.push('paragraph_close', 'p', -1);
  }
  state.line = block.endLine;
  return true;
}

function stripHeadingIds(state: StateCore): void {
  for (let index = 1; index < state.tokens.length - 1; index += 1) {
    const token = state.tokens[index];
    const final = token.children?.at(-1);
    if (
      token.type === 'inline' &&
      state.tokens[index - 1]?.type === 'heading_open' &&
      state.tokens[index + 1]?.type === 'heading_close' &&
      final?.type === 'text'
    ) {
      final.content = final.content.replace(/\s+\{#[^{}\s]+\}\s*$/, '');
    }
  }
}

markdown.block.ruler.before('html_block', 'rss_component', renderBlock, {
  alt: ['paragraph', 'reference', 'blockquote'],
});
markdown.core.ruler.after('text_join', 'rss_heading_ids', stripHeadingIds);
markdown.renderer.rules.rss_component = (tokens, index): string => {
  const token = tokens[index];
  const component = (token.meta as { component?: Component } | null)?.component;
  if (!component) return '';
  const url = safeUrl(component.src);
  if (!url) return '';
  if (component.kind === 'figure') {
    token.attrSet('src', url);
    token.attrSet('alt', component.alt);
    return `\n<img${markdown.renderer.renderAttrs(token)}>\n`;
  }
  token.attrSet('href', url);
  return `\n<a${markdown.renderer.renderAttrs(token)}>${markdown.utils.escapeHtml(component.label)}</a>\n`;
};

function rewriteInternalUrls(html: string): string {
  const $ = load(html, null, false);
  $('[href], [src]').each((_, element) => {
    for (const attribute of ['href', 'src'] as const) {
      const value = $(element).attr(attribute);
      if (value?.startsWith('/') && !value.startsWith('//')) {
        $(element).attr(attribute, new URL(value, SITE.origin).href);
      }
    }
  });
  return $.html();
}

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags:
    'a blockquote br code del div em h1 h2 h3 h4 h5 h6 hr iframe img li ol p pre span strong table tbody td th thead tr ul'.split(
      ' ',
    ),
  allowedAttributes: {
    a: 'href title class target rel'.split(' '),
    code: ['class'],
    div: ['class'],
    iframe:
      'src title loading allow allowfullscreen width height frameborder'.split(
        ' ',
      ),
    img: 'src alt title class width height loading'.split(' '),
    span: ['class'],
    td: ['colspan', 'rowspan'],
    th: ['colspan', 'rowspan'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  allowedIframeHostnames: ['open.spotify.com'],
  allowProtocolRelative: true,
};

export function renderRssBody(
  body: string,
  postTitle: string,
  sourceFormat: RssSourceFormat,
): string {
  const source = body.replace(/\r\n?/g, '\n').replace(/\u0000/g, '\uFFFD');
  const prepared =
    sourceFormat === 'mdx'
      ? prepareMdx(source, postTitle)
      : { source, blocks: new Map<string, Block>() };
  const rendered = markdown.render(prepared.source, {
    rssBlocks: prepared.blocks,
  } satisfies RssEnvironment);
  return rewriteInternalUrls(sanitizeHtml(rendered, sanitizeOptions));
}
