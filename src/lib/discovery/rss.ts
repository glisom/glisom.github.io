import { load } from 'cheerio';
import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';
import { SITE } from '../../data/site';

const markdown = new MarkdownIt({
  html: true,
  linkify: false,
  typographer: false,
});

const componentAttribute = /([A-Za-z][\w:-]*)=(?:"([^"]*)"|'([^']*)')/g;
const headingWithExplicitId =
  /^(\s{0,3}#{1,6}\s+.*?)(?:\s+\\?\{#[^{}\s]+\\?\})(\s*#*\s*)$/;

interface Fence {
  marker: '`' | '~';
  length: number;
}

function fenceAt(line: string): Fence | undefined {
  const match = /^\s{0,3}(`{3,}|~{3,})/.exec(line);
  if (!match) return undefined;
  return {
    marker: match[1][0] as Fence['marker'],
    length: match[1].length,
  };
}

function closesFence(line: string, fence: Fence): boolean {
  const match = /^\s{0,3}(`{3,}|~{3,})\s*$/.exec(line);
  return Boolean(
    match && match[1][0] === fence.marker && match[1].length >= fence.length,
  );
}

function isIndentedCode(line: string): boolean {
  return /^(?: {4}|\t)/.test(line);
}

function startsImportDeclaration(line: string): boolean {
  if (!/^ {0,3}import\s/.test(line)) return false;
  const source = line.trimStart();
  return (
    /^import\s+['"]/.test(source) ||
    /^import\s+(?:type\s+)?\{/.test(source) ||
    /^import\s+\*/.test(source) ||
    /^import\s+(?:type\s+)?[A-Za-z_$][\w$]*(?:\s*,|\s+from\b)/.test(source)
  );
}

function isCompleteImportDeclaration(source: string): boolean {
  const normalized = source.replace(/\s+/g, ' ').trim();
  return (
    /^import\s+['"][^'"]+['"]\s*;?$/.test(normalized) ||
    /^import\s+[\s\S]+\s+from\s+['"][^'"]+['"]\s*;?$/.test(normalized)
  );
}

function importDeclarationEndAt(
  lines: readonly string[],
  start: number,
): number | undefined {
  if (!startsImportDeclaration(lines[start])) return undefined;

  const declaration: string[] = [];
  for (let index = start; index < lines.length; index += 1) {
    const line = lines[index];
    declaration.push(line);
    if (isCompleteImportDeclaration(declaration.join('\n'))) return index;
  }
  return undefined;
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

function prepareMarkdown(body: string, postTitle: string): string {
  const output: string[] = [];
  let fence: Fence | undefined;
  const lines = body.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (fence) {
      output.push(line);
      if (closesFence(line, fence)) fence = undefined;
      continue;
    }

    const openingFence = fenceAt(line);
    if (openingFence) {
      fence = openingFence;
      output.push(line);
      continue;
    }

    if (isIndentedCode(line)) {
      output.push(line);
      continue;
    }

    const importEnd = importDeclarationEndAt(lines, index);
    if (importEnd !== undefined) {
      index = importEnd;
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

export function renderRssBody(body: string, postTitle: string): string {
  const rendered = markdown.render(prepareMarkdown(body, postTitle));
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
