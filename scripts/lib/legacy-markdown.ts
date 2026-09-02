import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import { parseFragment, type DefaultTreeAdapterMap } from 'parse5';
import { BLOG_ENRICHMENTS } from '../data/blog-enrichments';
import {
  IMAGE_ENRICHMENTS,
  type ImageEnrichment,
} from '../data/image-enrichments';

export const NOTION_IMAGE_MAP = new Map([
  ['/uploads/2023/f159196842.png', '/images/f159196842.png'],
  ['/uploads/2023/fa6c5dfe53.png', '/images/fa6c5dfe53.png'],
  ['/uploads/2023/5fd90bfbf1.png', '/images/5fd90bfbf1.png'],
  ['/uploads/2023/6647450a28.png', '/images/6647450a28.png'],
]);

export interface LegacyHeadingSnapshot {
  id: string;
  level?: number;
  text?: string;
}

export interface LegacyPageSnapshot {
  headings: LegacyHeadingSnapshot[];
}

export interface MigratedPostData {
  title: string;
  slug: string;
  canonicalPath: string;
  summary: string;
  draft: boolean;
  hasDetailPage: boolean;
  featured: boolean;
  homepageSlot?: 'featured-writing';
  tags: string[];
  links: [];
  relationships: readonly unknown[];
  publishedAt: string;
  kind: string;
  comments: boolean;
  preservedHeadingIds: string[];
  numberHeadings: boolean;
  originalTimestamp?: string;
  titleAccent?: string;
  featuredArt?: unknown;
  relatedProject?: string;
  socialImage?: string;
}

export interface MigratedPost {
  data: MigratedPostData;
  body: string;
  extension: '.md' | '.mdx';
}

const markdown = new MarkdownIt({ html: true });
const sourceImagesDirectory = fileURLToPath(
  new URL('../../images/', import.meta.url),
);

export function normalizeSummary(value: unknown): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function textFromNode(node: DefaultTreeAdapterMap['node']): string {
  if ('value' in node) return node.value;
  if ('childNodes' in node) return node.childNodes.map(textFromNode).join('');
  return '';
}

export function firstPlainTextParagraph(content: string): string {
  const tokens = markdown.parse(content, {});
  const paragraphIndex = tokens.findIndex(
    (token) => token.type === 'paragraph_open',
  );
  if (paragraphIndex === -1) return '';
  const inline = tokens
    .slice(paragraphIndex + 1)
    .find((token) => token.type === 'inline');
  if (!inline) return '';

  const text = (inline.children ?? [])
    .map((token) => {
      if (token.type === 'text' || token.type === 'code_inline') {
        return token.content;
      }
      if (token.type === 'softbreak' || token.type === 'hardbreak') return ' ';
      if (token.type === 'image') return token.content;
      if (token.type === 'html_inline') {
        return textFromNode(parseFragment(token.content));
      }
      return '';
    })
    .join('');
  return normalizeSummary(text);
}

function parseFileName(fileName: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})-(.+)\.md$/.exec(fileName);
  if (!match) {
    throw new Error(`Invalid Jekyll post filename: ${fileName}`);
  }
  const [, year, month, day, slug] = match;
  return {
    year,
    month,
    day,
    slug,
    publishedAt: `${year}-${month}-${day}`,
    canonicalPath: `/${year}/${month}/${day}/${slug}.html`,
  };
}

function normalizeTags(tags: unknown): string[] {
  if (Array.isArray(tags)) return tags.map(String);
  if (typeof tags === 'string') return tags.split(/\s+/).filter(Boolean);
  return [];
}

function replaceListWithMeAction(body: string, canonicalPath: string): string {
  if (canonicalPath !== '/2026/02/24/listwithme-returns.html') return body;
  const placeholder = '[App Store](#)';
  const occurrences = body.split(placeholder).length - 1;
  if (occurrences !== 1) {
    throw new Error(
      `ListWithMe migration expected 1 App Store placeholder; received ${occurrences}`,
    );
  }
  return body.replace(
    placeholder,
    '[App Store](https://apps.apple.com/us/app/listwithme/id1224284271)',
  );
}

