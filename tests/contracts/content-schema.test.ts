import { describe, expect, it } from 'vitest';
import { validateContentGraph } from '../../src/lib/content/graph';
import {
  appLibrarySchema,
  blogSchema,
  linkSchema,
  mediaSchema,
  projectSchema,
  projectScreenshotSchema,
  skillLibrarySchema,
  skillSchema,
  type AppLibraryData,
  type BlogData,
  type ProjectData,
  type SkillData,
  type SkillLibraryData,
} from '../../src/lib/content/schema';
import type {
  AnySiteRecord,
  AppLibraryRecord,
  BlogRecord,
  ContentGraph,
  ProjectRecord,
  SkillLibraryRecord,
  SkillRecord,
} from '../../src/types/content';

const paragraph =
  'This paragraph contains enough substantive detail to satisfy the field note contract.';
const facts = [
  { label: 'Role', value: 'Designer' },
  { label: 'Year', value: '2026' },
];
const primaryAction = {
  label: 'Open project',
  href: 'https://example.com/project',
  kind: 'primary' as const,
};
const note = <K extends string>(key: K) => ({
  key,
  heading: `About ${key}`,
  body: [paragraph],
});

const validBlog = {
  title: 'Featured Post',
  slug: 'featured-post',
  canonicalPath: '/2026/09/01/featured-post.html',
  summary: 'A complete blog fixture.',
  draft: false,
  hasDetailPage: true,
  featured: true,
  homepageSlot: 'featured-writing' as const,
  tags: ['writing'],
  links: [],
  relationships: [],
  publishedAt: '2026-09-01',
  kind: 'Post',
  comments: true,
  preservedHeadingIds: [],
  numberHeadings: false,
};

const validProject = {
  title: 'ListWithMe',
  slug: 'listwithme',
  canonicalPath: '/projects/listwithme/',
  summary: 'A complete project fixture.',
  draft: false,
  hasDetailPage: true,
  featured: false,
  tags: ['project'],
  links: [primaryAction],
  relationships: [],
  ownership: 'made' as const,
  status: 'Active',
  platform: 'iOS',
  facts,
  fieldNotes: [note('why-it-exists'), note('what-it-does')],
};

const validScreenshot = {
  src: 'projects/listwithme/screenshots/01-new-list.png',
  alt: 'A new grocery list on an iPhone.',
  decorative: false as const,
  device: 'iPhone' as const,
  label: 'New list',
  order: 1,
};

const validApp = {
  title: 'Drafts',
  slug: 'drafts',
  canonicalPath: '/app-library/drafts/',
  summary: 'A complete app library fixture.',
  draft: false,
  hasDetailPage: true,
  featured: false,
  tags: ['app'],
  links: [primaryAction],
  relationships: [],
  ownership: 'used' as const,
  category: 'Writing',
  reasonItStays: 'It removes friction from capturing ideas.',
  facts,
  fieldNotes: [note('workflow'), note('details-i-love')],
};

const validLibrarySkill = {
  title: 'Frontend Design',
  slug: 'frontend-design',
  canonicalPath: '/skill-library/frontend-design/',
  summary: 'A complete skill library fixture.',
  draft: false,
  hasDetailPage: true,
  featured: false,
  tags: ['skill'],
  links: [primaryAction],
  relationships: [],
  ownership: 'used' as const,
  category: 'Design',
  trigger: 'Use when building a polished interface.',
  source: 'Plugin marketplace',
  sourceAuthor: 'OpenAI',
  facts,
  fieldNotes: [note('trigger'), note('inputs-and-outputs')],
};

const validAuthoredSkill = {
  title: 'Write Like Grant',
  slug: 'write-like-grant',
  canonicalPath: '/skills/write-like-grant/',
  summary: 'A complete authored skill fixture.',
  draft: false,
  hasDetailPage: true,
  featured: false,
  tags: ['skill'],
  links: [primaryAction],
  relationships: [],
  ownership: 'made' as const,
  status: 'Active',
  supportedTools: ['Codex'],
  visibility: 'public' as const,
  facts,
  fieldNotes: [note('when-to-use'), note('how-it-works')],
};

