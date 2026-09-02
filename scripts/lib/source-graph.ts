import { readFile } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import fg from 'fast-glob';
import matter from 'gray-matter';
import { comparePostsNewestFirst } from '../../src/lib/content/date';
import { contentIdFromData } from '../../src/lib/content/id';
import {
  appLibrarySchema,
  blogSchema,
  projectSchema,
  skillLibrarySchema,
  skillSchema,
} from '../../src/lib/content/schema';
import type {
  BlogRecord,
  CollectionDataMap,
  ContentGraph,
  PrimaryCollection,
  SiteRecord,
} from '../../src/types/content';
import { validateLegacyHtml } from './legacy-html';

const REPOSITORY_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const COLLECTION_SCHEMAS = {
  blog: blogSchema,
  'app-library': appLibrarySchema,
  projects: projectSchema,
  'skill-library': skillLibrarySchema,
  skills: skillSchema,
} as const;

export interface LoadSourceGraphOptions {
  repositoryRoot?: string | URL;
}

function resolveRepositoryRoot(root: string | URL | undefined): string {
  if (root instanceof URL) return fileURLToPath(root);
  return root ? resolve(root) : REPOSITORY_ROOT;
}

function sourceError(
  repositoryRoot: string,
  file: string,
  cause: unknown,
): Error {
  const sourcePath = relative(repositoryRoot, file).split(sep).join('/');
  const detail = cause instanceof Error ? cause.message : String(cause);
  return new Error(`Failed to load ${sourcePath}: ${detail}`, { cause });
}

async function loadSourceCollection<C extends PrimaryCollection>(
  collection: C,
  repositoryRoot: string,
): Promise<SiteRecord<C>[]> {
  const files = await fg(`src/content/${collection}/**/*.{md,mdx}`, {
    absolute: true,
    cwd: repositoryRoot,
    onlyFiles: true,
  });
  const records = await Promise.all(
    files.map(async (file) => {
      try {
        const source = await readFile(file, 'utf8');
        const parsed = matter(source);
        const data = COLLECTION_SCHEMAS[collection].parse(
          parsed.data,
        ) as CollectionDataMap[C];
        if (collection === 'blog') validateLegacyHtml(parsed.content);

        return {
          collection,
          id: contentIdFromData(data),
          data,
          body: parsed.content,
        } satisfies SiteRecord<C>;
      } catch (error) {
        throw sourceError(repositoryRoot, file, error);
      }
    }),
  );

  if (collection === 'blog') {
    return (records as BlogRecord[]).toSorted(
      comparePostsNewestFirst,
    ) as SiteRecord<C>[];
  }

  return records.toSorted(
    (left, right) =>
      (left.data.displayOrder ?? Number.MAX_SAFE_INTEGER) -
        (right.data.displayOrder ?? Number.MAX_SAFE_INTEGER) ||
      left.id.localeCompare(right.id),
  );
}

export async function loadSourceGraph(
  options: LoadSourceGraphOptions = {},
): Promise<ContentGraph> {
  const repositoryRoot = resolveRepositoryRoot(options.repositoryRoot);
  const [blog, appLibrary, projects, skillLibrary, skills] = await Promise.all([
    loadSourceCollection('blog', repositoryRoot),
    loadSourceCollection('app-library', repositoryRoot),
    loadSourceCollection('projects', repositoryRoot),
    loadSourceCollection('skill-library', repositoryRoot),
    loadSourceCollection('skills', repositoryRoot),
  ]);

  return {
    blog,
    'app-library': appLibrary,
    projects,
    'skill-library': skillLibrary,
    skills,
  };
}
