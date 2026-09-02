import type {
  BlogRecord,
  ContentGraph,
  HomepageContent,
  SiteRecord,
} from '../../types/content';

const SLOT_COLLECTION = {
  'featured-writing': 'blog',
  'featured-project-primary': 'projects',
  'featured-project-secondary': 'projects',
  'app-library': 'app-library',
  'authored-skills': 'skills',
} as const;

type HomepageSlot = keyof typeof SLOT_COLLECTION;
type SingletonSlot =
  | 'featured-writing'
  | 'featured-project-primary'
  | 'featured-project-secondary';
type MultiSlot = 'app-library' | 'authored-skills';
type SlotRecordMap = {
  [K in HomepageSlot]: SiteRecord<(typeof SLOT_COLLECTION)[K]>;
};

export function selectHomepageContent(graph: ContentGraph): HomepageContent {
  const recordsBySlot: { [K in HomepageSlot]: readonly SlotRecordMap[K][] } = {
    'featured-writing': graph.blog,
    'featured-project-primary': graph.projects,
    'featured-project-secondary': graph.projects,
    'app-library': graph['app-library'],
    'authored-skills': graph.skills,
  };
  const one = <K extends HomepageSlot>(
    slot: K,
  ): readonly SlotRecordMap[K][] => {
    const matches: SlotRecordMap[K][] = [];
    for (const record of recordsBySlot[slot]) {
      if (!record.data.draft && record.data.homepageSlot === slot)
        matches.push(record);
    }
    return matches;
  };
  const singleton = <K extends SingletonSlot>(slot: K): SlotRecordMap[K] => {
    const matches = one(slot);
    if (matches.length !== 1)
      throw new Error(
        `${slot} requires exactly one record; received ${matches.length}`,
      );
    return matches[0];
  };
  const ordered = <K extends MultiSlot>(slot: K): readonly SlotRecordMap[K][] =>
    one(slot).toSorted(
      (a, b) => Number(a.data.homepageOrder) - Number(b.data.homepageOrder),
    );
  const featuredWriting: BlogRecord = singleton('featured-writing');
  const latestPosts = graph.blog
    .filter((record) => !record.data.draft && record.id !== featuredWriting.id)
    .toSorted((a, b) =>
      String(b.data.publishedAt).localeCompare(String(a.data.publishedAt)),
    )
    .slice(0, 3);
  return {
    featuredWriting,
    featuredProjectPrimary: singleton('featured-project-primary'),
    featuredProjectSecondary: singleton('featured-project-secondary'),
    appLibrary: ordered('app-library'),
    skillLibrary: graph['skill-library']
      .filter((record) => !record.data.draft)
      .toSorted(
        (a, b) =>
          Number(a.data.displayOrder) - Number(b.data.displayOrder) ||
          a.id.localeCompare(b.id),
      ),
    authoredSkills: ordered('authored-skills'),
    latestPosts,
  };
}