function blogRecord(overrides: Partial<BlogData> = {}): BlogRecord {
  const data = blogSchema.parse({ ...validBlog, ...overrides });
  return { collection: 'blog', id: data.slug, data };
}

function projectRecord(overrides: Partial<ProjectData> = {}): ProjectRecord {
  const data = projectSchema.parse({ ...validProject, ...overrides });
  return { collection: 'projects', id: data.slug, data };
}

function appRecord(overrides: Partial<AppLibraryData> = {}): AppLibraryRecord {
  const data = appLibrarySchema.parse({ ...validApp, ...overrides });
  return { collection: 'app-library', id: data.slug, data };
}

function librarySkillRecord(
  overrides: Partial<SkillLibraryData> = {},
): SkillLibraryRecord {
  const data = skillLibrarySchema.parse({ ...validLibrarySkill, ...overrides });
  return { collection: 'skill-library', id: data.slug, data };
}

function authoredSkillRecord(overrides: Partial<SkillData> = {}): SkillRecord {
  const data = skillSchema.parse({ ...validAuthoredSkill, ...overrides });
  return { collection: 'skills', id: data.slug, data };
}

function validGraph(): ContentGraph {
  return {
    blog: [blogRecord()],
    'app-library': [],
    projects: [
      projectRecord({
        slug: 'primary-project',
        canonicalPath: '/projects/primary-project/',
        homepageSlot: 'featured-project-primary',
        hasDetailPage: false,
      }),
      projectRecord({
        slug: 'secondary-project',
        canonicalPath: '/projects/secondary-project/',
        homepageSlot: 'featured-project-secondary',
        hasDetailPage: false,
      }),
    ],
    'skill-library': [],
    skills: [],
  };
}

function graphWith(record: AnySiteRecord): ContentGraph {
  const graph = validGraph();
  switch (record.collection) {
    case 'blog':
      return { ...graph, blog: [...graph.blog, record] };
    case 'app-library':
      return { ...graph, 'app-library': [...graph['app-library'], record] };
    case 'projects':
      return { ...graph, projects: [...graph.projects, record] };
    case 'skill-library':
      return { ...graph, 'skill-library': [...graph['skill-library'], record] };
    case 'skills':
      return { ...graph, skills: [...graph.skills, record] };
  }
}

const codes = (graph: ContentGraph) =>
  validateContentGraph(graph).map((issue) => issue.code);

