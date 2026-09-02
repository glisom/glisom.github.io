import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  appLibrarySchema,
  blogSchema,
  projectSchema,
  skillLibrarySchema,
  skillSchema,
} from '../../src/lib/content/schema';
import type {
  CollectionDataMap,
  PrimaryCollection,
} from '../../src/types/content';

const { getCollectionMock } = vi.hoisted(() => ({
  getCollectionMock: vi.fn(),
}));

vi.mock('astro:content', () => ({
  getCollection: getCollectionMock,
}));

import { loadContentGraph } from '../../src/lib/content/load';

interface MockEntry {
  id: string;
  collection: PrimaryCollection;
  data: CollectionDataMap[PrimaryCollection];
  body: string;
  filePath: string;
  digest: string;
  rendered: {
    html: string;
    metadata: { imagePaths: string[] };
  };
}

const common = (title: string, slug: string, canonicalPath: string) => ({
  title,
  slug,
  canonicalPath,
  summary: `Summary for ${title}`,
  draft: false,
  hasDetailPage: false,
  featured: false,
  tags: [],
  links: [],
  relationships: [],
});

const entry = (
  collection: PrimaryCollection,
  id: string,
  data: CollectionDataMap[PrimaryCollection],
): MockEntry => ({
  id,
  collection,
  data,
  body: `# ${data.title}`,
  filePath: `src/content/${collection}/${id}.md`,
  digest: `${collection}-${id}-digest`,
  rendered: {
    html: `<h1>${data.title}</h1>`,
    metadata: { imagePaths: [] },
  },
});

const entries = {
  blog: [
    entry(
      'blog',
      'loaded-post',
      blogSchema.parse({
        ...common('Loaded Post', 'loaded-post', '/2026/09/02/loaded-post.html'),
        publishedAt: '2026-09-02',
      }),
    ),
  ],
  'app-library': [
    entry(
      'app-library',
      'loaded-app',
      appLibrarySchema.parse({
        ...common('Loaded App', 'loaded-app', '/app-library/loaded-app/'),
        ownership: 'used',
        category: 'Writing',
        reasonItStays: 'It keeps the workflow focused.',
      }),
    ),
  ],
  projects: [
    entry(
      'projects',
      'loaded-project',
      projectSchema.parse({
        ...common(
          'Loaded Project',
          'loaded-project',
          '/projects/loaded-project/',
        ),
        ownership: 'made',
        status: 'Active',
        platform: 'Web',
      }),
    ),
  ],
  'skill-library': [
    entry(
      'skill-library',
      'loaded-library-skill',
      skillLibrarySchema.parse({
        ...common(
          'Loaded Library Skill',
          'loaded-library-skill',
          '/skill-library/loaded-library-skill/',
        ),
        ownership: 'used',
        category: 'Design',
        trigger: 'Use when designing a new interface.',
        source: 'A trusted source',
        sourceAuthor: 'Source Author',
      }),
    ),
  ],
  skills: [
    entry(
      'skills',
      'loaded-skill',
      skillSchema.parse({
        ...common('Loaded Skill', 'loaded-skill', '/skills/loaded-skill/'),
        ownership: 'made',
        status: 'Active',
        supportedTools: ['Codex'],
      }),
    ),
  ],
} satisfies Record<PrimaryCollection, readonly MockEntry[]>;

describe('loadContentGraph', () => {
  beforeEach(() => {
    getCollectionMock.mockReset();
    getCollectionMock.mockImplementation(
      async (collection: PrimaryCollection) => entries[collection],
    );
  });

  it('maps every Astro collection into its concrete graph bucket', async () => {
    const graph = await loadContentGraph();
    const summary = Object.fromEntries(
      Object.entries(graph).map(([collection, records]) => [
        collection,
        records.map((record) => ({
          collection: record.collection,
          id: record.id,
          title: record.data.title,
          body: record.body,
        })),
      ]),
    );

    expect(summary).toEqual({
      blog: [
        {
          collection: 'blog',
          id: 'loaded-post',
          title: 'Loaded Post',
          body: '# Loaded Post',
        },
      ],
      'app-library': [
        {
          collection: 'app-library',
          id: 'loaded-app',
          title: 'Loaded App',
          body: '# Loaded App',
        },
      ],
      projects: [
        {
          collection: 'projects',
          id: 'loaded-project',
          title: 'Loaded Project',
          body: '# Loaded Project',
        },
      ],
      'skill-library': [
        {
          collection: 'skill-library',
          id: 'loaded-library-skill',
          title: 'Loaded Library Skill',
          body: '# Loaded Library Skill',
        },
      ],
      skills: [
        {
          collection: 'skills',
          id: 'loaded-skill',
          title: 'Loaded Skill',
          body: '# Loaded Skill',
        },
      ],
    });
  });
});
