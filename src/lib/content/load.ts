import { getCollection } from 'astro:content';
import type {
  AppLibraryRecord,
  BlogRecord,
  ContentGraph,
  ProjectRecord,
  SkillLibraryRecord,
  SkillRecord,
} from '../../types/content';

export async function loadContentGraph(): Promise<ContentGraph> {
  const blogEntries = await getCollection('blog');
  const appLibraryEntries = await getCollection('app-library');
  const projectEntries = await getCollection('projects');
  const skillLibraryEntries = await getCollection('skill-library');
  const skillEntries = await getCollection('skills');

  const blog: BlogRecord[] = blogEntries.map((entry) => ({
    collection: 'blog',
    id: entry.id,
    data: entry.data,
    body: entry.body,
  }));
  const appLibrary: AppLibraryRecord[] = appLibraryEntries.map((entry) => ({
    collection: 'app-library',
    id: entry.id,
    data: entry.data,
    body: entry.body,
  }));
  const projects: ProjectRecord[] = projectEntries.map((entry) => ({
    collection: 'projects',
    id: entry.id,
    data: entry.data,
    body: entry.body,
  }));
  const skillLibrary: SkillLibraryRecord[] = skillLibraryEntries.map(
    (entry) => ({
      collection: 'skill-library',
      id: entry.id,
      data: entry.data,
      body: entry.body,
    }),
  );
  const skills: SkillRecord[] = skillEntries.map((entry) => ({
    collection: 'skills',
    id: entry.id,
    data: entry.data,
    body: entry.body,
  }));

  return {
    blog,
    'app-library': appLibrary,
    projects,
    'skill-library': skillLibrary,
    skills,
  };
}
