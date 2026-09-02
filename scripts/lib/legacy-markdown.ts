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

const APPROVED_BODY_H1_COUNTS = new Map([
  ['/2018/11/27/playlists.html', 5],
  ['/2019/06/04/wwdc-day-1.html', 5],
]);
const APPROVED_SPOTIFY_PATH = '/2020/02/10/2019-playlists.html';
const APPROVED_SPOTIFY_COUNT = 4;

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
const copiedImagesDirectory = fileURLToPath(
  new URL('../../src/assets/legacy/', import.meta.url),
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

function targetAppStoreLinkCount(inlineSource: string): number {
  const children = markdown.parseInline(inlineSource, {})[0]?.children ?? [];
  let count = 0;
  for (let index = 0; index < children.length; index += 1) {
    const token = children[index];
    if (token.type !== 'link_open' || token.attrGet('href') !== '#') continue;
    const close = children.findIndex(
      (candidate, candidateIndex) =>
        candidateIndex > index && candidate.type === 'link_close',
    );
    if (
      close === index + 2 &&
      children[index + 1].type === 'text' &&
      children[index + 1].content === 'App Store'
    ) {
      count += 1;
    }
  }
  return count;
}

function markdownLinkCount(body: string, text: string, href: string): number {
  let count = 0;
  for (const token of markdown.parse(body, {})) {
    if (token.type !== 'inline') continue;
    const children = token.children ?? [];
    for (let index = 0; index < children.length; index += 1) {
      const child = children[index];
      if (child.type !== 'link_open' || child.attrGet('href') !== href)
        continue;
      const close = children.findIndex(
        (candidate, candidateIndex) =>
          candidateIndex > index && candidate.type === 'link_close',
      );
      if (
        close === index + 2 &&
        children[index + 1].type === 'text' &&
        children[index + 1].content === text
      ) {
        count += 1;
      }
    }
  }
  return count;
}

function appStoreLinkRanges(body: string): SourceRange[] {
  const offsets = lineOffsets(body);
  const syntax = '[App Store](#)';
  const ranges: SourceRange[] = [];
  for (const token of markdown.parse(body, {})) {
    if (token.type !== 'inline' || !token.map) continue;
    const linkCount = targetAppStoreLinkCount(token.content);
    if (linkCount === 0) continue;
    const windowStart = offsets[token.map[0]];
    const windowEnd = offsets[token.map[1]] ?? body.length;
    const contentStart = body.indexOf(token.content, windowStart);
    if (contentStart === -1 || contentStart >= windowEnd) {
      throw new Error('Unable to resolve App Store Markdown link source range');
    }
    let candidate = token.content.indexOf(syntax);
    while (candidate !== -1) {
      const withoutCandidate =
        token.content.slice(0, candidate) +
        'App Store' +
        token.content.slice(candidate + syntax.length);
      if (targetAppStoreLinkCount(withoutCandidate) === linkCount - 1) {
        ranges.push({
          start: contentStart + candidate,
          end: contentStart + candidate + syntax.length,
        });
      }
      candidate = token.content.indexOf(syntax, candidate + syntax.length);
    }
  }
  return ranges;
}

function replaceListWithMeAction(body: string, canonicalPath: string): string {
  const approvedPath = '/2026/02/24/listwithme-returns.html';
  const ranges = appStoreLinkRanges(body);
  if (canonicalPath !== approvedPath && ranges.length > 0) {
    throw new Error(
      `App Store placeholder replacement is only approved for ${approvedPath}`,
    );
  }
  if (canonicalPath !== approvedPath) return body;
  if (ranges.length !== 1) {
    throw new Error(
      `ListWithMe migration expected 1 App Store placeholder; received ${ranges.length}`,
    );
  }
  const [range] = ranges;
  const migratedBody =
    body.slice(0, range.start) +
    '[App Store](https://apps.apple.com/us/app/listwithme/id1224284271)' +
    body.slice(range.end);
  const outputCount = markdownLinkCount(
    migratedBody,
    'App Store',
    'https://apps.apple.com/us/app/listwithme/id1224284271',
  );
  if (outputCount !== 1) {
    throw new Error(
      `ListWithMe migration expected 1 migrated App Store link; received ${outputCount}`,
    );
  }
  return migratedBody;
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
      result = mapEditableMarkdown(result, (markdownSource) =>
        markdownSource.replace(imageUrl, `$1${currentPath}`),
      );
    }
  }
  const outputSources = markdownImageSources(result);
  for (const [legacyPath, currentPath] of NOTION_IMAGE_MAP) {
    const remainingSourceCount = outputSources.filter(
      (src) =>
        src === legacyPath || src === `https://grantisom.com${legacyPath}`,
    ).length;
    const outputCount = outputSources.filter(
      (src) => src === currentPath,
    ).length;
    if (remainingSourceCount !== 0 || outputCount !== 1) {
      throw new Error(
        `Notion migration expected 0 source and 1 migrated occurrence for ${legacyPath}; received ${remainingSourceCount}/${outputCount}`,
      );
    }
  }
  return result;
}

