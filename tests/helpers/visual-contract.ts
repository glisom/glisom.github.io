export type VisualProject = 'desktop' | 'tablet' | 'phone';
export type MockupFamily = 'article' | 'index' | 'detail';

export interface MediaDiagnostic {
  url: string;
  loading: string;
  complete: boolean;
  naturalWidth: number;
  currentSrc: string;
  nearest: string;
}

export function formatMediaDiagnostic(diagnostic: MediaDiagnostic) {
  return `url=${diagnostic.url} loading=${diagnostic.loading} complete=${diagnostic.complete} naturalWidth=${diagnostic.naturalWidth} currentSrc=${diagnostic.currentSrc} nearest=${diagnostic.nearest}`;
}

const visualFontFaces = [
  ['DM Sans', 400, 'normal'],
  ['DM Sans', 500, 'normal'],
  ['DM Sans', 600, 'normal'],
  ['IBM Plex Mono', 400, 'normal'],
  ['IBM Plex Mono', 500, 'normal'],
  ['Source Serif 4', 400, 'normal'],
  ['Source Serif 4', 400, 'italic'],
  ['Source Serif 4', 600, 'normal'],
] as const;

export function requiredVisualFontFaces() {
  return visualFontFaces;
}

export function visualNetworkPolicy(
  value: string,
  allowedOrigins: readonly string[],
): 'continue' | 'fulfill' | 'reject' {
  const url = new URL(value);
  const exactOrigins = new Set(
    allowedOrigins.map((origin) => {
      const allowed = new URL(origin);
      if (!['http:', 'https:'].includes(allowed.protocol))
        throw new Error(`Visual allowlist entry must be an HTTP(S) origin`);
      return allowed.origin;
    }),
  );
  if (exactOrigins.has(url.origin)) return 'continue';
  if (['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname))
    return 'fulfill';
  if (['utteranc.es', 'open.spotify.com'].includes(url.hostname))
    return 'fulfill';
  return 'reject';
}

export function mockupControlsToHide(
  family: MockupFamily,
  project: VisualProject,
) {
  return [
    '.companion-bar',
    ...(family === 'index' && project === 'phone'
      ? ['.mobile-collection-switcher']
      : []),
    ...(family === 'detail' ? ['.type-switcher'] : []),
  ];
}

const projectsByBaseline = {
  homepage: ['desktop', 'tablet', 'phone'],
  'article-listwithme': ['desktop', 'tablet', 'phone'],
  'index-blog': ['desktop', 'tablet', 'phone'],
  'index-app-library': ['desktop', 'phone'],
  'index-my-apps': ['desktop', 'phone'],
  'index-skill-library': ['desktop', 'phone'],
  'index-my-skills': ['desktop', 'phone'],
  'detail-my-app': ['desktop', 'tablet', 'phone'],
  'detail-used-app': ['desktop', 'phone'],
  'detail-used-skill': ['desktop', 'phone'],
  'detail-my-skill': ['desktop', 'phone'],
  'interaction-mobile-browse-open-phone': ['phone'],
  'interaction-keyboard-focus-desktop': ['desktop'],
  'interaction-expanded-toc-phone': ['phone'],
} as const satisfies Record<string, readonly VisualProject[]>;

export function canonicalProjects(name: string): readonly VisualProject[] {
  const projects = projectsByBaseline[name as keyof typeof projectsByBaseline];
  if (!projects) throw new Error(`Unknown canonical visual baseline: ${name}`);
  return projects;
}

export function canonicalCaptureSpecs(name: string) {
  const viewport = {
    name: `${name}-viewport.png`,
    fullPage: false,
    preloadAllMedia: false,
  } as const;
  return name.startsWith('interaction-')
    ? [viewport]
    : [
        viewport,
        {
          name: `${name}-full-page.png`,
          fullPage: true,
          preloadAllMedia: true,
        } as const,
      ];
}

export function canonicalBaselineMatrix() {
  return Object.entries(projectsByBaseline).flatMap(([name, projects]) =>
    projects.flatMap((project) =>
      canonicalCaptureSpecs(name).map(({ name: _filename, fullPage }) => ({
        name,
        project,
        mode: fullPage ? ('full-page' as const) : ('viewport' as const),
      })),
    ),
  );
}
