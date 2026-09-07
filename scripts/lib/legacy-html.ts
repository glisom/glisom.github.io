import MarkdownIt from 'markdown-it';
import { parseFragment, type DefaultTreeAdapterMap } from 'parse5';

const ALLOWED_ATTRIBUTES = new Map([
  [
    'iframe',
    new Set([
      'src',
      'title',
      'loading',
      'allow',
      'allowfullscreen',
      'width',
      'height',
      'frameborder',
    ]),
  ],
  ['div', new Set(['class'])],
  ['span', new Set(['class'])],
  ['a', new Set(['href', 'title', 'class', 'target', 'rel'])],
  [
    'img',
    new Set(['src', 'alt', 'title', 'class', 'width', 'height', 'loading']),
  ],
  ['br', new Set()],
]);

const markdown = new MarkdownIt({ html: true });

function validateGeneratedComponent(html: string): boolean {
  const trimmed = html.trim();
  const embed = /^<EmbedFrame src="([^"]+)" title="([^"]+)" \/>$/.exec(trimmed);
  if (embed) {
    if (!embed[1].startsWith('https://open.spotify.com/')) {
      throw new Error(`Invalid generated EmbedFrame source: ${embed[1]}`);
    }
    return true;
  }

  const figure =
    /^<Figure src="([^"]+)" assetKey="([^"]+)" alt="([^"]*)" width=\{(\d+)\} height=\{(\d+)\}(?: variant="(full|wide|portrait|gallery)")? \/>$/.exec(
      trimmed,
    );
  if (figure) return true;

  if (/^<(?:EmbedFrame|Figure)\b/.test(trimmed)) {
    const component = trimmed.startsWith('<EmbedFrame')
      ? 'EmbedFrame'
      : 'Figure';
    throw new Error(`Invalid generated ${component} node`);
  }
  return false;
}

function isElement(
  node: DefaultTreeAdapterMap['node'],
): node is DefaultTreeAdapterMap['element'] {
  return 'tagName' in node;
}

function validateNode(node: DefaultTreeAdapterMap['node']): void {
  if (isElement(node)) {
    const allowed = ALLOWED_ATTRIBUTES.get(node.tagName);
    if (!allowed) throw new Error(`Unsupported HTML element: ${node.tagName}`);

    for (const attribute of node.attrs) {
      if (attribute.name.startsWith('on')) {
        throw new Error(`Unsafe HTML attribute: ${attribute.name}`);
      }
      if (!allowed.has(attribute.name)) {
        throw new Error(
          `Unsupported ${node.tagName} attribute: ${attribute.name}`,
        );
      }
      if (/^\s*javascript:/i.test(attribute.value)) {
        throw new Error(`Unsafe javascript URL in ${attribute.name}`);
      }
    }

    if (node.tagName === 'iframe') {
      const src = node.attrs.find(
        (attribute) => attribute.name === 'src',
      )?.value;
      if (!src?.startsWith('https://open.spotify.com/')) {
        throw new Error('Only Spotify iframe sources are allowed');
      }
    }
  }

  if ('childNodes' in node) node.childNodes.forEach(validateNode);
}

export function validateLegacyHtml(markdownSource: string): void {
  const tokens = markdown.parse(markdownSource, {});
  for (const token of tokens) {
    const htmlTokens =
      token.type === 'inline'
        ? (token.children ?? []).filter((child) => child.type === 'html_inline')
        : token.type === 'html_block'
          ? [token]
          : [];

    for (const htmlToken of htmlTokens) {
      if (validateGeneratedComponent(htmlToken.content)) continue;
      const fragment = parseFragment(htmlToken.content);
      fragment.childNodes.forEach(validateNode);
    }
  }
}
