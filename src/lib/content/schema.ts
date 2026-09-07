import { z } from 'astro/zod';

const internalPath = /^\/(?:$|[^?#]*(?:\/|\.html))$/;
const nonBlank = z
  .string()
  .refine((value) => value.trim().length > 0, 'Value cannot be blank.');
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, 'Date must be a real calendar day.');

export const mediaSchema = z
  .strictObject({
    src: nonBlank,
    alt: z.string(),
    decorative: z.boolean(),
    focalPoint: nonBlank.optional(),
  })
  .superRefine((media, context) => {
    if (media.decorative && media.alt !== '') {
      context.addIssue({
        code: 'custom',
        message: 'Decorative media must have empty alt text.',
      });
    }
    if (!media.decorative && media.alt.trim() === '') {
      context.addIssue({
        code: 'custom',
        message: 'Informative media requires alt text.',
      });
    }
  });

export const projectScreenshotSchema = z.strictObject({
  src: z
    .string()
    .regex(
      /^projects\/[a-z0-9-]+\/screenshots\/[a-z0-9-]+\.(?:png|jpe?g|webp|avif)$/,
    ),
  alt: nonBlank,
  decorative: z.literal(false),
  device: z.enum(['iPhone', 'iPad']),
  label: nonBlank,
  order: z.number().int().positive(),
});

export const linkSchema = z.strictObject({
  label: nonBlank,
  href: z
    .string()
    .refine(
      (href) =>
        href === href.trim() &&
        href !== '#' &&
        ((href.startsWith('/') && !href.startsWith('//')) ||
          /^https:\/\/\S+$/.test(href) ||
          /^mailto:[^@\s]+@[^@\s]+$/.test(href)),
      'Action href must be a real internal, HTTPS, or email destination.',
    ),
  kind: z.enum([
    'primary',
    'secondary',
    'source',
    'support',
    'privacy',
    'install',
  ]),
});

export const relationshipSchema = z.strictObject({
  collection: z.enum([
    'blog',
    'app-library',
    'projects',
    'skill-library',
    'skills',
  ]),
  id: nonBlank,
  label: nonBlank,
});

export const commonFields = {
  title: nonBlank,
  slug: z.string().regex(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/),
  canonicalPath: z.string().regex(internalPath),
  summary: nonBlank,
  draft: z.boolean().default(false),
  hasDetailPage: z.boolean().default(true),
  featured: z.boolean().default(false),
  displayOrder: z.number().int().nonnegative().optional(),
  homepageSlot: z
    .enum([
      'featured-writing',
      'featured-project-primary',
      'featured-project-secondary',
      'app-library',
      'authored-skills',
    ])
    .optional(),
  homepageOrder: z.number().int().nonnegative().optional(),
  tags: z.array(nonBlank).default([]),
  titleAccent: nonBlank.optional(),
  media: mediaSchema.optional(),
  featuredArt: mediaSchema.optional(),
  links: z.array(linkSchema).default([]),
  relationships: z.array(relationshipSchema).default([]),
  publishedAt: isoDateSchema.optional(),
  updatedAt: isoDateSchema.optional(),
  reviewedAt: isoDateSchema.optional(),
};

const facts = z
  .array(z.strictObject({ label: nonBlank, value: nonBlank }))
  .default([]);
const substantive = z
  .string()
  .min(40)
  .refine(
    (value) => value.trim().length >= 40,
    'Field-note paragraphs must contain 40 non-whitespace characters.',
  );
const fieldNotes = <T extends readonly [string, ...string[]]>(keys: T) =>
  z
    .array(
      z.strictObject({
        key: z.enum(keys),
        heading: nonBlank,
        body: z.array(substantive).min(1),
      }),
    )
    .default([]);

export const blogSchema = z.strictObject({
  ...commonFields,
  publishedAt: isoDateSchema,
  kind: nonBlank.default('Post'),
  comments: z.boolean().default(true),
  canonicalOverride: z
    .string()
    .url()
    .refine(
      (url) => url.startsWith('https://'),
      'Canonical override must use HTTPS.',
    )
    .optional(),
  socialImage: nonBlank.optional(),
  relatedProject: nonBlank.optional(),
  preservedHeadingIds: z.array(nonBlank).default([]),
  numberHeadings: z.boolean().default(false),
  originalTimestamp: z.string().datetime({ offset: true }).optional(),
});

const actionState = nonBlank.optional();
const stringList = z.array(nonBlank).default([]);
const projectScreenshots = z
  .array(projectScreenshotSchema)
  .max(8)
  .superRefine((screenshots, context) => {
    if (
      new Set(screenshots.map(({ order }) => order)).size !== screenshots.length
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Screenshot order values must be unique.',
      });
    }
  })
  .default([]);
const projectNotes = fieldNotes([
  'why-it-exists',
  'what-it-does',
  'how-it-was-built',
  'what-i-learned',
  'current-state',
]);
const appNotes = fieldNotes([
  'workflow',
  'details-i-love',
  'friction-and-limits',
  'who-it-suits',
]);
const librarySkillNotes = fieldNotes([
  'trigger',
  'inputs-and-outputs',
  'example',
  'guardrails',
  'source',
  'what-i-adapted',
]);
const authoredSkillNotes = fieldNotes([
  'when-to-use',
  'how-it-works',
  'example',
  'use-or-installation',
  'design-decisions',
]);

export const appLibrarySchema = z.strictObject({
  ...commonFields,
  ownership: z.literal('used'),
  category: nonBlank,
  reasonItStays: nonBlank,
  cadence: nonBlank.optional(),
  status: nonBlank.optional(),
  facts,
  fieldNotes: appNotes,
  actionState,
});
export const projectSchema = z.strictObject({
  ...commonFields,
  ownership: z.literal('made'),
  status: nonBlank,
  platform: nonBlank,
  compatibility: nonBlank.optional(),
  license: nonBlank.optional(),
  screenshots: projectScreenshots,
  facts,
  fieldNotes: projectNotes,
  actionState,
});
export const skillLibrarySchema = z.strictObject({
  ...commonFields,
  ownership: z.literal('used'),
  status: nonBlank.optional(),
  category: nonBlank,
  cadence: nonBlank.optional(),
  trigger: nonBlank,
  inputs: stringList,
  outputs: stringList,
  guardrails: stringList,
  source: nonBlank,
  sourceAuthor: nonBlank,
  license: nonBlank.optional(),
  facts,
  fieldNotes: librarySkillNotes,
  actionState,
});
export const skillSchema = z.strictObject({
  ...commonFields,
  ownership: z.literal('made'),
  status: nonBlank,
  supportedTools: z.array(nonBlank).min(1),
  visibility: z.enum(['private', 'public']).default('private'),
  trigger: nonBlank.optional(),
  inputs: stringList,
  outputs: stringList,
  license: nonBlank.optional(),
  facts,
  fieldNotes: authoredSkillNotes,
  actionState,
});

export type BlogData = z.infer<typeof blogSchema>;
export type AppLibraryData = z.infer<typeof appLibrarySchema>;
export type ProjectData = z.infer<typeof projectSchema>;
export type SkillLibraryData = z.infer<typeof skillLibrarySchema>;
export type SkillData = z.infer<typeof skillSchema>;
