export type PrimaryCollection =
  'blog' | 'app-library' | 'projects' | 'skill-library' | 'skills';

export interface RelationshipRef {
  collection: PrimaryCollection;
  id: string;
  label: string;
}

export interface RouteContract {
  canonicalPath: string;
  outputPath: string;
  kind: 'page' | 'post' | 'utility';
  inSitemap: boolean;
}

export type RailContext =
  | { kind: 'home' }
  | { kind: 'index'; count: number; updatedAt?: string }
  | {
      kind: 'article';
      title: string;
      date: string;
      postKind: string;
      minutes: number;
    }
  | {
      kind: 'detail';
      title: string;
      ownership: 'made' | 'used';
      status?: string;
      reviewedAt?: string;
    }
  | { kind: 'utility'; title: string; parent?: string };

export interface ResolvedRelationship extends RelationshipRef {
  title: string;
  summary: string;
  canonicalPath: string;
}

export interface BaseLayoutProps {
  title: string;
  description: string;
  canonicalPath: string;
  canonicalOverride?: string;
  activeCollection?: PrimaryCollection;
  railContext: RailContext;
  socialImage?: string;
  pageType?: 'website' | 'article';
  publishedAt?: string;
  updatedAt?: string;
  noindex?: boolean;
}

export interface CommonRecordData {
  title: string;
  slug: string;
  canonicalPath: string;
  summary: string;
  draft: boolean;
  hasDetailPage: boolean;
  featured: boolean;
  displayOrder?: number;
  homepageSlot?:
    | 'featured-writing'
    | 'featured-project-primary'
    | 'featured-project-secondary'
    | 'app-library'
    | 'authored-skills';
  homepageOrder?: number;
  tags: string[];
  titleAccent?: string;
  media?: Media;
  featuredArt?: Media;
  links: ActionLink[];
  relationships: RelationshipRef[];
  publishedAt?: string;
  updatedAt?: string;
  reviewedAt?: string;
  originalTimestamp?: string;
  canonicalOverride?: string;
  actionState?: string;
}

export interface Media {
  src: string;
  alt: string;
  decorative: boolean;
  focalPoint?: string;
}

export interface ProjectScreenshot extends Media {
  decorative: false;
  device: 'iPhone' | 'iPad';
  label: string;
  order: number;
}

export interface ActionLink {
  label: string;
  href: string;
  kind: 'primary' | 'secondary' | 'source' | 'support' | 'privacy' | 'install';
}

export interface Fact {
  label: string;
  value: string;
}
export type FieldNoteKey =
  | 'why-it-exists'
  | 'what-it-does'
  | 'how-it-was-built'
  | 'what-i-learned'
  | 'current-state'
  | 'workflow'
  | 'details-i-love'
  | 'friction-and-limits'
  | 'who-it-suits'
  | 'trigger'
  | 'inputs-and-outputs'
  | 'example'
  | 'guardrails'
  | 'source'
  | 'what-i-adapted'
  | 'when-to-use'
  | 'how-it-works'
  | 'use-or-installation'
  | 'design-decisions';
export interface FieldNote {
  key: FieldNoteKey;
  heading: string;
  body: string[];
}

import type {
  AppLibraryData,
  BlogData,
  ProjectData,
  SkillData,
  SkillLibraryData,
} from '../lib/content/schema';

export interface CollectionDataMap {
  blog: BlogData;
  'app-library': AppLibraryData;
  projects: ProjectData;
  'skill-library': SkillLibraryData;
  skills: SkillData;
}

export interface SiteRecord<C extends PrimaryCollection> {
  collection: C;
  id: string;
  data: Readonly<CollectionDataMap[C]>;
  body?: string;
}

export type BlogRecord = SiteRecord<'blog'>;
export type AppLibraryRecord = SiteRecord<'app-library'>;
export type ProjectRecord = SiteRecord<'projects'>;
export type SkillLibraryRecord = SiteRecord<'skill-library'>;
export type SkillRecord = SiteRecord<'skills'>;
export type AnySiteRecord = {
  [C in PrimaryCollection]: SiteRecord<C>;
}[PrimaryCollection];
export type NonBlogRecord = Exclude<AnySiteRecord, BlogRecord>;

export type ContentGraph = {
  readonly [C in PrimaryCollection]: readonly SiteRecord<C>[];
};

export interface ContentIssue {
  code: string;
  record: string;
  message: string;
}
export interface HomepageContent {
  featuredWriting: BlogRecord;
  featuredProjectPrimary: ProjectRecord;
  featuredProjectSecondary: ProjectRecord;
  appLibrary: readonly AppLibraryRecord[];
  skillLibrary: readonly SkillLibraryRecord[];
  authoredSkills: readonly SkillRecord[];
  latestPosts: readonly BlogRecord[];
}

export interface DetailPageProps {
  record: NonBlogRecord;
  collectionLabel: string;
  recordNumber: number;
  recordCount: number;
  nextRecord: { title: string; canonicalPath: string } | null;
}