interface SourceRange {
  start: number;
  end: number;
}

function mergeRanges(ranges: SourceRange[]): SourceRange[] {
  const sorted = ranges
    .filter(({ start, end }) => start < end)
    .sort((left, right) => left.start - right.start || left.end - right.end);
  const merged: SourceRange[] = [];
  for (const range of sorted) {
    const previous = merged.at(-1);
    if (!previous || range.start > previous.end) {
      merged.push({ ...range });
    } else {
      previous.end = Math.max(previous.end, range.end);
    }
  }
  return merged;
}

function lineOffsets(body: string): number[] {
  const offsets = [0];
  for (let index = 0; index < body.length; index += 1) {
    if (body[index] === '\n') offsets.push(index + 1);
  }
  return offsets;
}

function blockProtectedRanges(body: string): SourceRange[] {
  const offsets = lineOffsets(body);
  return markdown
    .parse(body, {})
    .filter(
      (token) =>
        token.map &&
        (token.type === 'fence' ||
          token.type === 'code_block' ||
          token.type === 'html_block'),
    )
    .map((token) => ({
      start: offsets[token.map![0]],
      end: offsets[token.map![1]] ?? body.length,
    }));
}

function inlineHtmlRanges(body: string): SourceRange[] {
  const offsets = lineOffsets(body);
  const ranges: SourceRange[] = [];
  for (const token of markdown.parse(body, {})) {
    if (token.type !== 'inline' || !token.map) continue;
    const htmlTokens = (token.children ?? []).filter(
      (child) => child.type === 'html_inline',
    );
    if (htmlTokens.length === 0) continue;
    const windowStart = offsets[token.map[0]];
    const windowEnd = offsets[token.map[1]] ?? body.length;
    let cursor = windowStart;
    for (const htmlToken of htmlTokens) {
      const start = body.indexOf(htmlToken.content, cursor);
      if (start === -1 || start >= windowEnd) {
        ranges.push({ start: windowStart, end: windowEnd });
        break;
      }
      const end = start + htmlToken.content.length;
      ranges.push({ start, end });
      cursor = end;
    }
  }
  return ranges;
}

function htmlCommentRanges(body: string): SourceRange[] {
  const ranges: SourceRange[] = [];
  let cursor = 0;
  while (cursor < body.length) {
    const start = body.indexOf('<!--', cursor);
    if (start === -1) break;
    const closing = body.indexOf('-->', start + 4);
    const end = closing === -1 ? body.length : closing + 3;
    ranges.push({ start, end });
    cursor = end;
  }
  return ranges;
}

function inlineCodeRanges(
  body: string,
  excluded: SourceRange[],
): SourceRange[] {
  const ranges: SourceRange[] = [];
  const boundaries = [...excluded, { start: body.length, end: body.length }];
  let editableStart = 0;
  for (const boundary of boundaries) {
    let cursor = editableStart;
    while (cursor < boundary.start) {
      const start = body.indexOf('`', cursor);
      if (start === -1 || start >= boundary.start) break;
      let openingEnd = start + 1;
      while (openingEnd < boundary.start && body[openingEnd] === '`') {
        openingEnd += 1;
      }
      const delimiterLength = openingEnd - start;
      let search = openingEnd;
      let end: number | undefined;
      while (search < boundary.start) {
        const candidate = body.indexOf('`', search);
        if (candidate === -1 || candidate >= boundary.start) break;
        let candidateEnd = candidate + 1;
        while (candidateEnd < boundary.start && body[candidateEnd] === '`') {
          candidateEnd += 1;
        }
        if (candidateEnd - candidate === delimiterLength) {
          end = candidateEnd;
          break;
        }
        search = candidateEnd;
      }
      if (end === undefined) {
        cursor = openingEnd;
      } else {
        ranges.push({ start, end });
        cursor = end;
      }
    }
    editableStart = Math.max(editableStart, boundary.end);
  }
  return ranges;
}

