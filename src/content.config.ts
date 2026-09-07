import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { contentIdFromData } from './lib/content/id';
import {
  appLibrarySchema,
  blogSchema,
  projectSchema,
  skillLibrarySchema,
  skillSchema,
} from './lib/content/schema';

const idFromSlug = ({ data }: { data: Record<string, unknown> }) =>
  contentIdFromData(data);
const blog = defineCollection({
  loader: glob({
    base: './src/content/blog',
    pattern: '**/*.{md,mdx}',
    generateId: idFromSlug,
  }),
  schema: blogSchema,
});
const appLibrary = defineCollection({
  loader: glob({
    base: './src/content/app-library',
    pattern: '**/*.{md,mdx}',
    generateId: idFromSlug,
  }),
  schema: appLibrarySchema,
});
const projects = defineCollection({
  loader: glob({
    base: './src/content/projects',
    pattern: '**/*.{md,mdx}',
    generateId: idFromSlug,
  }),
  schema: projectSchema,
});
const skillLibrary = defineCollection({
  loader: glob({
    base: './src/content/skill-library',
    pattern: '**/*.{md,mdx}',
    generateId: idFromSlug,
  }),
  schema: skillLibrarySchema,
});
const skills = defineCollection({
  loader: glob({
    base: './src/content/skills',
    pattern: '**/*.{md,mdx}',
    generateId: idFromSlug,
  }),
  schema: skillSchema,
});

export const collections = {
  blog,
  'app-library': appLibrary,
  projects,
  'skill-library': skillLibrary,
  skills,
};
