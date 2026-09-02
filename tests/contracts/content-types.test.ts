import { describe, expect, expectTypeOf, it } from 'vitest';
import { contentIdFromData } from '../../src/lib/content/id';
import type {
  AnySiteRecord,
  AppLibraryRecord,
  BlogRecord,
  HomepageContent,
  ProjectRecord,
  ProjectScreenshot,
  SkillLibraryRecord,
  SkillRecord,
} from '../../src/types/content';
import type { ProjectData } from '../../src/lib/content/schema';

describe('content record types', () => {
  it('keeps collection-specific fields on their concrete records', () => {
    expectTypeOf<ProjectRecord['data']['platform']>().toEqualTypeOf<string>();
    expectTypeOf<
      ProjectData['screenshots'][number]
    >().toExtend<ProjectScreenshot>();
    expectTypeOf<
      SkillLibraryRecord['data']['sourceAuthor']
    >().toEqualTypeOf<string>();
    expectTypeOf<SkillRecord['data']['supportedTools']>().toEqualTypeOf<
      string[]
    >();
  });

  it('keeps every homepage slot concretely typed', () => {
    expectTypeOf<
      HomepageContent['featuredWriting']
    >().toEqualTypeOf<BlogRecord>();
    expectTypeOf<
      HomepageContent['featuredProjectPrimary']
    >().toEqualTypeOf<ProjectRecord>();
    expectTypeOf<
      HomepageContent['featuredProjectSecondary']
    >().toEqualTypeOf<ProjectRecord>();
    expectTypeOf<HomepageContent['appLibrary']>().toEqualTypeOf<
      readonly AppLibraryRecord[]
    >();
    expectTypeOf<HomepageContent['skillLibrary']>().toEqualTypeOf<
      readonly SkillLibraryRecord[]
    >();
    expectTypeOf<HomepageContent['authoredSkills']>().toEqualTypeOf<
      readonly SkillRecord[]
    >();
    expectTypeOf<HomepageContent['latestPosts']>().toEqualTypeOf<
      readonly BlogRecord[]
    >();
  });

  it('narrows the record union by collection', () => {
    const assertNarrowing = (record: AnySiteRecord) => {
      if (record.collection === 'projects') {
        expectTypeOf(record).toEqualTypeOf<ProjectRecord>();
      }
    };
    expectTypeOf(assertNarrowing).toBeFunction();
  });

  it('does not leak collection-specific fields to other records', () => {
    // @ts-expect-error Projects do not have source authors.
    expectTypeOf<ProjectRecord['data']['sourceAuthor']>();
  });
});

describe('contentIdFromData', () => {
  it('uses the explicit frontmatter slug as the collection ID', () => {
    expect(contentIdFromData({ slug: 'listwithme' })).toBe('listwithme');
  });

  it.each([{}, { slug: '' }, { slug: '   ' }])(
    'rejects missing or blank slugs',
    (data) => {
      expect(() => contentIdFromData(data)).toThrow(
        /nonblank frontmatter slug/,
      );
    },
  );
});