describe('content graph validation', () => {
  it('rejects duplicate canonical paths', () => {
    const graphWithDuplicatePath = graphWith(
      appRecord({
        slug: 'duplicate-path',
        canonicalPath: validBlog.canonicalPath,
        hasDetailPage: false,
      }),
    );
    expect(codes(graphWithDuplicatePath)).toContain('duplicate-canonical-path');
  });

  it('rejects duplicate slugs within a collection', () => {
    const graphWithDuplicateSlug = graphWith(
      blogRecord({
        canonicalPath: '/2026/08/01/other-path.html',
        homepageSlot: undefined,
      }),
    );
    expect(codes(graphWithDuplicateSlug)).toContain('duplicate-slug');
  });

  it('requires the title accent to be an exact title substring', () => {
    const graphWithBadAccent = {
      ...validGraph(),
      blog: [blogRecord({ titleAccent: 'featured' })],
    };
    expect(codes(graphWithBadAccent)).toContain('title-accent-not-found');
  });

  it('requires relationship targets to exist and be generated', () => {
    const graphWithMissingRelationship = {
      ...validGraph(),
      blog: [
        blogRecord({
          relationships: [
            { collection: 'projects', id: 'missing', label: 'Missing' },
          ],
        }),
      ],
    };
    const graphWithUnavailableRelationship = {
      ...validGraph(),
      blog: [
        blogRecord({
          relationships: [
            { collection: 'projects', id: 'primary-project', label: 'Primary' },
          ],
        }),
      ],
    };
    expect(codes(graphWithMissingRelationship)).toContain(
      'missing-relationship-target',
    );
    expect(codes(graphWithUnavailableRelationship)).toContain(
      'unpublished-relationship-target',
    );
  });

  it('requires related projects to exist and be generated', () => {
    const graphWithMissingRelatedProject = {
      ...validGraph(),
      blog: [blogRecord({ relatedProject: 'missing' })],
    };
    const graphWithUnavailableRelatedProject = {
      ...validGraph(),
      blog: [blogRecord({ relatedProject: 'primary-project' })],
    };
    expect(codes(graphWithMissingRelatedProject)).toContain(
      'missing-related-project',
    );
    expect(codes(graphWithUnavailableRelatedProject)).toContain(
      'missing-related-project',
    );
  });

  it('enforces the collection assigned to every homepage slot', () => {
    const graphWithProjectSlotOnAppRecord = graphWith(
      appRecord({
        slug: 'misplaced-app',
        canonicalPath: '/app-library/misplaced-app/',
        homepageSlot: 'featured-project-primary',
        hasDetailPage: false,
      }),
    );
    expect(codes(graphWithProjectSlotOnAppRecord)).toContain(
      'invalid-homepage-slot-collection',
    );
  });

  it('requires exactly one published record in singleton homepage slots', () => {
    const graphWithDuplicateSingletonSlot = graphWith(
      blogRecord({
        slug: 'another-feature',
        canonicalPath: '/2026/08/01/another-feature.html',
      }),
    );
    const graphWithMissingSingletonSlot = { ...validGraph(), blog: [] };
    expect(codes(graphWithDuplicateSingletonSlot)).toContain(
      'duplicate-homepage-slot',
    );
    expect(codes(graphWithMissingSingletonSlot)).toContain(
      'missing-homepage-slot',
    );
  });

  it('requires unique explicit order values for multi-record homepage slots', () => {
    const graphWithMissingMultiOrder = graphWith(
      appRecord({
        slug: 'unordered-app',
        canonicalPath: '/app-library/unordered-app/',
        homepageSlot: 'app-library',
        hasDetailPage: false,
      }),
    );
    const graph = validGraph();
    const graphWithDuplicateOrder: ContentGraph = {
      ...graph,
      'app-library': [
        appRecord({
          slug: 'first-app',
          canonicalPath: '/app-library/first-app/',
          homepageSlot: 'app-library',
          homepageOrder: 1,
          hasDetailPage: false,
        }),
        appRecord({
          slug: 'second-app',
          canonicalPath: '/app-library/second-app/',
          homepageSlot: 'app-library',
          homepageOrder: 1,
          hasDetailPage: false,
        }),
      ],
    };
    expect(codes(graphWithMissingMultiOrder)).toContain(
      'missing-homepage-order',
    );
    expect(codes(graphWithDuplicateOrder)).toContain(
      'duplicate-homepage-order',
    );
  });

  it('rejects thin generated dossiers', () => {
    const graphWithThinDossier = graphWith(
      projectRecord({
        slug: 'thin-project',
        canonicalPath: '/projects/thin-project/',
        facts: [{ label: 'Only', value: 'One' }],
        fieldNotes: [note('why-it-exists'), note('what-it-does')],
      }),
    );
    const graphWithOneFieldNote = graphWith(
      projectRecord({
        slug: 'one-note-project',
        canonicalPath: '/projects/one-note-project/',
        fieldNotes: [note('why-it-exists')],
      }),
    );
    const unsubstantiveBase = projectRecord({
      slug: 'unsubstantive-project',
      canonicalPath: '/projects/unsubstantive-project/',
    });
    const graphWithUnsubstantiveFieldNotes = graphWith({
      ...unsubstantiveBase,
      data: {
        ...unsubstantiveBase.data,
        fieldNotes: [
          { key: 'why-it-exists', heading: 'Why', body: ['Too short.'] },
          { key: 'what-it-does', heading: 'What', body: ['Also too short.'] },
        ],
      },
    });
    expect(codes(graphWithThinDossier)).toContain('thin-detail-page');
    expect(codes(graphWithOneFieldNote)).toContain('thin-detail-page');
    expect(codes(graphWithUnsubstantiveFieldNotes)).toContain(
      'thin-detail-page',
    );
  });

  it('rejects actions that violate privacy, destination, or visual priority limits', () => {
    const graphWithPrivateInstallLink = graphWith(
      authoredSkillRecord({
        slug: 'private-skill',
        canonicalPath: '/skills/private-skill/',
        visibility: 'private',
      }),
    );
    const placeholderBase = projectRecord({
      slug: 'placeholder-project',
      canonicalPath: '/projects/placeholder-project/',
      actionState: 'Not currently available',
    });
    const graphWithPlaceholderAction = graphWith({
      ...placeholderBase,
      data: {
        ...placeholderBase.data,
        links: [{ label: 'Wait', href: '#', kind: 'primary' }],
      },
    });
    const graphWithTwoPrimaryActions = graphWith(
      projectRecord({
        slug: 'two-primary-project',
        canonicalPath: '/projects/two-primary-project/',
        links: [
          primaryAction,
          {
            label: 'Install',
            href: 'https://example.com/install',
            kind: 'install',
          },
        ],
      }),
    );
    const graphWithThreeQuietActions = graphWith(
      projectRecord({
        slug: 'three-quiet-project',
        canonicalPath: '/projects/three-quiet-project/',
        actionState: 'Available on request',
        links: [
          { label: 'One', href: 'https://example.com/one', kind: 'secondary' },
          { label: 'Two', href: 'https://example.com/two', kind: 'source' },
          {
            label: 'Three',
            href: 'https://example.com/three',
            kind: 'secondary',
          },
        ],
      }),
    );
    expect(codes(graphWithPrivateInstallLink)).toContain(
      'private-skill-action',
    );
    expect(codes(graphWithPlaceholderAction)).toContain('placeholder-action');
    expect(codes(graphWithTwoPrimaryActions)).toContain(
      'too-many-primary-actions',
    );
    expect(codes(graphWithThreeQuietActions)).toContain(
      'too-many-secondary-actions',
    );
  });

  it('limits relationships shown on generated detail pages', () => {
    const relationships = Array.from({ length: 4 }, (_, index) => ({
      collection: 'blog' as const,
      id: 'featured-post',
      label: `Post ${index + 1}`,
    }));
    const graphWithFourDetailRelationships = graphWith(
      projectRecord({
        slug: 'connected-project',
        canonicalPath: '/projects/connected-project/',
        relationships,
      }),
    );
    expect(codes(graphWithFourDetailRelationships)).toContain(
      'too-many-detail-relationships',
    );
  });
});

