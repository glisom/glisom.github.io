import MarkdownIt from 'markdown-it';

const parser = new MarkdownIt({ html: true, linkify: false });
const FRONTMATTER = /^---\s*[\s\S]*?\s*---/;
const MDX_IMPORT = /^import\s+.+;?$/gm;
const URL = /(?:https?:\/\/|\/)[^\s]+/g;

export function calculateReadingMinutes(
  markdown: string,
  wordsPerMinute = 225,
): number {
  const source = markdown.replace(FRONTMATTER, '').replace(MDX_IMPORT, '');
  const prose = parser
    .parse(source, {})
    .flatMap((token) => (token.type === 'inline' ? (token.children ?? []) : []))
    .filter((token) => token.type === 'text')
    .map((token) => token.content.replace(URL, ' '))
    .join(' ');
  const words = prose.trim() ? prose.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}