function markdownImageSources(body: string): string[] {
  return markdown
    .parse(body, {})
    .flatMap((token) => token.children ?? [])
    .filter((token) => token.type === 'image')
    .map((token) => token.attrGet('src'))
    .filter((src): src is string => src !== null);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceNotionImagePaths(body: string, canonicalPath: string): string {
  const notionPath = '/2023/01/14/notion-for-software.html';
  const sources = markdownImageSources(body);
  const occurrencesByPath = [...NOTION_IMAGE_MAP.keys()].map(
    (legacyPath) =>
      sources.filter(
        (src) =>
          src === legacyPath || src === `https://grantisom.com${legacyPath}`,
      ).length,
  );
  const occurrences = occurrencesByPath.reduce(
    (total, count) => total + count,
    0,
  );
  if (canonicalPath !== notionPath) {
    if (occurrences > 0) {
      throw new Error(
        `Notion image correction is only approved for ${notionPath}`,
      );
    }
    return body;
  }
  if (occurrences !== 4) {
    throw new Error(
      `Notion migration expected 4 Notion image occurrences; received ${occurrences}`,
    );
  }
  occurrencesByPath.forEach((count, index) => {
    if (count !== 1) {
      throw new Error(
        `Notion migration expected 1 occurrence of ${[...NOTION_IMAGE_MAP.keys()][index]}; received ${count}`,
      );
    }
  });

  let result = body;
  for (const [legacyPath, currentPath] of NOTION_IMAGE_MAP) {
    for (const identity of [`https://grantisom.com${legacyPath}`, legacyPath]) {
      const imageUrl = new RegExp(
        `(!\\[[^\\]\\n]*\\]\\()${escapeRegExp(identity)}(?=(?:\\s+["'])?\\))`,
        'g',
      );
      result = mapOutsideCodeBlocks(result, (line) =>
        line.replace(imageUrl, `$1${currentPath}`),
      );
    }
  }
  return result;
}

function mapOutsideCodeBlocks(
  body: string,
  transform: (line: string) => string,
): string {
  const lines = body.split('\n');
  let fence: { marker: '`' | '~'; length: number } | undefined;
  return lines
    .map((line) => {
      if (fence) {
        const closing = new RegExp(
          `^ {0,3}${fence.marker === '`' ? '`' : '~'}{${fence.length},}\\s*$`,
        );
        if (closing.test(line)) fence = undefined;
        return line;
      }

      const opening = /^ {0,3}(`{3,}|~{3,})/.exec(line);
      if (opening) {
        fence = {
          marker: opening[1][0] as '`' | '~',
          length: opening[1].length,
        };
        return line;
      }
      if (/^(?: {4}|\t)/.test(line)) return line;

      let cursor = 0;
      let transformed = '';
      while (cursor < line.length) {
        const opening = /`+/.exec(line.slice(cursor));
        if (!opening || opening.index === undefined) {
          transformed += transform(line.slice(cursor));
          break;
        }
        const openingStart = cursor + opening.index;
        transformed += transform(line.slice(cursor, openingStart));
        const delimiter = opening[0];
        const closingStart = line.indexOf(
          delimiter,
          openingStart + delimiter.length,
        );
        if (closingStart === -1) {
          transformed += transform(line.slice(openingStart));
          break;
        }
        const closingEnd = closingStart + delimiter.length;
        transformed += line.slice(openingStart, closingEnd);
        cursor = closingEnd;
      }
      return transformed;
    })
    .join('\n');
}

function convertKramdownButtons(body: string): string {
  return mapOutsideCodeBlocks(body, (line) =>
    line.replace(
      /\[([^\]\n]+)\]\(([^)\s]+)(?:\s+["']([^"']+)["'])?\)\{:\s*\.button\}/g,
      (_match, label: string, href: string, title?: string) =>
        `<a href="${escapeHtmlAttribute(href)}" class="button"${title ? ` title="${escapeHtmlAttribute(title)}"` : ''}>${label}</a>`,
    ),
  );
}

function pngDimensions(
  bytes: Buffer,
): { width: number; height: number } | null {
  const signature = '89504e470d0a1a0a';
  if (bytes.length < 24 || bytes.subarray(0, 8).toString('hex') !== signature) {
    return null;
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function jpegDimensions(
  bytes: Buffer,
): { width: number; height: number } | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1];
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }
    const length = bytes.readUInt16BE(offset + 2);
    if (length < 2 || offset + 2 + length > bytes.length) break;
    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    ) {
      return {
        height: bytes.readUInt16BE(offset + 5),
        width: bytes.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  return null;
}

function assertSourceDimensions(
  imagePath: string,
  enrichment: ImageEnrichment,
): void {
  const fileName = imagePath.slice('/images/'.length);
  const bytes = readFileSync(`${sourceImagesDirectory}${fileName}`);
  const dimensions = pngDimensions(bytes) ?? jpegDimensions(bytes);
  if (!dimensions)
    throw new Error(`Unsupported legacy image format: ${imagePath}`);
  if (
    dimensions.width !== enrichment.width ||
    dimensions.height !== enrichment.height
  ) {
    throw new Error(
      `Legacy image dimensions for ${imagePath} are ${dimensions.width}x${dimensions.height}; expected ${enrichment.width}x${enrichment.height}`,
    );
  }
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function convertImages(body: string): { body: string; converted: boolean } {
  let converted = false;
  const output = mapOutsideCodeBlocks(body, (line) => {
    const convertedLine = line.replace(
      /!\[([^\]\n]*)\]\((\/images\/[^)\s]+)(?:\s+["']([^"']*)["'])?\)/g,
      (_match, authoredAlt: string, imagePath: string) => {
        const enrichment = IMAGE_ENRICHMENTS[
          imagePath as keyof typeof IMAGE_ENRICHMENTS
        ] as ImageEnrichment | undefined;
        if (!enrichment) {
          const detail = authoredAlt
            ? 'has no image enrichment'
            : 'has an empty alt and no image enrichment';
          throw new Error(`Legacy image ${imagePath} ${detail}`);
        }
        assertSourceDimensions(imagePath, enrichment);
        converted = true;
        const alt = authoredAlt || enrichment.alt;
        return `<Figure src="${escapeHtmlAttribute(imagePath)}" assetKey="${escapeHtmlAttribute(enrichment.assetKey)}" alt="${escapeHtmlAttribute(alt)}" width={${enrichment.width}} height={${enrichment.height}} variant="${enrichment.variant}" />`;
      },
    );
    return convertedLine.replace(/ \/>[ \t]+(?=<Figure )/g, ' />\n\n');
  });
  return {
    body: output.replace(/(<Figure [^\n]+ \/>)\n(?=<Figure )/g, '$1\n\n'),
    converted,
  };
}

function applyPreservedHeadingIds(
  body: string,
  baseline: LegacyPageSnapshot,
): string {
  const tokens = markdown.parse(body, {});
  const headings = tokens.filter((token) => token.type === 'heading_open');
  if (headings.length !== baseline.headings.length) {
    throw new Error(
      `Heading count mismatch: source has ${headings.length}; baseline has ${baseline.headings.length}`,
    );
  }
  const lines = body.split('\n');
  headings.forEach((token, index) => {
    const lineIndex = token.map?.[0];
    if (lineIndex === undefined) {
      throw new Error(`Heading ${index + 1} has no source line`);
    }
    const match = /^( {0,3})(#{1,6})([ \t]+)(.*?)(?:[ \t]+#+[ \t]*)?$/.exec(
      lines[lineIndex],
    );
    if (!match) {
      throw new Error(`Unsupported heading syntax on line ${lineIndex + 1}`);
    }
    const marker = match[2] === '#' ? '##' : match[2];
    lines[lineIndex] =
      `${match[1]}${marker}${match[3]}${match[4]} {#${baseline.headings[index].id}}`;
  });
  return lines.join('\n');
}

function isElement(
  node: DefaultTreeAdapterMap['node'],
): node is DefaultTreeAdapterMap['element'] {
  return 'tagName' in node;
}

function convertSpotifyEmbeds(
  body: string,
  title: string,
): { body: string; converted: boolean } {
  let converted = false;
  const tokens = markdown.parse(body, {});
  const replacements = new Map<number, { end: number; value: string }>();
  for (const token of tokens) {
    if (token.type !== 'html_block' || !token.map) continue;
    const fragment = parseFragment(token.content);
    const significant = fragment.childNodes.filter(
      (node) => !('value' in node) || node.value.trim() !== '',
    );
    if (significant.length !== 1 || !isElement(significant[0])) continue;
    const element = significant[0];
    if (element.tagName !== 'iframe') continue;
    const src = element.attrs.find(
      (attribute) => attribute.name === 'src',
    )?.value;
    if (!src?.startsWith('https://open.spotify.com/')) continue;
    converted = true;
    replacements.set(token.map[0], {
      end: token.map[1],
      value: `<EmbedFrame src="${escapeHtmlAttribute(src)}" title="Spotify playlist: ${escapeHtmlAttribute(title)}" />`,
    });
  }
  if (!converted) return { body, converted };

  const lines = body.split('\n');
  for (const [start, replacement] of [...replacements].sort(
    ([left], [right]) => right - left,
  )) {
    lines.splice(start, replacement.end - start, replacement.value);
  }
  return { body: lines.join('\n'), converted };
}

type BlogEnrichment = {
  kind?: string;
  titleAccent?: string;
  featuredArt?: unknown;
  relatedProject?: string;
  relationships?: readonly unknown[];
  numberHeadings?: boolean;
  socialImage?: string;
};

export function migratePost(
  source: string,
  fileName: string,
  baseline: LegacyPageSnapshot,
): MigratedPost {
  const parsed = matter(source);
  const file = parseFileName(fileName);
  const title = String(parsed.data.title ?? '');
  const summary = normalizeSummary(
    parsed.data.excerpt ?? firstPlainTextParagraph(parsed.content),
  );
  if (!title) throw new Error(`${fileName} is missing a title`);
  if (!summary) throw new Error(`${fileName} is missing a summary`);

  let body = parsed.content.replace(/^\r?\n/, '').replace(/\r\n?/g, '\n');
  body = replaceListWithMeAction(body, file.canonicalPath);
  body = replaceNotionImagePaths(body, file.canonicalPath);
  body = convertKramdownButtons(body);
  const images = convertImages(body);
  body = images.body;
  body = applyPreservedHeadingIds(body, baseline);
  const embeds = convertSpotifyEmbeds(body, title);
  body = embeds.body;

  const enrichment = (
    BLOG_ENRICHMENTS as Record<string, BlogEnrichment | undefined>
  )[file.canonicalPath];
  const listWithMe =
    file.canonicalPath === '/2026/02/24/listwithme-returns.html';
  const data: MigratedPostData = {
    title,
    slug: file.slug,
    canonicalPath: file.canonicalPath,
    summary,
    draft: false,
    hasDetailPage: true,
    featured: listWithMe,
    homepageSlot: listWithMe ? 'featured-writing' : undefined,
    tags: normalizeTags(parsed.data.tags),
    links: [],
    relationships: enrichment?.relationships ?? [],
    publishedAt: file.publishedAt,
    kind: enrichment?.kind ?? parsed.data.kind ?? 'Post',
    comments: parsed.data.comments ?? true,
    preservedHeadingIds: baseline.headings.map((heading) => heading.id),
    numberHeadings: enrichment?.numberHeadings ?? false,
    originalTimestamp: parsed.data.date
      ? new Date(parsed.data.date).toISOString()
      : undefined,
    titleAccent: enrichment?.titleAccent,
    featuredArt: enrichment?.featuredArt,
    relatedProject: enrichment?.relatedProject,
    socialImage: enrichment?.socialImage,
  };

  const imports: string[] = [];
  if (images.converted) {
    imports.unshift(
      "import Figure from '../../components/editorial/Figure.astro';",
    );
  }
  if (embeds.converted) {
    imports.unshift(
      "import EmbedFrame from '../../components/editorial/EmbedFrame.astro';",
    );
  }
  if (imports.length > 0) body = `${imports.join('\n')}\n\n${body}`;

  return {
    data,
    body,
    extension: imports.length > 0 ? '.mdx' : '.md',
  };
}