describe('collection dossier variants', () => {
  const cases = [
    {
      label: 'projects',
      single: projectRecord({
        slug: 'project-single',
        canonicalPath: '/projects/project-single/',
        fieldNotes: [note('why-it-exists')],
        actionState: 'No public action',
      }),
      duplicate: projectRecord({
        slug: 'project-duplicate',
        canonicalPath: '/projects/project-duplicate/',
        fieldNotes: [note('why-it-exists'), note('why-it-exists')],
        actionState: 'No public action',
      }),
      sparse: projectRecord({
        slug: 'project-sparse',
        canonicalPath: '/projects/project-sparse/',
        fieldNotes: [note('why-it-exists'), note('current-state')],
        links: [],
        actionState: 'No public action',
      }),
      rejectOtherKey: () =>
        projectSchema.parse({
          ...validProject,
          fieldNotes: [note('workflow')],
        }),
    },
    {
      label: 'app-library',
      single: appRecord({
        slug: 'app-single',
        canonicalPath: '/app-library/app-single/',
        fieldNotes: [note('workflow')],
        actionState: 'No public action',
      }),
      duplicate: appRecord({
        slug: 'app-duplicate',
        canonicalPath: '/app-library/app-duplicate/',
        fieldNotes: [note('workflow'), note('workflow')],
        actionState: 'No public action',
      }),
      sparse: appRecord({
        slug: 'app-sparse',
        canonicalPath: '/app-library/app-sparse/',
        fieldNotes: [note('workflow'), note('who-it-suits')],
        links: [],
        actionState: 'No public action',
      }),
      rejectOtherKey: () =>
        appLibrarySchema.parse({
          ...validApp,
          fieldNotes: [note('why-it-exists')],
        }),
    },
    {
      label: 'skill-library',
      single: librarySkillRecord({
        slug: 'library-skill-single',
        canonicalPath: '/skill-library/library-skill-single/',
        fieldNotes: [note('trigger')],
        actionState: 'No public action',
      }),
      duplicate: librarySkillRecord({
        slug: 'library-skill-duplicate',
        canonicalPath: '/skill-library/library-skill-duplicate/',
        fieldNotes: [note('trigger'), note('trigger')],
        actionState: 'No public action',
      }),
      sparse: librarySkillRecord({
        slug: 'library-skill-sparse',
        canonicalPath: '/skill-library/library-skill-sparse/',
        fieldNotes: [note('trigger'), note('what-i-adapted')],
        links: [],
        actionState: 'No public action',
      }),
      rejectOtherKey: () =>
        skillLibrarySchema.parse({
          ...validLibrarySkill,
          fieldNotes: [note('when-to-use')],
        }),
    },
    {
      label: 'skills',
      single: authoredSkillRecord({
        slug: 'skill-single',
        canonicalPath: '/skills/skill-single/',
        fieldNotes: [note('when-to-use')],
        links: [],
        actionState: 'No public action',
      }),
      duplicate: authoredSkillRecord({
        slug: 'skill-duplicate',
        canonicalPath: '/skills/skill-duplicate/',
        fieldNotes: [note('when-to-use'), note('when-to-use')],
        links: [],
        actionState: 'No public action',
      }),
      sparse: authoredSkillRecord({
        slug: 'skill-sparse',
        canonicalPath: '/skills/skill-sparse/',
        fieldNotes: [note('when-to-use'), note('design-decisions')],
        links: [],
        actionState: 'No public action',
      }),
      rejectOtherKey: () =>
        skillSchema.parse({
          ...validAuthoredSkill,
          fieldNotes: [note('workflow')],
        }),
    },
  ];

  it.each(cases)('rejects a single $label section as thin', ({ single }) => {
    expect(codes(graphWith(single))).toContain('thin-detail-page');
  });

  it.each(cases)('rejects duplicate $label section keys', ({ duplicate }) => {
    expect(codes(graphWith(duplicate))).toContain('duplicate-field-note-key');
  });

  it.each(cases)(
    'accepts a valid sparse two-section $label dossier',
    ({ sparse }) => {
      expect(codes(graphWith(sparse))).not.toContain('thin-detail-page');
    },
  );

  it.each(cases)(
    'rejects a field-note key from another $label variant',
    ({ rejectOtherKey }) => {
      expect(rejectOtherKey).toThrow();
    },
  );
});

