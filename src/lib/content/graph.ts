import type {
  AnySiteRecord,
  ContentGraph,
  ContentIssue,
  FieldNoteKey,
  PrimaryCollection,
  RelationshipRef,
  SiteRecord,
} from '../../types/content';

const COLLECTIONS = [
  'blog',
  'app-library',
  'projects',
  'skill-library',
  'skills',
] as const;
const SLOT_COLLECTION = {
  'featured-writing': 'blog',
  'featured-project-primary': 'projects',
  'featured-project-secondary': 'projects',
  'app-library': 'app-library',
  'authored-skills': 'skills',
} as const;
const SINGLETON_SLOTS = [
  'featured-writing',
  'featured-project-primary',
  'featured-project-secondary',
] as const;
const MULTI_SLOTS = ['app-library', 'authored-skills'] as const;
const FIELD_NOTE_KEYS = {
  projects: [
    'why-it-exists',
    'what-it-does',
    'how-it-was-built',
    'what-i-learned',
    'current-state',
  ],
  'app-library': [
    'workflow',
    'details-i-love',
    'friction-and-limits',
    'who-it-suits',
  ],
  'skill-library': [
    'trigger',
    'inputs-and-outputs',
    'example',
    'guardrails',
    'source',
    'what-i-adapted',
  ],
  skills: [
    'when-to-use',
    'how-it-works',
    'example',
    'use-or-installation',
    'design-decisions',
  ],
} as const satisfies Record<
  Exclude<PrimaryCollection, 'blog'>,
  readonly FieldNoteKey[]
>;

function allRecords(graph: ContentGraph): readonly AnySiteRecord[] {
  return [
    ...graph.blog,
    ...graph['app-library'],
    ...graph.projects,
    ...graph['skill-library'],
    ...graph.skills,
  ];
}

function findRecord<C extends PrimaryCollection>(
  graph: ContentGraph,
  collection: C,
  id: string,
): SiteRecord<C> | undefined {
  return graph[collection].find((record) => record.id === id);
}

function isGenerated<C extends PrimaryCollection>(
  record: SiteRecord<C>,
): boolean {
  return !record.data.draft && record.data.hasDetailPage;
}

function isPlaceholderHref(href: string): boolean {
  const trimmed = href.trim();
  return trimmed === '' || trimmed === '#';
}

export function relationshipTargetIssueMessage(
  source: AnySiteRecord,
  relationship: RelationshipRef,
  reason: 'missing' | 'unpublished',
): string {
  const target = `${relationship.collection}/${relationship.id}`;
  if (reason === 'missing') {
    return `${source.data.canonicalPath} references ${target}, but that relationship target does not exist.`;
  }
  return `${source.data.canonicalPath} references ${target}, but that relationship target is not published and generated.`;
}