function protectedMarkdownRanges(body: string): SourceRange[] {
  const blockAndComments = mergeRanges([
    ...blockProtectedRanges(body),
    ...inlineHtmlRanges(body),
    ...htmlCommentRanges(body),
  ]);
  return mergeRanges([
    ...blockAndComments,
    ...inlineCodeRanges(body, blockAndComments),
  ]);
}

function mapEditableMarkdown(
  body: string,
  transform: (markdownSource: string) => string,
): string {
  const protectedRanges = protectedMarkdownRanges(body);
  let cursor = 0;
  let result = '';
  for (const range of protectedRanges) {
    result += transform(body.slice(cursor, range.start));
    result += body.slice(range.start, range.end);
    cursor = range.end;
  }
  result += transform(body.slice(cursor));
  return result;
}

function convertKramdownButtons(body: string): string {
  return mapEditableMarkdown(body, (markdownSource) =>
    markdownSource.replace(
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

export function assertLegacyImageAsset(imagePath: string): void {
  const enrichment = IMAGE_ENRICHMENTS[
    imagePath as keyof typeof IMAGE_ENRICHMENTS
  ] as ImageEnrichment | undefined;
  if (!enrichment) {
    throw new Error(`Legacy image has no enrichment: ${imagePath}`);
  }
  const fileName = imagePath.slice('/images/'.length);
  const sourceBytes = readFileSync(`${sourceImagesDirectory}${fileName}`);
  const copiedFileName = enrichment.assetKey.slice('legacy/'.length);
  const copiedBytes = readFileSync(`${copiedImagesDirectory}${copiedFileName}`);
  if (!copiedBytes.equals(sourceBytes)) {
    throw new Error(
      `Copied legacy image bytes do not match source for ${imagePath}`,
    );
  }
  const dimensions = pngDimensions(copiedBytes) ?? jpegDimensions(copiedBytes);
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
  const output = mapEditableMarkdown(body, (markdownSource) => {
    const convertedSource = markdownSource.replace(
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
        assertLegacyImageAsset(imagePath);
        converted = true;
        const alt = authoredAlt || enrichment.alt;
        return `<Figure src="${escapeHtmlAttribute(imagePath)}" assetKey="${escapeHtmlAttribute(enrichment.assetKey)}" alt="${escapeHtmlAttribute(alt)}" width={${enrichment.width}} height={${enrichment.height}} variant="${enrichment.variant}" />`;
      },
    );
    return convertedSource.replace(/ \/>[ \t]+(?=<Figure )/g, ' />\n\n');
  });
  return {
    body: output.replace(/(<Figure [^\n]+ \/>)\n(?=<Figure )/g, '$1\n\n'),
    converted,
  };
}

function applyPreservedHeadingIds(
  body: string,
  baseline: LegacyPageSnapshot,
  canonicalPath: string,
): string {
  const tokens = markdown.parse(body, {});
  const headings = tokens.filter((token) => token.type === 'heading_open');
  const bodyH1Count = headings.filter((token) => token.tag === 'h1').length;
  const approvedH1Count = APPROVED_BODY_H1_COUNTS.get(canonicalPath);
  if (approvedH1Count === undefined && bodyH1Count > 0) {
    throw new Error(
      `Body H1 normalization is only approved for ${[...APPROVED_BODY_H1_COUNTS.keys()].join(' and ')}; received ${bodyH1Count} on ${canonicalPath}`,
    );
  }
  if (approvedH1Count !== undefined && bodyH1Count !== approvedH1Count) {
    throw new Error(
      `${canonicalPath} expected ${approvedH1Count} body H1 headings; received ${bodyH1Count}`,
    );
  }
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
  const migratedBody = lines.join('\n');
  const migratedHeadings = markdown
    .parse(migratedBody, {})
    .filter((token) => token.type === 'heading_open');
  const remainingBodyH1s = migratedHeadings.filter(
    (token) => token.tag === 'h1',
  ).length;
  if (remainingBodyH1s !== 0) {
    throw new Error(
      `${canonicalPath} expected 0 migrated body H1 headings; received ${remainingBodyH1s}`,
    );
  }
  if (approvedH1Count !== undefined) {
    const migratedH2Count = headings.filter(
      (token, index) =>
        token.tag === 'h1' && migratedHeadings[index]?.tag === 'h2',
    ).length;
    if (migratedH2Count !== approvedH1Count) {
      throw new Error(
        `${canonicalPath} expected ${approvedH1Count} migrated body H2 headings; received ${migratedH2Count}`,
      );
    }
  }
  return migratedBody;
}

function escapePreservedHeadingIdsForMdx(body: string): string {
  const lines = body.split('\n');
  const headings = markdown
    .parse(body, {})
    .filter((token) => token.type === 'heading_open');

  for (const [index, token] of headings.entries()) {
    const lineIndex = token.map?.[0];
    if (lineIndex === undefined) {
      throw new Error(`MDX heading ${index + 1} has no source line`);
    }
    const marker = /^(.*) \{#([^{}\s]+)\}$/.exec(lines[lineIndex]);
    if (!marker) {
      throw new Error(
        `MDX heading ${index + 1} is missing its preserved heading ID`,
      );
    }
    lines[lineIndex] = `${marker[1]} \\{#${marker[2]}\\}`;
  }

  return lines.join('\n');
}

function convertHtmlCommentsForMdx(body: string): string {
  const offsets = lineOffsets(body);
  const codeRanges = markdown
    .parse(body, {})
    .filter(
      (token) =>
        token.map && (token.type === 'fence' || token.type === 'code_block'),
    )
    .map((token) => ({
      start: offsets[token.map![0]],
      end: offsets[token.map![1]] ?? body.length,
    }));
  const comments = htmlCommentRanges(body).filter(
    (comment) =>
      !codeRanges.some(
        (code) => comment.start >= code.start && comment.end <= code.end,
      ),
  );

  let result = body;
  for (const comment of comments.sort(
    (left, right) => right.start - left.start,
  )) {
    const source = body.slice(comment.start, comment.end);
    const content = source.slice(4, -3);
    if (content.includes('*/')) {
      throw new Error('HTML comment cannot be represented safely in MDX');
    }
    result = `${result.slice(0, comment.start)}{/*${content}*/}${result.slice(comment.end)}`;
  }
  return result;
}

function isElement(
  node: DefaultTreeAdapterMap['node'],
): node is DefaultTreeAdapterMap['element'] {
  return 'tagName' in node;
}

function convertSpotifyEmbeds(
  body: string,
  title: string,
  canonicalPath: string,
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
  const spotifyCount = replacements.size;
  if (canonicalPath !== APPROVED_SPOTIFY_PATH && spotifyCount > 0) {
    throw new Error(
      `Spotify iframe conversion is only approved for ${APPROVED_SPOTIFY_PATH}; received ${spotifyCount} on ${canonicalPath}`,
    );
  }
  if (
    canonicalPath === APPROVED_SPOTIFY_PATH &&
    spotifyCount !== APPROVED_SPOTIFY_COUNT
  ) {
    throw new Error(
      `${canonicalPath} expected ${APPROVED_SPOTIFY_COUNT} Spotify iframes; received ${spotifyCount}`,
    );
  }
  if (!converted) return { body, converted };

  const lines = body.split('\n');
  for (const [start, replacement] of [...replacements].sort(
    ([left], [right]) => right - left,
  )) {
    lines.splice(start, replacement.end - start, replacement.value);
  }
  const migratedBody = lines.join('\n');
  const outputCount = migratedBody.split('<EmbedFrame src=').length - 1;
  if (outputCount !== APPROVED_SPOTIFY_COUNT) {
    throw new Error(
      `${canonicalPath} expected ${APPROVED_SPOTIFY_COUNT} migrated Spotify embeds; received ${outputCount}`,
    );
  }
  return { body: migratedBody, converted };
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
  body = applyPreservedHeadingIds(body, baseline, file.canonicalPath);
  const embeds = convertSpotifyEmbeds(body, title, file.canonicalPath);
  body = embeds.body;
  const requiresMdx = images.converted || embeds.converted;
  if (requiresMdx) {
    body = escapePreservedHeadingIdsForMdx(body);
    body = convertHtmlCommentsForMdx(body);
  }

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

  return { data, body, extension: requiresMdx ? '.mdx' : '.md' };
}