describe('strict content schemas', () => {
  it('enforces accessible and strict media', () => {
    expect(() =>
      mediaSchema.parse({ src: 'image.png', alt: '', decorative: false }),
    ).toThrow(/requires alt text/);
    expect(() =>
      mediaSchema.parse({
        src: 'image.png',
        alt: 'Diagram',
        decorative: false,
        typo: true,
      }),
    ).toThrow(/unrecognized/i);
  });

  it('defaults screenshots and validates screenshot content and order', () => {
    expect(projectSchema.parse(validProject).screenshots).toEqual([]);
    expect(() =>
      projectScreenshotSchema.parse({ ...validScreenshot, alt: '' }),
    ).toThrow(/blank/);
    expect(() =>
      projectSchema.parse({
        ...validProject,
        screenshots: [
          validScreenshot,
          {
            ...validScreenshot,
            src: 'projects/listwithme/screenshots/02-your-lists.png',
          },
        ],
      }),
    ).toThrow(/unique/);
  });

  it('rejects unsafe or protocol-relative action links', () => {
    expect(() =>
      linkSchema.parse({
        label: 'Unsafe',
        href: 'javascript:alert(1)',
        kind: 'primary',
      }),
    ).toThrow(/real internal/);
    expect(() =>
      linkSchema.parse({
        label: 'Protocol relative',
        href: '//example.com',
        kind: 'primary',
      }),
    ).toThrow(/real internal/);
  });

  it('rejects blank text and impossible public dates', () => {
    expect(() => blogSchema.parse({ ...validBlog, title: '   ' })).toThrow(
      /blank/,
    );
    expect(() =>
      blogSchema.parse({ ...validBlog, titleAccent: '   ' }),
    ).toThrow(/blank/);
    expect(() =>
      blogSchema.parse({ ...validBlog, publishedAt: '2026-02-30' }),
    ).toThrow(/real calendar/);
  });
});
