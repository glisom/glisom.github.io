import { readFile } from 'node:fs/promises';
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

async function loadSourceCollection<C extends PrimaryCollection>(
  collection: C,
): Promise<SiteRecord<C>[]> {
  const files = await fg(`src/content/${collection}/**/*.{md,mdx}`, {
    absolute: true,
    cwd: REPOSITORY_ROOT,
    onlyFiles: true,
  });
  const records = await Promise.all(
    files.map(async (file) => {
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

export async function loadSourceGraph(): Promise<ContentGraph> {
  const [blog, appLibrary, projects, skillLibrary, skills] = await Promise.all([
    loadSourceCollection('blog'),
    loadSourceCollection('app-library'),
    loadSourceCollection('projects'),
    loadSourceCollection('skill-library'),
    loadSourceCollection('skills'),
  ]);

  return {
    blog,
    'app-library': appLibrary,
    projects,
    'skill-library': skillLibrary,
    skills,
  };
}
