export {
  assertDistContract,
  inspectHtml,
  sha256File,
} from '../../scripts/validate-built-site.mjs';

export interface ResolvedReference {
  value: string;
  resolves: boolean;
}

export interface HtmlContract {
  path: string;
  h1Count: number;
  canonicalCount: number;
  titleCount: number;
  descriptionCount: number;
  title: string;
  description: string;
  hrefs: string[];
  internalLinks: ResolvedReference[];
  localImages: ResolvedReference[];
}