export function validateContentGraph(
  graph: ContentGraph,
): readonly ContentIssue[] {
  const issues: ContentIssue[] = [];
  const records = allRecords(graph);
  const add = (code: string, record: AnySiteRecord, message: string) => {
    issues.push({ code, record: record.data.canonicalPath, message });
  };

  const canonicalPaths = new Map<string, AnySiteRecord>();
  for (const record of records) {
    const existing = canonicalPaths.get(record.data.canonicalPath);
    if (existing) {
      add(
        'duplicate-canonical-path',
        record,
        `${record.data.canonicalPath} duplicates the canonical path used by ${existing.collection}/${existing.id}.`,
      );
    } else {
      canonicalPaths.set(record.data.canonicalPath, record);
    }

    if (
      record.data.titleAccent &&
      !record.data.title.includes(record.data.titleAccent)
    ) {
      add(
        'title-accent-not-found',
        record,
        `Title accent "${record.data.titleAccent}" is not an exact substring of "${record.data.title}".`,
      );
    }
  }

  for (const collection of COLLECTIONS) {
    const slugs = new Map<string, AnySiteRecord>();
    for (const record of graph[collection]) {
      const existing = slugs.get(record.data.slug);
      if (existing) {
        add(
          'duplicate-slug',
          record,
          `Slug "${record.data.slug}" duplicates ${existing.data.canonicalPath} within ${collection}.`,
        );
      } else {
        slugs.set(record.data.slug, record);
      }
    }
  }

  for (const record of records) {
    for (const relationship of record.data.relationships) {
      const target = findRecord(
        graph,
        relationship.collection,
        relationship.id,
      );
      if (!target) {
        add(
          'missing-relationship-target',
          record,
          relationshipTargetIssueMessage(record, relationship, 'missing'),
        );
      } else if (!isGenerated(target)) {
        add(
          'unpublished-relationship-target',
          record,
          relationshipTargetIssueMessage(record, relationship, 'unpublished'),
        );
      }
    }

    if (record.collection === 'blog' && record.data.relatedProject) {
      const target = findRecord(graph, 'projects', record.data.relatedProject);
      if (!target) {
        add(
          'missing-related-project',
          record,
          `${record.data.canonicalPath} names projects/${record.data.relatedProject}, but that related project does not exist.`,
        );
      } else if (!isGenerated(target)) {
        add(
          'missing-related-project',
          record,
          `${record.data.canonicalPath} names projects/${record.data.relatedProject}, but that related project is not published and generated.`,
        );
      }
    }

    const slot = record.data.homepageSlot;
    if (slot && record.collection !== SLOT_COLLECTION[slot]) {
      add(
        'invalid-homepage-slot-collection',
        record,
        `Homepage slot "${slot}" requires ${SLOT_COLLECTION[slot]}, not ${record.collection}.`,
      );
    }
  }

  const published = records.filter((record) => !record.data.draft);
  for (const slot of SINGLETON_SLOTS) {
    const matches = published.filter(
      (record) => record.data.homepageSlot === slot,
    );
    if (matches.length === 0) {
      issues.push({
        code: 'missing-homepage-slot',
        record: slot,
        message: `Homepage slot "${slot}" requires exactly one published record; received 0.`,
      });
    } else if (matches.length > 1) {
      for (const record of matches) {
        add(
          'duplicate-homepage-slot',
          record,
          `Homepage slot "${slot}" requires exactly one published record; received ${matches.length}.`,
        );
      }
    }
  }

  for (const slot of MULTI_SLOTS) {
    const matches = records.filter(
      (record) => record.data.homepageSlot === slot,
    );
    const orders = new Map<number, AnySiteRecord>();
    for (const record of matches) {
      if (record.data.homepageOrder === undefined) {
        add(
          'missing-homepage-order',
          record,
          `Homepage slot "${slot}" requires an explicit homepageOrder.`,
        );
        continue;
      }
      const existing = orders.get(record.data.homepageOrder);
      if (existing) {
        add(
          'duplicate-homepage-order',
          record,
          `Homepage order ${record.data.homepageOrder} in "${slot}" duplicates ${existing.data.canonicalPath}.`,
        );
      } else {
        orders.set(record.data.homepageOrder, record);
      }
    }
  }

  for (const record of records) {
    if (record.collection === 'blog' || !isGenerated(record)) continue;

    const placeholderActions = record.data.links.filter((link) =>
      isPlaceholderHref(link.href),
    );
    for (const link of placeholderActions) {
      add(
        'placeholder-action',
        record,
        `Action "${link.label}" must not use a blank or placeholder destination.`,
      );
    }

    const primaryActions = record.data.links.filter(
      (link) => link.kind === 'primary' || link.kind === 'install',
    );
    const quietActions = record.data.links.filter(
      (link) => link.kind === 'secondary' || link.kind === 'source',
    );
    if (primaryActions.length > 1) {
      add(
        'too-many-primary-actions',
        record,
        `Generated detail pages allow at most one primary or install action; received ${primaryActions.length}.`,
      );
    }
    if (quietActions.length > 2) {
      add(
        'too-many-secondary-actions',
        record,
        `Generated detail pages allow at most two secondary or source actions; received ${quietActions.length}.`,
      );
    }
    if (record.data.relationships.length > 3) {
      add(
        'too-many-detail-relationships',
        record,
        `Generated detail pages allow at most three relationships; received ${record.data.relationships.length}.`,
      );
    }
    if (
      record.collection === 'skills' &&
      record.data.visibility === 'private' &&
      record.data.links.length > 0
    ) {
      add(
        'private-skill-action',
        record,
        'Private authored skills cannot expose actions.',
      );
    }

    const allowedKeys: readonly string[] = FIELD_NOTE_KEYS[record.collection];
    const seenKeys = new Set<string>();
    for (const fieldNote of record.data.fieldNotes) {
      if (!allowedKeys.includes(fieldNote.key)) {
        add(
          'invalid-field-note-key',
          record,
          `Field-note key "${fieldNote.key}" is not allowed for ${record.collection}.`,
        );
      }
      if (seenKeys.has(fieldNote.key)) {
        add(
          'duplicate-field-note-key',
          record,
          `Field-note key "${fieldNote.key}" appears more than once.`,
        );
      }
      seenKeys.add(fieldNote.key);
    }

    const hasRealPrimaryAction = primaryActions.some(
      (link) => !isPlaceholderHref(link.href),
    );
    const hasActionState =
      typeof record.data.actionState === 'string' &&
      record.data.actionState.trim().length > 0;
    const substantiveFieldNotes = record.data.fieldNotes.filter(
      (fieldNote) =>
        fieldNote.body.length > 0 &&
        fieldNote.body.every((paragraph) => paragraph.trim().length >= 40),
    );
    if (
      record.data.facts.length < 2 ||
      substantiveFieldNotes.length < 2 ||
      (!hasRealPrimaryAction && !hasActionState)
    ) {
      add(
        'thin-detail-page',
        record,
        'Generated detail pages require two facts, two substantive field notes, and a real primary action or explicit action state.',
      );
    }
  }

  return issues;
}

export function assertValidContentGraph(graph: ContentGraph): void {
  const issues = validateContentGraph(graph);
  if (issues.length === 0) return;
  throw new Error(
    [
      'Content graph validation failed:',
      ...issues.map(
        (issue) => `- [${issue.code}] ${issue.record}: ${issue.message}`,
      ),
    ].join('\n'),
  );
}
