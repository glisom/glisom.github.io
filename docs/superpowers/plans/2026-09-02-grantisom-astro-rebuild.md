# GrantIsom.com Astro Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild GrantIsom.com as a static Astro personal site that preserves every current public URL while delivering the approved Evidence Index homepage, article, collection-index, and dossier page families.

**Architecture:** Build Astro alongside the untouched Jekyll source on a dedicated implementation branch so production remains reversible until cutover. Strict content collections and an independently authored public-route manifest feed static routes, layouts, RSS, sitemap, and validation; routes query content and pass serializable data into presentational Astro components. Release only after content parity, accessibility, same-frame visual comparison, and a production-style crawl all pass.

**Tech Stack:** Astro 7.2.10, TypeScript 5.9.3, Astro Content Layer, MDX 8.0.0, Vitest 4.1.11, Playwright 1.62.1, axe-core 4.13.0, Cheerio 1.2.0, Sharp 0.35.4, locally bundled Fontsource fonts, Phosphor Icons, GitHub Pages, Node 24.20.0 LTS, npm 11.19.0.

**Spec:** `docs/superpowers/specs/2026-09-02-grantisom-astro-site-design.md`

## Global Constraints

- Use Astro static output with `site: 'https://grantisom.com'`, `output: 'static'`, `trailingSlash: 'ignore'`, and `build.format: 'preserve'`.
- Before every fresh local terminal process, run `eval "$(fnm env --shell zsh)"`, `fnm use 24.20.0`, and `npm run runtime:check` in that same process before any bare root `npm`, `npx`, or `node` command shown below. Alternatively prefix the command with `fnm exec --using=.nvmrc`. Root `.npmrc` uses `engine-strict=true`, so an accidental Node/npm mismatch fails instead of warning; never invoke a displayed bare command outside one of those two verified contexts.
- Keep the approved Vite homepage untouched and create only the allowlisted durable copy at `design-reference/vite-homepage/`.
- Preserve all 23 dated `.html` post URLs, every permanent utility route, all 20 legacy compatibility originals, the four `/uploads/2023/` aliases, and `dist/CNAME`.
- Keep `/projects/` canonical for My Apps and `/listwithme/` canonical for ListWithMe; never generate `/projects/listwithme/`.
- Render the site shell, indexes, articles, and dossiers as static HTML; do not add React unless an isolated interaction proves native HTML insufficient.
- Use Source Serif 4, DM Sans, IBM Plex Mono, Phosphor Icons, the approved mineral-paper palette, electric blue for `Used by Grant`, and acid lime for `Made by Grant`.
- Initial release is light-only. Preserve `/assets/js/darkmode.js` as a dormant compatibility file and never load it from Astro pages.
- Do not add search at launch, ratings, affiliate treatment, consulting-services copy, client logos, a CMS, a database, or inferred relationships. Reconsider category filtering only around 24 entries and search only around 50 entries.
- Exclude drafts from pages, feeds, and sitemap. Fail the build on duplicate paths, invalid relationships, unsafe legacy HTML, missing required alt text, invalid title accents, or fake action destinations.
- Use first-person, personal copy for newly authored pages; preserve legacy blog prose semantically rather than rewriting it.
- Keep every touch target at least 44px on touch layouts, meet WCAG AA, respect reduced motion, and prevent page-level horizontal overflow.
- Render utility labels at 10–12px; never carry the prototype's 8–9px utility sizes into production.
- Leave `.obsidian/` untouched. Do not remove or move Jekyll source until the first Astro production crawl has passed.
- Use the in-app browser for visual inspection. Before invoking Playwright browser automation, confirm that automated browser control is authorized for the verification task.
- Commit after every task. Do not push, change GitHub Pages settings, publish a preview, merge, tag, or deploy without Grant's explicit approval.

---

## Delivery Phases

1. **Foundation and migration:** Tasks 1–6 establish the runtime, frozen reference, independent contracts, exact legacy bytes, 23 migrated posts, and the 16 launch records.
2. **Page families:** Tasks 7–12 build the shared shell, homepage, article system, five indexes, four dossier variants, About, legal/support, and 404.
3. **Discovery, verification, and cutover:** Tasks 13–15 add metadata and feeds, run whole-site QA, and prepare the reversible GitHub Pages release.

Each task is a separate review gate. A later task may consume an earlier task's public interfaces, but it must not silently change the earlier task's content or route contracts.

## File Responsibility Map

| Area | Files | Responsibility |
|---|---|---|
| Runtime | `package.json`, `package-lock.json`, `.nvmrc`, `.npmrc`, `astro.config.mjs`, `tsconfig.json`, `scripts/verify-runtime.mjs` | Pin and enforce a reproducible static Astro build. |
| Frozen reference | `design-reference/vite-homepage/**`, `scripts/verify-design-reference.mjs` | Preserve and checksum the approved Vite target without runtime coupling. |
| Content contracts | `src/content.config.ts`, `src/types/content.ts`, `src/lib/content/**` | Define schemas, pure record validation, the Astro-only loader boundary, homepage selection, relationships, reading time, and route identity. |
| Content | `src/content/blog/**`, `src/content/app-library/**`, `src/content/projects/**`, `src/content/skill-library/**`, `src/content/skills/**` | Hold the 23 migrated posts and 16 launch records. |
| Site data | `src/data/site.ts`, `navigation.ts`, `social.ts`, `now.ts`, `collections.ts`, `listwithme.ts` | Provide stable personal copy and navigation that is not record content. |
| Shell | `src/layouts/BaseLayout.astro`, `src/components/shell/**`, `src/components/media/**`, `src/styles/{tokens,global,shell,utilities}.css` | Own document structure, identity rail, mobile Browse control, footer, metadata, fonts, icons, and global responsive rules. |
| Homepage | `src/layouts/HomeLayout.astro`, `src/components/home/**`, `src/pages/index.astro` | Port the approved Vite composition using selected content records. |
| Articles | `src/layouts/ArticleLayout.astro`, `src/components/editorial/**`, `src/styles/prose.css`, `src/pages/[year]/[month]/[day]/[slug].astro` | Render migrated writing, contents, embeds, related records, post navigation, and comments. |
| Indexes | `src/layouts/CollectionIndexLayout.astro`, `src/components/index/**`, five collection `index.astro` routes | Render the five collection-specific index anatomies. |
| Dossiers | `src/layouts/DetailLayout.astro`, `src/components/detail/**`, four dynamic detail route families, `src/pages/listwithme/index.astro` | Render Used/Made records and the ListWithMe exception. |
| Utility | `src/layouts/UtilityLayout.astro`, About, Support, Privacy, and `404.astro` | Render personal and permanent non-collection pages. |
| Discovery | `src/pages/{feed.xml,sitemap.xml,robots.txt}.ts`, `src/assets/social/default-og.png` | Generate RSS, sitemap, robots, canonical metadata, and social preview. |
| Verification | `tests/fixtures/**`, `tests/contracts/**`, `tests/e2e/**`, `tests/visual/**`, `scripts/{capture-production-baseline,validate-built-site,compare-crawls,make-comparison}.mjs` | Keep source migration, output paths, links, accessibility, and visuals independently testable. |
| Delivery | `.github/workflows/{astro-ci,pages}.yml`, `README.md` | Build pull requests without deployment and publish the approved `dist/` artifact. |

## Stable Interfaces

Define these names once in Tasks 2 and 4 and reuse them unchanged:

```ts
export type PrimaryCollection =
  | 'blog'
  | 'app-library'
  | 'projects'
  | 'skill-library'
  | 'skills';

export type RailContext =
  | { kind: 'home' }
  | { kind: 'index'; count: number; updatedAt?: string }
  | { kind: 'article'; title: string; date: string; postKind: string; minutes: number }
  | { kind: 'detail'; title: string; ownership: 'made' | 'used'; status?: string; reviewedAt?: string }
  | { kind: 'utility'; title: string; parent?: string };

export interface RelationshipRef {
  collection: PrimaryCollection;
  id: string;
  label: string;
}

export interface ResolvedRelationship extends RelationshipRef {
  title: string;
  summary: string;
  canonicalPath: string;
}

export interface RouteContract {
  canonicalPath: string;
  outputPath: string;
  kind: 'page' | 'post' | 'utility';
  inSitemap: boolean;
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

export interface DetailPageProps {
  record: NonBlogRecord;
  collectionLabel: string;
  recordNumber: number;
  recordCount: number;
  nextRecord: { title: string; canonicalPath: string } | null;
}
```

Public functions:

```ts
export function canonicalPathToOutputPath(path: string): string;
export function calculateReadingMinutes(markdown: string, wordsPerMinute?: number): number;
export function formatPublicDate(isoDate: string, style?: 'long' | 'short'): string;
export function comparePostsNewestFirst<T extends { data: { canonicalPath: string; publishedAt?: string; originalTimestamp?: string } }>(a: T, b: T): number;
export async function loadContentGraph(): Promise<ContentGraph>;
export function validateContentGraph(graph: ContentGraph): readonly ContentIssue[];
export function assertValidContentGraph(graph: ContentGraph): void;
export function selectHomepageContent(graph: ContentGraph): HomepageContent;
export function groupPostsByYear<T extends { data: { publishedAt: string } }>(posts: readonly T[]): ReadonlyMap<string, readonly T[]>;
export function resolveRelationships(source: AnySiteRecord, graph: ContentGraph): readonly ResolvedRelationship[];
export function buildRouteManifest(graph: ContentGraph): readonly RouteContract[];
```

---

### Task 1: Create the Reversible Astro Foundation and Freeze the Vite Reference

**Files:**
- Create: `.nvmrc`
- Create: `.npmrc`
- Create: `package.json`
- Create: `package-lock.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `src/env.d.ts`
- Create: `src/pages/index.astro`
- Create: `vitest.config.ts`
- Create: `.prettierignore`
- Create: `.prettierrc.json`
- Create: `scripts/verify-design-reference.mjs`
- Create: `scripts/verify-runtime.mjs`
- Create: `tests/contracts/config.test.ts`
- Create: `tests/contracts/design-reference.test.ts`
- Verify unchanged: `docs/design/mockups/{article-family-approved,index-family-approved,detail-family-approved}.html`
- Create: `design-reference/vite-homepage/**` from the spec's explicit allowlist
- Create: `design-reference/vite-homepage/README.md`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: Approved spec and frozen prototype at `/Users/grantisom/.codex/visualizations/2026/09/01/01a05e66-5a21-78c0-80de-66330ee5d428/grantisom-evidence-index`.
- Produces: `npm run dev`, `npm run check`, `npm run build`, `npm test`, `verifyDesignReference(root: URL): Promise<void>`, `verifyApprovedMockups(repoRoot: URL): Promise<void>`, and a source-preserving Astro build independent from the still-deployable Jekyll site.

- [ ] **Step 1: Create a dedicated execution worktree from the approved-spec commit**

Invoke `superpowers:using-git-worktrees`. Create `rebuild/astro` from the current committed `HEAD` containing both `dcbec3e` and this implementation-plan commit, not from an older remote ref. Confirm the new worktree is clean and the plan is tracked:

```bash
git status --short
git log -1 --oneline
git ls-files --error-unmatch docs/superpowers/plans/2026-09-02-grantisom-astro-rebuild.md
```

Expected: no status output; the latest commit is the local plan commit descended from `dcbec3e`, and `git ls-files` prints this plan path.

- [ ] **Step 2: Add the pinned runtime manifest**

Create `.nvmrc` with:

```text
24.20.0
```

Create `package.json` with:

```json
{
  "name": "grantisom-com",
  "private": true,
  "type": "module",
  "engines": {
    "node": "24.20.0",
    "npm": "11.19.0"
  },
  "packageManager": "npm@11.19.0",
  "scripts": {
    "preinstall": "node scripts/verify-runtime.mjs",
    "runtime:check": "node scripts/verify-runtime.mjs",
    "predev": "npm run runtime:check",
    "dev": "astro dev",
    "precheck": "npm run runtime:check",
    "check": "astro check",
    "prebuild": "npm run runtime:check",
    "build": "astro check && astro build",
    "preview": "astro preview",
    "pretest": "npm run runtime:check",
    "test": "vitest run",
    "test:watch": "vitest",
    "format:check": "prettier --check ."
  },
  "dependencies": {
    "@astrojs/mdx": "8.0.0",
    "@astrojs/rss": "4.0.19",
    "@fontsource/dm-sans": "5.3.0",
    "@fontsource/ibm-plex-mono": "5.3.0",
    "@fontsource/source-serif-4": "5.3.0",
    "@phosphor-icons/web": "2.1.2",
    "astro": "7.2.10",
    "markdown-it": "15.0.1"
  },
  "devDependencies": {
    "@astrojs/check": "0.9.10",
    "@axe-core/playwright": "4.13.0",
    "@playwright/test": "1.62.1",
    "@types/markdown-it": "14.2.0",
    "@types/node": "24.13.3",
    "cheerio": "1.2.0",
    "fast-glob": "3.3.3",
    "gray-matter": "4.0.3",
    "parse5": "8.0.1",
    "prettier": "3.9.6",
    "prettier-plugin-astro": "0.14.1",
    "sharp": "0.35.4",
    "tsx": "4.23.13",
    "typescript": "5.9.3",
    "vitest": "4.1.11",
    "yaml": "2.9.0"
  }
}
```

Create root `.npmrc`:

```ini
engine-strict=true
```

Create `scripts/verify-runtime.mjs` before installing:

```js
const EXPECTED_NODE = '24.20.0';
const EXPECTED_NPM = '11.19.0';
const actualNpm = process.env.npm_config_user_agent?.match(/^npm\/([^ ]+)/)?.[1];

if (process.versions.node !== EXPECTED_NODE || actualNpm !== EXPECTED_NPM) {
  throw new Error(`Expected Node ${EXPECTED_NODE} / npm ${EXPECTED_NPM}; received Node ${process.versions.node} / npm ${actualNpm ?? 'unknown'}`);
}
```

Activate the pinned runtime and install the exact package manager before generating the lockfile. This workstation has `fnm`; `.nvmrc` documents the version but does not switch later noninteractive shells by itself:

```bash
eval "$(fnm env --shell zsh)"
fnm install 24.20.0
fnm exec --using=.nvmrc npm install --global npm@11.19.0
fnm use 24.20.0
hash -r
test "$(node --version)" = "v24.20.0"
test "$(npm --version)" = "11.19.0"
npm run runtime:check
npm install --package-lock-only
npm ci
```

Expected: all commands exit 0; the active parent shell and child processes both report the exact Node/npm pair, wrong runtimes are rejected, and `package-lock.json` pins the declared graph. Every later local root command in this plan that begins with `npm`, `npx`, or `node` is executed only after the Global Constraints preamble in the same terminal process; use the explicit `fnm exec --using=.nvmrc ...` form for an isolated one-line invocation.

- [ ] **Step 3: Write the failing Astro configuration contract**

Create `tests/contracts/config.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import config from '../../astro.config.mjs';

describe('Astro output contract', () => {
  it('preserves index and dated-file source shapes', () => {
    expect(config.site).toBe('https://grantisom.com');
    expect(config.output).toBe('static');
    expect(config.trailingSlash).toBe('ignore');
    expect(config.build).toMatchObject({ format: 'preserve' });
  });
});
```

Run: `npm test -- tests/contracts/config.test.ts`

Expected: FAIL because `astro.config.mjs` does not exist.

- [ ] **Step 4: Add the minimal static Astro application**

Create `astro.config.mjs`:

```js
import mdx from '@astrojs/mdx';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://grantisom.com',
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'preserve' },
  integrations: [mdx()],
});
```

Create `tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

Create `src/env.d.ts`:

```ts
/// <reference types="astro/client" />
```

Create the valid interim `src/pages/index.astro`; Task 7 replaces its body with the approved homepage:

```astro
---
const title = 'Grant Isom';
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>{title}</title>
  </head>
  <body>
    <main>
      <h1>Grant Isom</h1>
      <p>Writer, maker, curious person.</p>
    </main>
  </body>
</html>
```

Create `vitest.config.ts` through Astro's Vite-aware test configuration so later component contracts can import `.astro` files directly:

```ts
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    fileParallelism: false,
  },
});
```

Built-output contract files intentionally run sequentially because several invoke the same `dist/` and `.astro/` build directories. This prevents parallel Vitest files from deleting or rewriting one another's output.

Create `.prettierignore` so active-code formatting never rewrites frozen references, design approvals, private Obsidian state, or legacy Jekyll inputs:

```text
.obsidian/
.astro/
dist/
node_modules/
test-results/
playwright-report/
design-reference/vite-homepage/
docs/design/mockups/
docs/superpowers/
docs/qa/crawls/
public/
tests/fixtures/
_includes/
_layouts/
_pages/
_posts/
_sass/
src/content/blog/
assets/
css/
images/
index.html
404.md
feed.xml
sitemap.xml
```

Create `.prettierrc.json`:

```json
{
  "plugins": ["prettier-plugin-astro"],
  "overrides": [{ "files": "*.astro", "options": { "parser": "astro" } }],
  "singleQuote": true,
  "trailingComma": "all"
}
```

Run: `npm test -- tests/contracts/config.test.ts && npm run build`

Expected: PASS; `dist/index.html` exists.

- [ ] **Step 5: Copy only the approved Vite reference allowlist**

Set the immutable source once and make the target directories:

```bash
REFERENCE_SOURCE=/Users/grantisom/.codex/visualizations/2026/09/01/01a05e66-5a21-78c0-80de-66330ee5d428/grantisom-evidence-index
mkdir -p design-reference/vite-homepage/src design-reference/vite-homepage/public/assets
cp "$REFERENCE_SOURCE/.npmrc" design-reference/vite-homepage/.npmrc
cp "$REFERENCE_SOURCE/index.html" "$REFERENCE_SOURCE/package.json" "$REFERENCE_SOURCE/package-lock.json" "$REFERENCE_SOURCE/vite.config.mjs" design-reference/vite-homepage/
cp "$REFERENCE_SOURCE/src/App.jsx" "$REFERENCE_SOURCE/src/main.jsx" "$REFERENCE_SOURCE/src/styles.css" design-reference/vite-homepage/src/
cp "$REFERENCE_SOURCE/public/assets/"*.png design-reference/vite-homepage/public/assets/
cp "$REFERENCE_SOURCE/implementation-1586x992-final.png" "$REFERENCE_SOURCE/implementation-tablet-1024x768-final.png" "$REFERENCE_SOURCE/implementation-mobile-390x844-final.png" "$REFERENCE_SOURCE/qa-comparison-final.png" "$REFERENCE_SOURCE/design-qa.md" design-reference/vite-homepage/
```

Do not copy any directory or file outside that command's explicit source list.

Create `design-reference/vite-homepage/README.md`:

```markdown
# Frozen Evidence Index Homepage

This is the approved Vite visual reference for the Astro rebuild. Treat it as immutable.

Run it independently with Node 25.9.0 and npm 11.12.1:

    npm ci
    npm run dev -- --port 4173

The Astro site runs separately from the repository root. Never import this reference at production runtime.
```

- [ ] **Step 6: Write the failing checksum test**

Create `tests/contracts/design-reference.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { verifyApprovedMockups, verifyDesignReference } from '../../scripts/verify-design-reference.mjs';

describe('frozen Vite reference', () => {
  it('contains exactly the approved source with matching checksums', async () => {
    await expect(
      verifyDesignReference(new URL('../../design-reference/vite-homepage/', import.meta.url)),
    ).resolves.toBeUndefined();
    await expect(
      verifyApprovedMockups(new URL('../../', import.meta.url)),
    ).resolves.toBeUndefined();
  });
});
```

Run: `npm test -- tests/contracts/design-reference.test.ts`

Expected: FAIL because `verifyDesignReference` is not exported.

- [ ] **Step 7: Implement checksum and forbidden-directory verification**

Create `scripts/verify-design-reference.mjs`:

```js
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const EXPECTED = new Map([
  ['.npmrc', 'f7dbda001b627b3a792fb6929303b517f047f03916f2c55227e81216d38a2008'],
  ['README.md', 'bc9600070bd25300459cc00558de2782a1b2200e387b2e07456d0bb5deca97d8'],
  ['design-qa.md', '3ec6e2871c93c4cc9edc4fcbba704b558978ff8286f6cb6036894f288c19cad8'],
  ['implementation-1586x992-final.png', 'fe0025d3b2546ab61bd01b08cd3434d87d87797d0d7e1443542ff6199a9c1bb5'],
  ['implementation-mobile-390x844-final.png', '954634babc032e85d5f69fe40ad31d9796fa77de7fbe4368d0afa399f4d73e7c'],
  ['implementation-tablet-1024x768-final.png', 'ff17196da17b5e3049c1cce42c4465f3178758109f58e55b12d474d2be9a0ea9'],
  ['index.html', 'e7835ed4449617c4b8e03f65d11a85a0d94f2723034bf918a80b5eef26adf70b'],
  ['package-lock.json', '7f92505e9b14ce43b19098f912dadfaf4b2d9e00946515b27164056cdf2f8cb7'],
  ['package.json', '6da7b5fa00ce08c5ade67b451b76d3a7c0a0c2daf8a58f9579d7181c3b5c87a5'],
  ['public/assets/belief-rings.png', 'd3c35899bd468d03ae4d378bd189e51da380e9d186ad6172ec6516249ebb3a4c'],
  ['public/assets/evidence-map.png', '4efca1a712c17c2c3e18e230901cc907efdd640eeeab75ae131bdbb3c16e4fca'],
  ['public/assets/groundwork-surveyor.png', 'a7c86040a97c815f75cf993fc4b259b047acad9c2cb09e70c17327ce02d7c3d2'],
  ['public/assets/healthql-hands.png', '51a0197ad6cab814220c56a8fa9b95ebbb2fbaa40d8d2b71803aca89c0de92f9'],
  ['public/assets/listwithme-hand.png', '7a07122b810641ba0bd6c316f0ffa3597699cb663b190089aa209f4609264545'],
  ['public/assets/production-hands.png', '5ef3e3896769f764cc6d81852bb9db06f252825cdba390fbe30e7e9e7e089a9b'],
  ['qa-comparison-final.png', '643c44948f7471f88ea24ff1eb50618e4b7e9a8e14628718f9174146fef8cea7'],
  ['src/App.jsx', 'b4f5db54c201bed782110fca82f999d905250e8c8ae1be92e0df917ba5c79c3f'],
  ['src/main.jsx', '832f752c6b6a454a26dbc4f2654f5bd633f2b103516c8c0abac648308c133a7e'],
  ['src/styles.css', 'b7befee81f1df7c5bcd1dce2250ba48c7f5a7f534e139e2cb48006e09cff6ce3'],
  ['vite.config.mjs', '5f20ad6ef5aa89956c8791d8caefa224bc80718ca38df213b5e0c9c883d4bfee'],
]);

const APPROVED_MOCKUPS = new Map([
  ['docs/design/mockups/article-family-approved.html', 'efa474e3b08488a09efd617e15c99bb7ac1a156ea858068ffb35ee325296117e'],
  ['docs/design/mockups/index-family-approved.html', '0a7c45a605b562873215f5e129152fe5031b0d3fdeb06cef5d9d9f405b70b363'],
  ['docs/design/mockups/detail-family-approved.html', '60b6a3a27166f70d035cf37ccb7c0c2541e7057273a1df178698ea0b038e75ec'],
]);

async function listImmutableFiles(root, relative = '') {
  const entries = await readdir(new URL(relative || './', root), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = `${relative}${entry.name}`;
    if (!relative && entry.isDirectory() && ['node_modules', 'dist'].includes(entry.name)) continue;
    if (entry.isDirectory()) files.push(...await listImmutableFiles(root, `${path}/`));
    else if (entry.isFile()) files.push(path);
    else throw new Error(`Unsupported reference entry: ${path}`);
  }
  return files.toSorted();
}

export async function verifyDesignReference(root) {
  const actualPaths = await listImmutableFiles(root);
  const expectedPaths = [...EXPECTED.keys()].toSorted();
  if (JSON.stringify(actualPaths) !== JSON.stringify(expectedPaths)) {
    throw new Error(`Reference manifest mismatch:\nexpected ${expectedPaths.join('\n')}\nreceived ${actualPaths.join('\n')}`);
  }
  for (const [relativePath, expected] of EXPECTED) {
    const bytes = await readFile(new URL(relativePath, root));
    const actual = createHash('sha256').update(bytes).digest('hex');
    if (actual !== expected) throw new Error(`${relativePath}: expected ${expected}, received ${actual}`);
  }
}

export async function verifyApprovedMockups(repoRoot) {
  for (const [relativePath, expected] of APPROVED_MOCKUPS) {
    const bytes = await readFile(new URL(relativePath, repoRoot));
    const actual = createHash('sha256').update(bytes).digest('hex');
    if (actual !== expected) throw new Error(`${relativePath}: expected ${expected}, received ${actual}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await verifyDesignReference(new URL('../design-reference/vite-homepage/', import.meta.url));
  await verifyApprovedMockups(new URL('../', import.meta.url));
}
```

Add to `.gitignore` without altering existing rules:

```gitignore
node_modules/
dist/
.astro/
test-results/
playwright-report/
design-reference/vite-homepage/node_modules/
design-reference/vite-homepage/dist/
```

Run:

```bash
npm test -- tests/contracts/config.test.ts tests/contracts/design-reference.test.ts
npm run build
git status --short
```

Expected: tests and build pass; all 20 immutable reference files match their exact manifest and checksum. Locally generated nested `node_modules/` or `dist/` may exist after running the reference but remain ignored and excluded from the immutable manifest; no copied `.openai`, `.superpowers`, worker, site, QA scratch, or other source path appears.

- [ ] **Step 8: Commit the foundation**

```bash
git add .nvmrc .npmrc package.json package-lock.json astro.config.mjs tsconfig.json vitest.config.ts .prettierignore .prettierrc.json src/env.d.ts src/pages/index.astro scripts/verify-runtime.mjs scripts/verify-design-reference.mjs tests/contracts/config.test.ts tests/contracts/design-reference.test.ts design-reference/vite-homepage .gitignore
git commit -m "build: establish Astro rebuild foundation"
```

---

### Task 2: Capture the Independent Production and Public-Route Contracts

**Files:**
- Create: `tests/fixtures/public-routes.json`
- Create: `tests/fixtures/legacy-pages.json`
- Create: `tests/fixtures/migration-allowances.json`
- Create: `tests/fixtures/listwithme-legal.json`
- Create: `scripts/capture-production-baseline.mjs`
- Create: `scripts/capture-listwithme-legal.ts`
- Create: `scripts/lib/legal-semantic.ts`
- Create: `tests/contracts/production-baseline.test.ts`
- Create: `tests/contracts/legal-semantic.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: Current `https://grantisom.com` responses and the approved route lists in spec Sections 6 and 14.
- Produces: `capturePage(url: URL): Promise<LegacyPageSnapshot>`, `extractSemanticPage(html: string): SemanticPage`, `extractLegalMarkdown(markdown): LegalSemantic`, `extractLegalHtml(html): LegalSemantic`, and immutable article/legal fixtures independent from Astro route generation.

- [ ] **Step 1: Hand-author the public route oracle**

Create `tests/fixtures/public-routes.json` as an object whose `routes` property contains 52 `RouteContract` objects. Use these exact groups and counts:

```json
{
  "expectedArtifactCount": 52,
  "expectedSitemapCount": 48,
  "groups": {
    "core": 7,
    "legacyPosts": 23,
    "appLibraryDetails": 4,
    "myAppDetails": 4,
    "skillLibraryDetails": 5,
    "mySkillDetails": 3,
    "listWithMeUtilities": 2,
    "discoveryAndError": 4
  },
  "routes": []
}
```

Replace the empty `routes` array with the full 52 objects, including all 23 paths from spec Section 14, using these mapping rules:

```ts
{ canonicalPath: '/', outputPath: 'index.html', kind: 'page', inSitemap: true }
{ canonicalPath: '/blog/', outputPath: 'blog/index.html', kind: 'page', inSitemap: true }
{ canonicalPath: '/2020/05/23/mac_apps.html', outputPath: '2020/05/23/mac_apps.html', kind: 'post', inSitemap: true }
{ canonicalPath: '/projects/hermes-ios/', outputPath: 'projects/hermes-ios/index.html', kind: 'page', inSitemap: true }
{ canonicalPath: '/listwithme/', outputPath: 'listwithme/index.html', kind: 'page', inSitemap: true }
{ canonicalPath: '/feed.xml', outputPath: 'feed.xml', kind: 'utility', inSitemap: false }
{ canonicalPath: '/404.html', outputPath: '404.html', kind: 'utility', inSitemap: false }
```

The non-blog route set is exactly:

```text
/
/blog/
/app-library/
/projects/
/skill-library/
/skills/
/about/
/app-library/obsidian/
/app-library/codex/
/app-library/hermes-agent/
/app-library/superhuman/
/projects/hermes-ios/
/listwithme/
/projects/healthql/
/projects/drift-dreams/
/skill-library/deep-research/
/skill-library/browser-control/
/skill-library/frontend-design/
/skill-library/documents/
/skill-library/pdf/
/skills/write-like-grant/
/skills/goodreads-export/
/skills/hatch-pet/
/listwithme/support/
/listwithme/privacy/
/feed.xml
/sitemap.xml
/robots.txt
/404.html
```

The legacy post route set is exactly, and each maps to the same relative path beneath `dist/`:

```text
/2018/04/02/reading-list.html
/2018/11/27/playlists.html
/2019/05/30/listwithme.html
/2019/06/04/wwdc-day-1.html
/2019/06/06/wwdc-day-2.html
/2019/06/07/wwdc-day-3.html
/2019/06/08/wwdc-day-4.html
/2019/06/09/wwdc-review.html
/2020/02/10/2019-playlists.html
/2020/05/23/mac_apps.html
/2020/05/29/safari-inspecting-simulators.html
/2020/09/28/next-chapter.html
/2022/11/07/2-years-at-illuminate.html
/2023/01/02/mustread-books-for.html
/2023/01/14/notion-for-software.html
/2023/02/01/expo-app-config.html
/2023/05/15/using-act-to.html
/2023/07/19/accessibility-testing-in.html
/2026/02/01/healthql-sql-for-healthkit.html
/2026/02/07/healthql-react-native.html
/2026/02/24/listwithme-returns.html
/2026/09/01/skill-thief.html
/2026/09/01/vampire.html
```

- [ ] **Step 2: Write the failing route-oracle shape test**

Create `tests/contracts/production-baseline.test.ts`:

```ts
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('independent public contract', () => {
  it('contains 52 unique artifacts and 48 sitemap pages', async () => {
    const fixture = JSON.parse(
      await readFile(new URL('../fixtures/public-routes.json', import.meta.url), 'utf8'),
    );
    const routes = fixture.routes;
    expect(routes).toHaveLength(52);
    expect(new Set(routes.map((route: { canonicalPath: string }) => route.canonicalPath)).size).toBe(52);
    expect(routes.filter((route: { inSitemap: boolean }) => route.inSitemap)).toHaveLength(48);
    expect(routes.some((route: { outputPath: string }) => route.outputPath === 'projects/listwithme/index.html')).toBe(false);
  });
});
```

Run: `npm test -- tests/contracts/production-baseline.test.ts`

Expected: FAIL until all 52 route objects have been added.

- [ ] **Step 3: Capture semantic production snapshots before migration**

Create `scripts/capture-production-baseline.mjs` with these exports and extraction behavior:

```js
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import * as cheerio from 'cheerio';

export function extractSemanticPage(html) {
  const $ = cheerio.load(html);
  const semanticRoot = $('.c-article__main').first().length
    ? $('.c-article__main').first()
    : $('.prose').first();
  return {
    title: $('h1').first().text().trim(),
    headings: semanticRoot.find('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]').map((_, node) => ({
      level: Number(node.tagName.slice(1)),
      text: $(node).text().trim(),
      id: $(node).attr('id'),
    })).get(),
    text: semanticRoot.text().replace(/\s+/g, ' ').trim(),
    links: semanticRoot.find('a[href]').map((_, node) => $(node).attr('href')).get(),
    images: semanticRoot.find('img[src]').map((_, node) => $(node).attr('src')).get(),
    codeBlocks: semanticRoot.find('pre code').map((_, node) => $(node).text()).get(),
    iframeSources: semanticRoot.find('iframe[src]').map((_, node) => $(node).attr('src')).get(),
  };
}

export async function capturePage(url) {
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  const html = await response.text();
  const semantic = extractSemanticPage(html);
  return {
    url: url.href,
    status: response.status,
    ...semantic,
    semanticDigest: createHash('sha256').update(JSON.stringify(semantic)).digest('hex'),
  };
}
```

The executable portion reads only the 23 post routes from `public-routes.json`, calls `capturePage(new URL(path, 'https://grantisom.com'))`, and writes deterministically sorted JSON to `tests/fixtures/legacy-pages.json`. Add `tests/fixtures/migration-allowances.json` as reviewed, structured transforms—not string labels—with only these objects:

```json
[
  {
    "id": "correct-four-notion-image-paths",
    "path": "/2023/01/14/notion-for-software.html",
    "field": "images",
    "operation": "replace-exact",
    "replacements": {
      "/uploads/2023/f159196842.png": "/images/f159196842.png",
      "/uploads/2023/fa6c5dfe53.png": "/images/fa6c5dfe53.png",
      "/uploads/2023/5fd90bfbf1.png": "/images/5fd90bfbf1.png",
      "/uploads/2023/6647450a28.png": "/images/6647450a28.png"
    },
    "expectedOccurrences": 4
  },
  {
    "id": "replace-listwithme-placeholder-app-store-link",
    "path": "/2026/02/24/listwithme-returns.html",
    "field": "links",
    "operation": "replace-exact",
    "before": "#",
    "after": "https://apps.apple.com/us/app/listwithme/id1224284271",
    "expectedOccurrences": 1
  },
  {
    "id": "normalize-playlists-body-h1",
    "path": "/2018/11/27/playlists.html",
    "field": "headings",
    "operation": "h1-to-h2",
    "expectedOccurrences": 5
  },
  {
    "id": "normalize-wwdc-day-1-body-h1",
    "path": "/2019/06/04/wwdc-day-1.html",
    "field": "headings",
    "operation": "h1-to-h2",
    "expectedOccurrences": 5
  },
  {
    "id": "upgrade-spotify-embeds",
    "path": "/2020/02/10/2019-playlists.html",
    "field": "iframeSources",
    "operation": "embed-with-fallback",
    "requiredAfter": ["title", "loading=lazy", "fallbackHrefEqualsSource", "fallbackText=Open {title}", "fallbackMarker=data-embed-fallback"],
    "semanticNormalization": "exclude-only-marked-fallback-from-text-and-links",
    "expectedOccurrences": 4
  }
]
```

Each migration transform consumes the object for its exact canonical path and must fail when its expected occurrence count is not met. For the Spotify transform, parity captures and validates all four candidate fallback contracts first, then removes only their marked `figcaption[data-embed-fallback]` nodes from the cloned candidate semantic root before comparing legacy prose text and link arrays; no other node is ignored. No wildcard path, body-wide ignore, or unstructured allowance is accepted.

Add to `package.json`:

```json
"capture:production": "node scripts/capture-production-baseline.mjs",
"capture:legal": "tsx scripts/capture-listwithme-legal.ts"
```

Create `scripts/lib/legal-semantic.ts` with these shared structures:

```ts
export interface LegalLink { text: string; href: string }
export type LegalBlock =
  | { kind: 'heading'; level: 2 | 3; text: string }
  | { kind: 'paragraph'; text: string; links: readonly LegalLink[] }
  | { kind: 'list'; ordered: boolean; items: readonly { text: string; links: readonly LegalLink[] }[] };
export interface LegalSemantic { title: string; blocks: readonly LegalBlock[] }

export function extractLegalMarkdown(markdown: string): LegalSemantic;
export function extractLegalHtml(html: string): LegalSemantic;
```

Both extractors normalize only repeated whitespace and nonbreaking spaces while preserving block order, heading level/text, list type/order, paragraph text, link labels, and destinations. The HTML extractor reads only `[data-legal-title]` and `[data-legal-content]`, deliberately excluding new TOC/back navigation. `capture-listwithme-legal.ts` reads the frozen `_pages/listwithme-support.md` and `_pages/listwithme-privacy.md`, serializes them under `support` and `privacy`, and writes deterministic `tests/fixtures/listwithme-legal.json`. `legal-semantic.test.ts` proves both frozen sources equal that fixture and that a changed claim or email destination does not.

Run:

```bash
npm run capture:production
npm run capture:legal
npm test -- tests/contracts/legal-semantic.test.ts
```

Expected: 23 sorted page snapshots; every response is 200; every deployed H2/H3 with an ID is captured; both legal sources match the fully reviewed semantic fixture. Review generated diffs before committing because these fixtures become migration oracles.

- [ ] **Step 4: Make the baseline contract pass**

Run:

```bash
npm test -- tests/contracts/production-baseline.test.ts
jq '.routes | length' tests/fixtures/public-routes.json
jq 'length' tests/fixtures/legacy-pages.json
npm test -- tests/contracts/legal-semantic.test.ts
```

Expected: PASS, then `52`, then `23`.

- [ ] **Step 5: Commit the independent oracle**

```bash
git add package.json package-lock.json scripts/capture-production-baseline.mjs scripts/capture-listwithme-legal.ts scripts/lib/legal-semantic.ts tests/fixtures/public-routes.json tests/fixtures/legacy-pages.json tests/fixtures/listwithme-legal.json tests/fixtures/migration-allowances.json tests/contracts/production-baseline.test.ts tests/contracts/legal-semantic.test.ts
git commit -m "test: capture public site migration contract"
```

---

### Task 3: Preserve Legacy Assets Byte-for-Byte

**Files:**
- Create: `public/favicon.ico`
- Create: `public/images/*` for all 17 approved originals
- Create: `public/uploads/2023/{f159196842,fa6c5dfe53,5fd90bfbf1,6647450a28}.png`
- Create: `public/assets/js/darkmode.js`
- Create: `public/css/main.css`
- Create: `public/CNAME`
- Create: `tests/fixtures/legacy-assets.json`
- Create: `tests/contracts/legacy-assets.test.ts`

**Interfaces:**
- Consumes: Existing repository files plus the currently deployed `/css/main.css`.
- Produces: 20 exact-byte compatibility originals, four exact-byte aliases, and `dist/CNAME` containing `grantisom.com`; new Astro markup never references dormant CSS or dark-mode JavaScript.

- [ ] **Step 1: Author the asset fixture and failing test**

Create `tests/fixtures/legacy-assets.json` as `{ "assets": [...] }` with one object per spec Section 14 path:

```json
{
  "path": "/css/main.css",
  "outputPath": "css/main.css",
  "sha256": "3a3d8ed6d67a96cf7cc1af5b5fceaffa54ffbb3dfcb4061cf3642c63fd4444b3",
  "mediaType": "text/css"
}
```

For each `/uploads/2023/*.png` object, add `aliasOf` with its exact `/images/*.png` target. Fill the other SHA-256 values from the current repository bytes with `shasum -a 256`; do not derive expected hashes from `public/` after copying.

Create `tests/contracts/legacy-assets.test.ts`:

```ts
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const root = new URL('../../public/', import.meta.url);
const digest = async (path: string) =>
  createHash('sha256').update(await readFile(new URL(path.replace(/^\//, ''), root))).digest('hex');

describe('legacy asset contract', () => {
  it('preserves every original and exact-byte alias', async () => {
    const fixture = JSON.parse(
      await readFile(new URL('../fixtures/legacy-assets.json', import.meta.url), 'utf8'),
    );
    expect(fixture.assets).toHaveLength(24);
    for (const asset of fixture.assets) {
      expect(await digest(asset.path)).toBe(asset.sha256);
      if (asset.aliasOf) expect(await digest(asset.path)).toBe(await digest(asset.aliasOf));
    }
  });

  it('preserves the custom domain', async () => {
    expect((await readFile(new URL('CNAME', root), 'utf8')).trim()).toBe('grantisom.com');
  });
});
```

Run: `npm test -- tests/contracts/legacy-assets.test.ts`

Expected: FAIL because `public/` has not been populated.

- [ ] **Step 2: Copy the compatibility originals and aliases**

Run these literal preservation operations:

```bash
mkdir -p public/images public/uploads/2023 public/assets/js public/css
cp favicon.ico public/favicon.ico
cp images/* public/images/
cp assets/js/darkmode.js public/assets/js/darkmode.js
cp CNAME public/CNAME
cp images/f159196842.png public/uploads/2023/f159196842.png
cp images/fa6c5dfe53.png public/uploads/2023/fa6c5dfe53.png
cp images/5fd90bfbf1.png public/uploads/2023/5fd90bfbf1.png
cp images/6647450a28.png public/uploads/2023/6647450a28.png
curl -fsSL https://grantisom.com/css/main.css -o public/css/main.css
```

Verify the deployed CSS before proceeding:

```bash
wc -c public/css/main.css
shasum -a 256 public/css/main.css
```

Expected: `14527` bytes and SHA-256 `3a3d8ed6d67a96cf7cc1af5b5fceaffa54ffbb3dfcb4061cf3642c63fd4444b3`. If production changed, compare it with the captured baseline and update the fixture only after confirming it is the current legitimate stylesheet.

- [ ] **Step 3: Verify source and built compatibility paths**

Run:

```bash
npm test -- tests/contracts/legacy-assets.test.ts
npm run build
test "$(tr -d '\r\n' < dist/CNAME)" = "grantisom.com"
```

Expected: PASS. Every fixture `outputPath` exists under `dist/` with the same SHA-256.

- [ ] **Step 4: Commit preserved bytes**

```bash
git add public tests/fixtures/legacy-assets.json tests/contracts/legacy-assets.test.ts
git commit -m "chore: preserve legacy public assets"
```

---

### Task 4: Define Strict Content Schemas, Routing, and Graph Validation

**Files:**
- Create: `src/types/content.ts`
- Create: `src/lib/content/schema.ts`
- Create: `src/lib/content/graph.ts`
- Create: `src/lib/content/load.ts`
- Create: `src/lib/content/homepage.ts`
- Create: `src/lib/content/relationships.ts`
- Create: `src/lib/content/routes.ts`
- Create: `src/lib/content/reading-time.ts`
- Create: `src/lib/content/date.ts`
- Create: `src/lib/content/grouping.ts`
- Create: `src/content.config.ts`
- Create: `tests/contracts/content-schema.test.ts`
- Create: `tests/contracts/content-types.test.ts`
- Create: `tests/contracts/routing.test.ts`
- Create: `tests/contracts/reading-time.test.ts`
- Create: `tests/contracts/date.test.ts`
- Create: `tests/contracts/grouping.test.ts`

**Interfaces:**
- Consumes: Stable interfaces in this plan and the field rules in spec Section 12.
- Produces: collection-specific record types, `ContentGraph`, `ContentIssue`, `canonicalPathToOutputPath`, `calculateReadingMinutes`, `formatPublicDate`, `comparePostsNewestFirst`, `groupPostsByYear`, pure `validateContentGraph`, Astro-only `loadContentGraph`, `assertValidContentGraph`, `selectHomepageContent`, `resolveRelationships`, and `buildRouteManifest` with the exact signatures listed above.

- [ ] **Step 1: Write failing tests for route identity and reading time**

Create `tests/contracts/routing.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { canonicalPathToOutputPath } from '../../src/lib/content/routes';

describe('canonicalPathToOutputPath', () => {
  it.each([
    ['/', 'index.html'],
    ['/projects/hermes-ios/', 'projects/hermes-ios/index.html'],
    ['/2020/05/23/mac_apps.html', '2020/05/23/mac_apps.html'],
    ['/feed.xml', 'feed.xml'],
    ['/404.html', '404.html'],
  ])('maps %s to %s', (canonicalPath, outputPath) => {
    expect(canonicalPathToOutputPath(canonicalPath)).toBe(outputPath);
  });
});
```

Create `tests/contracts/reading-time.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { calculateReadingMinutes } from '../../src/lib/content/reading-time';

describe('calculateReadingMinutes', () => {
  it('counts prose while excluding metadata, code, URLs, and tag syntax', () => {
    const prose = Array.from({ length: 226 }, (_, index) => `word${index}`).join(' ');
    const markdown = `---\ntitle: Hidden words\n---\n${prose}\n\n\`\`\`ts\n${'code '.repeat(500)}\n\`\`\`\n![alt](/images/example.png)`;
    expect(calculateReadingMinutes(markdown)).toBe(2);
  });

  it('never returns less than one minute', () => {
    expect(calculateReadingMinutes('A short note.')).toBe(1);
  });

  it('counts a Markdown link label but not its destination', () => {
    expect(calculateReadingMinutes('[two words](/a/very/long/internal/path/that/is/not/prose)', 2)).toBe(1);
  });
});
```

Create `tests/contracts/date.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { comparePostsNewestFirst, formatPublicDate } from '../../src/lib/content/date';

describe('public dates', () => {
  it('never shifts the authored calendar day across Chicago time', () => {
    expect(formatPublicDate('2026-02-24', 'long')).toBe('February 24, 2026');
    expect(formatPublicDate('2026-09-01', 'short')).toBe('Sep 01');
  });

  it('sorts equal public dates by timestamp, then canonical path', () => {
    const record = (canonicalPath: string, originalTimestamp?: string) => ({
      collection: 'blog' as const,
      id: canonicalPath,
      data: {
        title: canonicalPath,
        slug: canonicalPath,
        canonicalPath,
        summary: canonicalPath,
        draft: false,
        hasDetailPage: true,
        featured: false,
        tags: [],
        links: [],
        relationships: [],
        publishedAt: '2026-09-01',
        originalTimestamp,
      },
    });
    const posts = [
      record('/2026/09/01/zeta.html', '2026-09-01T08:00:00.000Z'),
      record('/2026/09/01/alpha.html', '2026-09-01T10:00:00.000Z'),
      record('/2026/09/01/beta.html', '2026-09-01T10:00:00.000Z'),
    ].toSorted(comparePostsNewestFirst);
    expect(posts.map((post) => post.data.canonicalPath)).toEqual([
      '/2026/09/01/alpha.html',
      '/2026/09/01/beta.html',
      '/2026/09/01/zeta.html',
    ]);
  });
});
```

Create `tests/contracts/grouping.test.ts` with minimal fixtures already sorted newest-first:

```ts
import { describe, expect, it } from 'vitest';
import { groupPostsByYear } from '../../src/lib/content/grouping';

describe('blog year grouping', () => {
  it('preserves input order within first-seen year buckets', () => {
    const post = (id: string, publishedAt: string) => ({
      collection: 'blog', id, data: { canonicalPath: `/${publishedAt.replaceAll('-', '/')}/${id}.html`, publishedAt },
    });
    const grouped = groupPostsByYear([
      post('newest', '2026-09-01'),
      post('older-same-year', '2026-02-24'),
      post('previous-year', '2023-07-19'),
    ]);
    expect([...grouped.keys()]).toEqual(['2026', '2023']);
    expect(grouped.get('2026')?.map(({ id }) => id)).toEqual(['newest', 'older-same-year']);
  });
});
```

Run: `npm test -- tests/contracts/routing.test.ts tests/contracts/reading-time.test.ts tests/contracts/date.test.ts tests/contracts/grouping.test.ts`

Expected: FAIL because the route, reading-time, date, and grouping modules are missing.

- [ ] **Step 2: Implement pure route and reading-time utilities**

Create `src/lib/content/routes.ts` with:

```ts
import type { ContentGraph, RouteContract } from '../../types/content';

export function canonicalPathToOutputPath(path: string): string {
  if (path === '/') return 'index.html';
  const relative = path.slice(1);
  return path.endsWith('/') ? `${relative}index.html` : relative;
}

export function buildRouteManifest(graph: ContentGraph): readonly RouteContract[] {
  const records = Object.values(graph).flat();
  const contentRoutes = records
    .filter((record) => !record.data.draft && record.data.hasDetailPage)
    .map((record) => ({
      canonicalPath: record.data.canonicalPath,
      outputPath: canonicalPathToOutputPath(record.data.canonicalPath),
      kind: record.collection === 'blog' ? 'post' : 'page',
      inSitemap: true,
    }) satisfies RouteContract);

  const permanentRoutes: RouteContract[] = [
    { canonicalPath: '/', outputPath: 'index.html', kind: 'page', inSitemap: true },
    { canonicalPath: '/blog/', outputPath: 'blog/index.html', kind: 'page', inSitemap: true },
    { canonicalPath: '/app-library/', outputPath: 'app-library/index.html', kind: 'page', inSitemap: true },
    { canonicalPath: '/projects/', outputPath: 'projects/index.html', kind: 'page', inSitemap: true },
    { canonicalPath: '/skill-library/', outputPath: 'skill-library/index.html', kind: 'page', inSitemap: true },
    { canonicalPath: '/skills/', outputPath: 'skills/index.html', kind: 'page', inSitemap: true },
    { canonicalPath: '/about/', outputPath: 'about/index.html', kind: 'page', inSitemap: true },
    { canonicalPath: '/listwithme/support/', outputPath: 'listwithme/support/index.html', kind: 'utility', inSitemap: true },
    { canonicalPath: '/listwithme/privacy/', outputPath: 'listwithme/privacy/index.html', kind: 'utility', inSitemap: true },
    { canonicalPath: '/feed.xml', outputPath: 'feed.xml', kind: 'utility', inSitemap: false },
    { canonicalPath: '/sitemap.xml', outputPath: 'sitemap.xml', kind: 'utility', inSitemap: false },
    { canonicalPath: '/robots.txt', outputPath: 'robots.txt', kind: 'utility', inSitemap: false },
    { canonicalPath: '/404.html', outputPath: '404.html', kind: 'utility', inSitemap: false },
  ];

  return [...permanentRoutes, ...contentRoutes]
    .toSorted((a, b) => a.canonicalPath.localeCompare(b.canonicalPath));
}
```

Create `src/lib/content/reading-time.ts` with Markdown-token traversal so code, raw HTML, image alt text, and link destinations are excluded while visible link labels remain prose:

```ts
import MarkdownIt from 'markdown-it';

const parser = new MarkdownIt({ html: true, linkify: false });
const FRONTMATTER = /^---\s*[\s\S]*?\s*---/;
const MDX_IMPORT = /^import\s+.+;?$/gm;
const URL = /(?:https?:\/\/|\/)[^\s]+/g;

export function calculateReadingMinutes(markdown: string, wordsPerMinute = 225): number {
  const source = markdown
    .replace(FRONTMATTER, '')
    .replace(MDX_IMPORT, '');
  const prose = parser.parse(source, {})
    .flatMap((token) => token.type === 'inline' ? token.children ?? [] : [])
    .filter((token) => token.type === 'text')
    .map((token) => token.content.replace(URL, ' '))
    .join(' ');
  const words = prose.trim() ? prose.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}
```

Create `src/lib/content/date.ts` and parse authored dates at noon UTC so Chicago formatting cannot cross a date boundary:

```ts
const LONG = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', month: 'long', day: 'numeric', year: 'numeric' });
const SHORT = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', month: 'short', day: '2-digit' });

export function formatPublicDate(isoDate: string, style: 'long' | 'short' = 'long'): string {
  const date = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid public date: ${isoDate}`);
  return (style === 'long' ? LONG : SHORT).format(date);
}

export function comparePostsNewestFirst<T extends { data: { canonicalPath: string; publishedAt?: string; originalTimestamp?: string } }>(a: T, b: T): number {
  const aTime = String(a.data.originalTimestamp ?? a.data.publishedAt);
  const bTime = String(b.data.originalTimestamp ?? b.data.publishedAt);
  return bTime.localeCompare(aTime) || a.data.canonicalPath.localeCompare(b.data.canonicalPath);
}
```

Create `src/lib/content/grouping.ts`:

```ts
export function groupPostsByYear<T extends { data: { publishedAt: string } }>(posts: readonly T[]): ReadonlyMap<string, readonly T[]> {
  const groups = new Map<string, T[]>();
  for (const post of posts) {
    const year = post.data.publishedAt.slice(0, 4);
    const bucket = groups.get(year) ?? [];
    bucket.push(post);
    groups.set(year, bucket);
  }
  return groups;
}
```

Run: `npm test -- tests/contracts/routing.test.ts tests/contracts/reading-time.test.ts tests/contracts/date.test.ts tests/contracts/grouping.test.ts`

Expected: PASS.

- [ ] **Step 3: Define content types and schemas**

Create `src/types/content.ts` with the stable interfaces plus:

```ts
export interface CommonRecordData {
  title: string;
  slug: string;
  canonicalPath: string;
  summary: string;
  draft: boolean;
  hasDetailPage: boolean;
  featured: boolean;
  displayOrder?: number;
  homepageSlot?: 'featured-writing' | 'featured-project-primary' | 'featured-project-secondary' | 'app-library' | 'authored-skills';
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

export interface Fact { label: string; value: string }
export type FieldNoteKey =
  | 'why-it-exists' | 'what-it-does' | 'how-it-was-built' | 'what-i-learned' | 'current-state'
  | 'workflow' | 'details-i-love' | 'friction-and-limits' | 'who-it-suits'
  | 'trigger' | 'inputs-and-outputs' | 'example' | 'guardrails' | 'source' | 'what-i-adapted'
  | 'when-to-use' | 'how-it-works' | 'use-or-installation' | 'design-decisions';
export interface FieldNote { key: FieldNoteKey; heading: string; body: string[] }

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

export interface ContentIssue { code: string; record: string; message: string }
export interface HomepageContent {
  featuredWriting: BlogRecord;
  featuredProjectPrimary: ProjectRecord;
  featuredProjectSecondary: ProjectRecord;
  appLibrary: readonly AppLibraryRecord[];
  skillLibrary: readonly SkillLibraryRecord[];
  authoredSkills: readonly SkillRecord[];
  latestPosts: readonly BlogRecord[];
}
```

`CommonRecordData`, `Media`, `ProjectScreenshot`, `ActionLink`, `Fact`, and `FieldNote` remain exported shared shapes; the collection-specific `*Data` aliases are inferred from the schemas below rather than recreated by hand. This type-only import does not create a runtime cycle because `schema.ts` does not import `src/types/content.ts`.

Create `tests/contracts/content-types.test.ts` with `expectTypeOf` checks for `projects.data.platform`, `ProjectData['screenshots'][number]` matching `ProjectScreenshot`, `skill-library.data.sourceAuthor`, `skills.data.supportedTools`, each concrete homepage slot, narrowing `AnySiteRecord` on `collection`, and a `@ts-expect-error` proving a project record cannot expose `sourceAuthor`.

Create `src/lib/content/schema.ts`. Use `z` from `astro/zod`; export `blogSchema`, `appLibrarySchema`, `projectSchema`, `skillLibrarySchema`, and `skillSchema`. The shared definitions are:

```ts
import { z } from 'astro/zod';

const internalPath = /^\/(?:$|[^?#]*(?:\/|\.html))$/;
const nonBlank = z.string().refine((value) => value.trim().length > 0, 'Value cannot be blank.');
export const isoDateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  }, 'Date must be a real calendar day.');

export const mediaSchema = z.strictObject({
  src: nonBlank,
  alt: z.string(),
  decorative: z.boolean(),
  focalPoint: nonBlank.optional(),
}).superRefine((media, context) => {
  if (media.decorative && media.alt !== '') {
    context.addIssue({ code: 'custom', message: 'Decorative media must have empty alt text.' });
  }
  if (!media.decorative && media.alt.trim() === '') {
    context.addIssue({ code: 'custom', message: 'Informative media requires alt text.' });
  }
});

export const projectScreenshotSchema = z.strictObject({
  src: z.string().regex(/^projects\/[a-z0-9-]+\/screenshots\/[a-z0-9-]+\.(?:png|jpe?g|webp|avif)$/),
  alt: nonBlank,
  decorative: z.literal(false),
  device: z.enum(['iPhone', 'iPad']),
  label: nonBlank,
  order: z.number().int().positive(),
});

export const linkSchema = z.strictObject({
  label: nonBlank,
  href: z.string().refine(
    (href) => href === href.trim() && href !== '#' && (
      (href.startsWith('/') && !href.startsWith('//')) ||
      /^https:\/\/\S+$/.test(href) ||
      /^mailto:[^@\s]+@[^@\s]+$/.test(href)
    ),
    'Action href must be a real internal, HTTPS, or email destination.',
  ),
  kind: z.enum(['primary', 'secondary', 'source', 'support', 'privacy', 'install']),
});

export const relationshipSchema = z.strictObject({
  collection: z.enum(['blog', 'app-library', 'projects', 'skill-library', 'skills']),
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
  homepageSlot: z.enum(['featured-writing', 'featured-project-primary', 'featured-project-secondary', 'app-library', 'authored-skills']).optional(),
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
```

Complete the schemas with these exact collection additions:

```ts
const facts = z.array(z.strictObject({ label: nonBlank, value: nonBlank })).default([]);
const substantive = z.string().min(40).refine((value) => value.trim().length >= 40, 'Field-note paragraphs must contain 40 non-whitespace characters.');
const fieldNotes = <T extends readonly [string, ...string[]]>(keys: T) => z.array(z.strictObject({
  key: z.enum(keys),
  heading: nonBlank,
  body: z.array(substantive).min(1),
})).default([]);

export const blogSchema = z.strictObject({
  ...commonFields,
  publishedAt: isoDateSchema,
  kind: nonBlank.default('Post'),
  comments: z.boolean().default(true),
  canonicalOverride: z.string().url().refine((url) => url.startsWith('https://'), 'Canonical override must use HTTPS.').optional(),
  socialImage: nonBlank.optional(),
  relatedProject: nonBlank.optional(),
  preservedHeadingIds: z.array(nonBlank).default([]),
  numberHeadings: z.boolean().default(false),
  originalTimestamp: z.string().datetime({ offset: true }).optional(),
});

const actionState = nonBlank.optional();
const stringList = z.array(nonBlank).default([]);
const projectScreenshots = z.array(projectScreenshotSchema).max(8).superRefine((screenshots, context) => {
  if (new Set(screenshots.map(({ order }) => order)).size !== screenshots.length) {
    context.addIssue({ code: 'custom', message: 'Screenshot order values must be unique.' });
  }
}).default([]);
const projectNotes = fieldNotes(['why-it-exists', 'what-it-does', 'how-it-was-built', 'what-i-learned', 'current-state']);
const appNotes = fieldNotes(['workflow', 'details-i-love', 'friction-and-limits', 'who-it-suits']);
const librarySkillNotes = fieldNotes(['trigger', 'inputs-and-outputs', 'example', 'guardrails', 'source', 'what-i-adapted']);
const authoredSkillNotes = fieldNotes(['when-to-use', 'how-it-works', 'example', 'use-or-installation', 'design-decisions']);

export const appLibrarySchema = z.strictObject({ ...commonFields, ownership: z.literal('used'), category: nonBlank, reasonItStays: nonBlank, cadence: nonBlank.optional(), status: nonBlank.optional(), facts, fieldNotes: appNotes, actionState });
export const projectSchema = z.strictObject({ ...commonFields, ownership: z.literal('made'), status: nonBlank, platform: nonBlank, compatibility: nonBlank.optional(), license: nonBlank.optional(), screenshots: projectScreenshots, facts, fieldNotes: projectNotes, actionState });
export const skillLibrarySchema = z.strictObject({ ...commonFields, ownership: z.literal('used'), status: nonBlank.optional(), category: nonBlank, cadence: nonBlank.optional(), trigger: nonBlank, inputs: stringList, outputs: stringList, guardrails: stringList, source: nonBlank, sourceAuthor: nonBlank, license: nonBlank.optional(), facts, fieldNotes: librarySkillNotes, actionState });
export const skillSchema = z.strictObject({ ...commonFields, ownership: z.literal('made'), status: nonBlank, supportedTools: z.array(nonBlank).min(1), visibility: z.enum(['private', 'public']).default('private'), trigger: nonBlank.optional(), inputs: stringList, outputs: stringList, license: nonBlank.optional(), facts, fieldNotes: authoredSkillNotes, actionState });

export type BlogData = z.infer<typeof blogSchema>;
export type AppLibraryData = z.infer<typeof appLibrarySchema>;
export type ProjectData = z.infer<typeof projectSchema>;
export type SkillLibraryData = z.infer<typeof skillLibrarySchema>;
export type SkillData = z.infer<typeof skillSchema>;
```

- [ ] **Step 4: Register the five Astro collections**

Create `src/lib/content/id.ts` so the source parser and Astro loader share one fail-fast ID rule:

```ts
export function contentIdFromData(data: Record<string, unknown>): string {
  if (typeof data.slug !== 'string' || data.slug.trim() === '') {
    throw new Error('Content entry requires a nonblank frontmatter slug before ID generation.');
  }
  return data.slug;
}
```

Create `src/content.config.ts` with an explicit `generateId` on every loader; do not rely on version-specific default filename/slug behavior:

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { contentIdFromData } from './lib/content/id';
import { appLibrarySchema, blogSchema, projectSchema, skillLibrarySchema, skillSchema } from './lib/content/schema';

const idFromSlug = ({ data }: { data: Record<string, unknown> }) => contentIdFromData(data);
const blog = defineCollection({ loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}', generateId: idFromSlug }), schema: blogSchema });
const appLibrary = defineCollection({ loader: glob({ base: './src/content/app-library', pattern: '**/*.{md,mdx}', generateId: idFromSlug }), schema: appLibrarySchema });
const projects = defineCollection({ loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}', generateId: idFromSlug }), schema: projectSchema });
const skillLibrary = defineCollection({ loader: glob({ base: './src/content/skill-library', pattern: '**/*.{md,mdx}', generateId: idFromSlug }), schema: skillLibrarySchema });
const skills = defineCollection({ loader: glob({ base: './src/content/skills', pattern: '**/*.{md,mdx}', generateId: idFromSlug }), schema: skillSchema });

export const collections = { blog, 'app-library': appLibrary, projects, 'skill-library': skillLibrary, skills };
```

Create all five content directories and add `.gitkeep` files so `astro check` can load an empty schema during this task. Extend `content-types.test.ts` to prove `contentIdFromData({ slug: 'listwithme' }) === 'listwithme'` and that a missing or blank slug throws; Task 6 uses this same helper when parsing source files.

- [ ] **Step 5: Write failing graph validation tests**

Create `tests/contracts/content-schema.test.ts` with constructed `ContentGraph` fixtures that assert each exact failure:

```ts
expect(codes(graphWithDuplicatePath)).toContain('duplicate-canonical-path');
expect(codes(graphWithBadAccent)).toContain('title-accent-not-found');
expect(codes(graphWithMissingRelationship)).toContain('missing-relationship-target');
expect(codes(graphWithUnavailableRelationship)).toContain('unpublished-relationship-target');
expect(codes(graphWithMissingRelatedProject)).toContain('missing-related-project');
expect(codes(graphWithProjectSlotOnAppRecord)).toContain('invalid-homepage-slot-collection');
expect(codes(graphWithDuplicateSingletonSlot)).toContain('duplicate-homepage-slot');
expect(codes(graphWithMissingSingletonSlot)).toContain('missing-homepage-slot');
expect(codes(graphWithMissingMultiOrder)).toContain('missing-homepage-order');
expect(codes(graphWithDuplicateOrder)).toContain('duplicate-homepage-order');
expect(codes(graphWithThinDossier)).toContain('thin-detail-page');
expect(codes(graphWithPrivateInstallLink)).toContain('private-skill-action');
expect(codes(graphWithPlaceholderAction)).toContain('placeholder-action');
expect(codes(graphWithTwoPrimaryActions)).toContain('too-many-primary-actions');
expect(codes(graphWithThreeQuietActions)).toContain('too-many-secondary-actions');
expect(codes(graphWithFourDetailRelationships)).toContain('too-many-detail-relationships');
expect(codes(graphWithOneFieldNote)).toContain('thin-detail-page');
expect(codes(graphWithDuplicateFieldNoteKey)).toContain('duplicate-field-note-key');
expect(codes(graphWithValidSparseDetail)).not.toContain('thin-detail-page');
expect(() => mediaSchema.parse({ src: 'image.png', alt: '', decorative: false })).toThrow(/requires alt text/);
expect(() => mediaSchema.parse({ src: 'image.png', alt: 'Diagram', decorative: false, typo: true })).toThrow(/unrecognized/i);
expect(projectSchema.parse(validProject).screenshots).toEqual([]);
expect(() => projectScreenshotSchema.parse({ src: 'projects/listwithme/screenshots/01-new-list.png', alt: '', decorative: false, device: 'iPhone', label: 'New list', order: 1 })).toThrow(/blank/);
expect(() => projectSchema.parse({ ...validProject, screenshots: [validScreenshot, { ...validScreenshot, src: 'projects/listwithme/screenshots/02-your-lists.png' }] })).toThrow(/unique/);
expect(() => linkSchema.parse({ label: 'Unsafe', href: 'javascript:alert(1)', kind: 'primary' })).toThrow(/real internal/);
expect(() => linkSchema.parse({ label: 'Protocol relative', href: '//example.com', kind: 'primary' })).toThrow(/real internal/);
expect(() => blogSchema.parse({ ...validBlog, title: '   ' })).toThrow(/blank/);
expect(() => blogSchema.parse({ ...validBlog, titleAccent: '   ' })).toThrow(/blank/);
expect(() => blogSchema.parse({ ...validBlog, publishedAt: '2026-02-30' })).toThrow(/real calendar/);
```

Create one single-section rejection, one duplicate-key rejection, and one valid two-section sparse fixture for each of `app-library`, `projects`, `skill-library`, and `skills`; the compact assertions above may loop over those four cases. Each schema's `z.enum` also rejects a key belonging to another variant. `validBlog` contains the complete registered blog shape, so each schema assertion fails for only the field under test.

Use this helper at the top of the test:

```ts
const codes = (graph: ContentGraph) => validateContentGraph(graph).map((issue) => issue.code);
```

Run: `npm test -- tests/contracts/content-schema.test.ts`

Expected: FAIL because graph validation is missing.

- [ ] **Step 6: Implement graph, homepage, and relationship validation**

Implement `src/lib/content/graph.ts` as a pure module with no `astro:content` import. `validateContentGraph` performs every named assertion above plus unique slug-per-collection. Require exactly one record in each singleton homepage slot, require `homepageOrder` on every `app-library` and `authored-skills` slot record, reject duplicated order within a slot, and enforce this slot map:

```ts
const SLOT_COLLECTION = {
  'featured-writing': 'blog',
  'featured-project-primary': 'projects',
  'featured-project-secondary': 'projects',
  'app-library': 'app-library',
  'authored-skills': 'skills',
} as const;
```

Require relationship targets and `relatedProject` targets to be present, published, and generated (`draft: false`, `hasDetailPage: true`). For a non-blog generated detail, require at most three relationships, at most one primary-class action (`primary` or `install`), and at most two quiet actions (`secondary` or `source`); Support and Privacy do not count because they render as utility navigation. `thin-detail-page` means fewer than two facts, fewer than two field notes, or neither a real primary-class action nor an explicit `actionState` string. `private-skill-action` rejects every nonempty `links` array while `visibility` is `private`, not only `install` links.

For every generated non-blog launch record, reject duplicate `fieldNotes[].key` and keys outside its collection's approved variant set: Projects allow `why-it-exists`, `what-it-does`, `how-it-was-built`, `what-i-learned`, `current-state`; App Library allows `workflow`, `details-i-love`, `friction-and-limits`, `who-it-suits`; Skill Library allows `trigger`, `inputs-and-outputs`, `example`, `guardrails`, `source`, `what-i-adapted`; My Skills allow `when-to-use`, `how-it-works`, `example`, `use-or-installation`, `design-decisions`. A valid generated dossier needs at least two substantive field notes, but it does not need every allowed section; records with `hasDetailPage: false` are exempt. `assertValidContentGraph` throws one error containing every path-specific issue.

Implement `src/lib/content/homepage.ts` with exact slot rules:

```ts
export function selectHomepageContent(graph: ContentGraph): HomepageContent {
  const published = Object.values(graph).flat().filter((record) => !record.data.draft);
  const one = (slot: string) => published.filter((record) => record.data.homepageSlot === slot);
  const singleton = (slot: string) => {
    const matches = one(slot);
    if (matches.length !== 1) throw new Error(`${slot} requires exactly one record; received ${matches.length}`);
    return matches[0];
  };
  const ordered = (slot: string) => one(slot).toSorted((a, b) => Number(a.data.homepageOrder) - Number(b.data.homepageOrder));
  const featuredWriting = singleton('featured-writing');
  const latestPosts = graph.blog
    .filter((record) => !record.data.draft && record.id !== featuredWriting.id)
    .toSorted((a, b) => String(b.data.publishedAt).localeCompare(String(a.data.publishedAt)))
    .slice(0, 3);
  return {
    featuredWriting,
    featuredProjectPrimary: singleton('featured-project-primary'),
    featuredProjectSecondary: singleton('featured-project-secondary'),
    appLibrary: ordered('app-library'),
    skillLibrary: graph['skill-library']
      .filter((record) => !record.data.draft)
      .toSorted((a, b) => Number(a.data.displayOrder) - Number(b.data.displayOrder) || a.id.localeCompare(b.id)),
    authoredSkills: ordered('authored-skills'),
    latestPosts,
  };
}
```

Type the singleton and ordered slot helpers against `SLOT_COLLECTION`; do not return or cast all slots as one unrefined record union. Implement `src/lib/content/relationships.ts` as `resolveRelationships(source, graph)`, resolving `source.data.relationships` by `collection + id` and throwing the same path-specific unavailable-target message used by graph validation.

Implement `loadContentGraph()` in `src/lib/content/load.ts`, the only application module in this layer that imports `getCollection` from `astro:content`. Map the result of each collection separately into its concrete `SiteRecord<C>` array without flattening and recasting a union. This keeps Vitest's pure graph/schema imports independent from Astro's virtual module while Astro pages import the loader boundary.

Run:

```bash
npm test -- tests/contracts/content-types.test.ts tests/contracts/content-schema.test.ts tests/contracts/routing.test.ts tests/contracts/reading-time.test.ts tests/contracts/date.test.ts tests/contracts/grouping.test.ts
npm run check
```

Expected: PASS.

- [ ] **Step 7: Commit content contracts**

```bash
git add src/content.config.ts src/types src/lib/content src/content tests/contracts/content-types.test.ts tests/contracts/content-schema.test.ts tests/contracts/routing.test.ts tests/contracts/reading-time.test.ts tests/contracts/date.test.ts tests/contracts/grouping.test.ts
git commit -m "feat: define strict content and route contracts"
```

---

### Task 5: Deterministically Migrate All 23 Jekyll Posts

**Files:**
- Create: `scripts/migrate-jekyll-posts.ts`
- Create: `scripts/lib/legacy-markdown.ts`
- Create: `scripts/lib/legacy-html.ts`
- Create: `scripts/data/blog-enrichments.ts`
- Create: `scripts/data/image-enrichments.ts`
- Create: `src/lib/markdown/preserved-heading-ids.ts`
- Create: `src/lib/media.ts`
- Create: `src/assets/legacy/*` as exact-byte copies of the 16 article images named in the enrichment table
- Create: `src/components/editorial/EmbedFrame.astro`
- Create: `src/components/editorial/Figure.astro`
- Create: `tests/fixtures/migration/**`
- Create: `tests/contracts/blog-migration.test.ts`
- Create: `tests/contracts/legacy-html.test.ts`
- Create: `tests/contracts/preserved-heading-ids.test.ts`
- Create: `src/content/blog/*.{md,mdx}` for all 23 posts
- Modify: `package.json`

**Interfaces:**
- Consumes: `_posts/*.md`, `tests/fixtures/legacy-pages.json`, the five structured migration transforms, and schemas from Task 4.
- Produces: `migratePost(source: string, fileName: string, baseline: LegacyPageSnapshot): MigratedPost`, token-aware `validateLegacyHtml(markdown: string): void`, `resolveLocalImage(assetKey: string): ImageMetadata`, buildable semantic `<EmbedFrame src title>` and responsive `<Figure src assetKey ...>` boundaries, and an idempotent set of 23 Astro content entries while leaving `_posts/` untouched.

- [ ] **Step 1: Add representative failing migration fixtures**

Create focused input/expected pairs under `tests/fixtures/migration/` for:

```text
no-headings.md             reading-list behavior
spotify.md                 2019-playlists iframe conversion
portrait-images.md         mustread-books-for image behavior
notion-images.md           four /uploads/2023 corrections
listwithme-action.md       exact placeholder App Store replacement
fenced-and-indented.md     expo-app-config and vampire code
body-h1.md                 one-semantic-H1 normalization
kramdown-button.md         {: .button} conversion
unsafe-script.md           rejected script and event-handler attributes
```

Create `tests/contracts/blog-migration.test.ts`:

```ts
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { migratePost } from '../../scripts/lib/legacy-markdown';

describe('Jekyll post migration', () => {
  it('uses the filename date and keeps the underscore slug', () => {
    const result = migratePost('---\ntitle: Apps\nexcerpt: Hello\n---\nBody', '2020-05-23-mac_apps.md', { headings: [] });
    expect(result.data.publishedAt).toBe('2020-05-23');
    expect(result.data.slug).toBe('mac_apps');
    expect(result.data.canonicalPath).toBe('/2020/05/23/mac_apps.html');
    expect(typeof result.data.publishedAt).toBe('string');
  });

  it('normalizes scalar tags and defaults kind without inferring from tags', () => {
    const result = migratePost('---\ntitle: Example\nexcerpt: Summary\ntags: ios swift\n---\nBody', '2026-01-02-example.md', { headings: [] });
    expect(result.data.tags).toEqual(['ios', 'swift']);
    expect(result.data.kind).toBe('Post');
  });

  it('converts Spotify markup into an MDX EmbedFrame', async () => {
    const input = await readFile(new URL('../fixtures/migration/spotify.md', import.meta.url), 'utf8');
    const result = migratePost(input, '2020-02-10-2019-playlists.md', { headings: [] });
    expect(result.extension).toBe('.mdx');
    expect(result.body).toContain("import EmbedFrame from '../../components/editorial/EmbedFrame.astro';");
    expect(result.body).toContain('title="Spotify playlist: 2019 Playlists"');
    expect(result.body).not.toContain('<iframe');
  });

  it('converts an empty-alt legacy book cover into an accessible Figure', async () => {
    const input = await readFile(new URL('../fixtures/migration/portrait-images.md', import.meta.url), 'utf8');
    const result = migratePost(input, '2023-01-02-mustread-books-for.md', { headings: [] });
    expect(result.extension).toBe('.mdx');
    expect(result.body).toContain("import Figure from '../../components/editorial/Figure.astro';");
    expect(result.body).toContain('src="/images/ec18f32904.jpg"');
    expect(result.body).toContain('assetKey="legacy/ec18f32904.jpg"');
    expect(result.body).toContain('alt="Cover of Build by Tony Fadell"');
    expect(result.body).toContain('variant="portrait"');
    expect(result.body).not.toContain('alt=""');
  });

  it('replaces the one approved ListWithMe placeholder and no other hash link', async () => {
    const input = await readFile(new URL('../fixtures/migration/listwithme-action.md', import.meta.url), 'utf8');
    const result = migratePost(input, '2026-02-24-listwithme-returns.md', { headings: [] });
    expect(result.body).toContain('[App Store](https://apps.apple.com/us/app/listwithme/id1224284271)');
    expect(result.body).not.toContain('](#)');
  });

  it('requires exactly one scoped ListWithMe placeholder occurrence', () => {
    const listWithMeWithoutPlaceholder = '---\ntitle: ListWithMe Returns\nexcerpt: Update\n---\nNo App Store action here.';
    const listWithMeWithTwoPlaceholders = '---\ntitle: ListWithMe Returns\nexcerpt: Update\n---\n[App Store](#) and [App Store](#)';
    expect(() => migratePost(listWithMeWithoutPlaceholder, '2026-02-24-listwithme-returns.md', { headings: [] })).toThrow(/expected 1 App Store placeholder; received 0/);
    expect(() => migratePost(listWithMeWithTwoPlaceholders, '2026-02-24-listwithme-returns.md', { headings: [] })).toThrow(/expected 1 App Store placeholder; received 2/);
  });
});
```

Run: `npm test -- tests/contracts/blog-migration.test.ts`

Expected: FAIL because the migration module is missing.

- [ ] **Step 2: Implement the deterministic Markdown conversion**

Create `scripts/lib/legacy-markdown.ts`. Its `migratePost` must execute this exact ordered pipeline:

```ts
export const NOTION_IMAGE_MAP = new Map([
  ['/uploads/2023/f159196842.png', '/images/f159196842.png'],
  ['/uploads/2023/fa6c5dfe53.png', '/images/fa6c5dfe53.png'],
  ['/uploads/2023/5fd90bfbf1.png', '/images/5fd90bfbf1.png'],
  ['/uploads/2023/6647450a28.png', '/images/6647450a28.png'],
]);

// 1. Parse frontmatter with gray-matter.
// 2. Parse YYYY-MM-DD and the untouched remainder slug from the filename.
// 3. Normalize excerpt whitespace; otherwise select the first plain-text paragraph.
// 4. Normalize scalar tags by whitespace and preserve array tags as authored.
// 5. Default kind to "Post" and preserve only an explicit kind override.
// 6. On only /2026/02/24/listwithme-returns.html, replace exactly one `[App Store](#)` with the approved App Store URL; fail on zero or multiple matches.
// 7. Replace both each root-relative NOTION_IMAGE_MAP key and `https://grantisom.com${key}` with the mapped root-relative `/images/...` value.
// 8. Convert [label](href){: .button} to <a href="href" class="button">label</a>.
// 9. Replace each Markdown image with a typed <Figure ... /> using IMAGE_ENRICHMENTS; fail on an unmapped empty alt.
// 10. Demote body H1 to H2 and apply the baseline's explicit heading IDs in document order.
// 11. Convert each open.spotify.com iframe to <EmbedFrame ... /> and prepend one import.
// 12. Merge only the allowlisted fields from BLOG_ENRICHMENTS by canonical path.
// 13. Preserve comments exactly and return .mdx only when an Astro component is present.
```

The returned frontmatter must contain every common field with explicit defaults, plus:

```ts
{
  title,
  slug,
  canonicalPath: `/${year}/${month}/${day}/${slug}.html`,
  summary,
  draft: false,
  hasDetailPage: true,
  featured: canonicalPath === '/2026/02/24/listwithme-returns.html',
  homepageSlot: canonicalPath === '/2026/02/24/listwithme-returns.html' ? 'featured-writing' : undefined,
  tags,
  links: [],
  relationships: [],
  publishedAt: `${year}-${month}-${day}`,
  kind: frontmatter.kind ?? 'Post',
  comments: frontmatter.comments ?? true,
  preservedHeadingIds: baseline.headings.map((heading) => heading.id),
  numberHeadings: false,
  originalTimestamp: frontmatter.date ? new Date(frontmatter.date).toISOString() : undefined,
}
```

Do not copy obsolete `layout` or hand-maintained `description` reading-time values.

Create `scripts/data/blog-enrichments.ts` with `export const BLOG_ENRICHMENTS = {} as const;`. The migration script may merge only `kind`, `titleAccent`, `featuredArt`, `relatedProject`, `relationships`, `numberHeadings`, and `socialImage` from this map. Task 9 adds reviewed article relationships here and reruns migration, so generated content remains deterministic.

Create `scripts/data/image-enrichments.ts` as an explicit path map with `{ assetKey, alt, width, height, variant }`, where `/images/example.png` maps to `assetKey: 'legacy/example.png'`. Preserve the two already-authored Safari alt values and use these reviewed values for every empty-alt legacy image:

| Path | Alt text | Size | Variant |
|---|---|---:|---|
| `/images/ec18f32904.jpg` | `Cover of Build by Tony Fadell` | 250×382 | portrait |
| `/images/475c3984d0.jpg` | `Cover of The Phoenix Project` | 250×375 | portrait |
| `/images/7337cde14c.jpg` | `Cover of The Hard Thing About Hard Things` | 250×378 | portrait |
| `/images/a97bedecb3.jpg` | `Cover of Structure and Interpretation of Computer Programs` | 250×376 | portrait |
| `/images/5f538d59de.jpg` | `Cover of A Philosophy of Software Design` | 250×316 | portrait |
| `/images/45d7f5784d.jpg` | `Cover of The Pragmatic Programmer` | 250×325 | portrait |
| `/images/e1d2ad7014.jpg` | `Cover of An Elegant Puzzle` | 250×369 | portrait |
| `/images/a37debf5ab.jpg` | `Cover of Software Engineering at Google` | 250×328 | portrait |
| `/images/96ce2ec5a6.jpg` | `Cover of Inspired by Marty Cagan` | 250×378 | portrait |
| `/images/f159196842.png` | `Notion Work Log calendar showing weekly entries in January 2023` | 1594×878 | wide |
| `/images/fa6c5dfe53.png` | `Notion weekly work log page with dated daily engineering notes` | 1671×1287 | wide |
| `/images/5fd90bfbf1.png` | `Notion illustration of a person clipping a page with scissors` | 750×628 | wide |
| `/images/6647450a28.png` | `Notion AI introduction graphic showing writing-assistant actions` | 1378×754 | wide |
| `/images/logo.png` | `Illuminate company logo` | 350×43 | full |
| `/images/safari_settings.png` | `Safari Settings` | 2400×1600 | wide |
| `/images/develop_menu.png` | `Develop Menu` | 2382×376 | wide |

Copy those 16 exact source files from `images/` into `src/assets/legacy/`; do not move or optimize the compatibility copies in `public/images/`. For every path above, assert the imported source dimensions match the table before serializing the component. Do not add a caption that would alter article prose. Prepend the `Figure` import only to posts that contain images.

Create `src/lib/media.ts` with an eager `import.meta.glob<{ default: ImageMetadata }>('/src/assets/**/*.{png,jpg,jpeg,webp,avif}', { eager: true })`. `resolveLocalImage('legacy/f159196842.png')` returns the matching `ImageMetadata` and throws a path-specific error when absent.

Store each preserved heading as Markdown ending in ` {#deployed-id}`. Create `src/lib/markdown/preserved-heading-ids.ts`, a Remark plugin that recursively visits heading nodes, removes the final ` {#...}` marker from the last text child, and assigns the captured value to `node.data.hProperties.id`. Register it in `astro.config.mjs`:

```js
import preservedHeadingIds from './src/lib/markdown/preserved-heading-ids.ts';

export default defineConfig({
  site: 'https://grantisom.com',
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'preserve' },
  markdown: { remarkPlugins: [preservedHeadingIds] },
  integrations: [mdx()],
});
```

Create `tests/contracts/preserved-heading-ids.test.ts` so the Markdown transform is independently executable:

```ts
import { describe, expect, it } from 'vitest';
import preservedHeadingIds from '../../src/lib/markdown/preserved-heading-ids';

describe('preserved heading IDs', () => {
  it('moves the explicit suffix into heading properties and visible text', () => {
    const tree = {
      type: 'root',
      children: [{ type: 'heading', depth: 2, children: [{ type: 'text', value: 'Heading {#deployed-id}' }] }],
    };
    preservedHeadingIds()(tree as never);
    const heading = tree.children[0] as typeof tree.children[0] & { data?: { hProperties?: { id?: string } } };
    expect(heading.children[0].value).toBe('Heading');
    expect(heading.data?.hProperties?.id).toBe('deployed-id');
  });
});
```

Create the semantic component imported by migrated Spotify MDX now, rather than leaving those records with a broken import until Task 9:

```astro
---
interface Props { src: string; title: string }
const { src, title } = Astro.props;
if (!src.startsWith('https://open.spotify.com/')) throw new Error(`Unsupported embed source: ${src}`);
---

<figure class="embed-frame" data-migrated-embed>
  <iframe src={src} title={title} loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe>
  <figcaption data-embed-fallback><a href={src}>Open {title}</a></figcaption>
</figure>
```

Create the corresponding buildable `src/components/editorial/Figure.astro` boundary now. Generate AVIF and WebP variants with `getImage({ src: resolveLocalImage(assetKey), widths, sizes, format })`, using only widths no larger than the source. Keep the original compatibility path as the `<img>` fallback so the semantic migration oracle and public URL remain stable:

```astro
---
import { getImage } from 'astro:assets';
import { resolveLocalImage } from '../../lib/media';

interface Props {
  src: string;
  assetKey: string;
  alt: string;
  width: number;
  height: number;
  variant?: 'full' | 'wide' | 'portrait' | 'gallery';
  caption?: string;
}
const { src, assetKey, alt, width, height, variant = 'full', caption } = Astro.props;
const image = resolveLocalImage(assetKey);
const widths = [320, 640, 920, width].filter((value, index, values) => value <= width && values.indexOf(value) === index);
const sizes = '(max-width: 820px) calc(100vw - 32px), (max-width: 1219px) min(720px, calc(100vw - 258px)), min(920px, calc(100vw - 314px))';
const avif = await getImage({ src: image, widths, sizes, format: 'avif' });
const webp = await getImage({ src: image, widths, sizes, format: 'webp' });
---

<figure class:list={['article-figure', `article-figure--${variant}`]}>
  <picture>
    <source type="image/avif" srcset={avif.srcSet.attribute} sizes={sizes} />
    <source type="image/webp" srcset={webp.srcSet.attribute} sizes={sizes} />
    <img src={src} alt={alt} width={width} height={height} loading="lazy" decoding="async" />
  </picture>
  {caption && <figcaption>{caption}</figcaption>}
</figure>
```

Task 9 adds the final layout styling and built-output tests to both editorial components, but the migrated collection remains buildable and already uses Astro-generated `/_astro/` derivatives from this task onward.

- [ ] **Step 3: Enforce the raw-HTML allowlist**

Create `tests/contracts/legacy-html.test.ts` to assert:

```ts
expect(() => validateLegacyHtml('<span class="note">Safe</span>')).not.toThrow();
expect(() => validateLegacyHtml('<iframe src="https://open.spotify.com/embed/playlist/abc" title="Playlist"></iframe>')).not.toThrow();
expect(() => validateLegacyHtml('<script>alert(1)</script>')).toThrow(/script/);
expect(() => validateLegacyHtml('<img src="x" onerror="alert(1)">')).toThrow(/onerror/);
expect(() => validateLegacyHtml('<a href="javascript:alert(1)">x</a>')).toThrow(/javascript/);
expect(() => validateLegacyHtml('<iframe src="https://example.com/embed"></iframe>')).toThrow(/Spotify/);
expect(() => validateLegacyHtml('<Figure src="/images/logo.png" assetKey="legacy/logo.png" alt="Logo" width={350} height={43} />')).not.toThrow();
expect(() => validateLegacyHtml('```html\n<your_bundle_id>\n```')).not.toThrow();
```

Implement `scripts/lib/legacy-html.ts` with `markdown-it` tokenization followed by `parse5.parseFragment()` on only `html_block` and `html_inline` tokens. This intentionally ignores angle-bracket examples inside fenced and indented code, including `<your_bundle_id>`, while still validating every authored raw-HTML fragment. Skip a token only when the entire HTML token is one generated, capitalized, self-closing `EmbedFrame` or `Figure` MDX node with the expected attribute names; do not extract lowercase tags with a body-wide regular expression. Use these exact sets for all other HTML:

```ts
const ALLOWED_ATTRIBUTES = new Map([
  ['iframe', new Set(['src', 'title', 'loading', 'allow', 'allowfullscreen', 'width', 'height', 'frameborder'])],
  ['div', new Set(['class'])],
  ['span', new Set(['class'])],
  ['a', new Set(['href', 'title', 'class', 'target', 'rel'])],
  ['img', new Set(['src', 'alt', 'title', 'class', 'width', 'height', 'loading'])],
  ['br', new Set()],
]);
```

Reject all element names outside that map, all `on*` attributes, all `javascript:` URLs, and every iframe source not beginning `https://open.spotify.com/`.

Run: `npm test -- tests/contracts/legacy-html.test.ts`

Expected: PASS.

- [ ] **Step 4: Write and run the idempotent migration command**

Create `scripts/migrate-jekyll-posts.ts`. It must:

1. Read `_posts/*.md` in sorted filename order.
2. Load the matching baseline by canonical URL.
3. Run the token-aware validator over the complete converted body. It validates authored HTML, ignores fenced/indented code, and exempts only the exact generated `EmbedFrame` and `Figure` nodes described above.
4. Serialize frontmatter with stable key order and Unix newlines. Emit `publishedAt`, `updatedAt`, `reviewedAt`, and `originalTimestamp` as quoted YAML strings so neither Astro nor `gray-matter` can coerce them to JavaScript `Date` objects; add a round-trip assertion that reparsing each generated file leaves every present field in that set as a string.
5. Write exactly one `.md` or `.mdx` entry per input.
6. In `--check` mode, compare generated bytes with committed targets and exit nonzero on drift without writing.
7. Fail when input count, output count, or baseline count is not 23.

Add to `package.json`:

```json
"migrate:posts": "tsx scripts/migrate-jekyll-posts.ts",
"migrate:posts:check": "tsx scripts/migrate-jekyll-posts.ts --check"
```

Run:

```bash
npm run migrate:posts
npm run migrate:posts:check
find src/content/blog -type f \( -name '*.md' -o -name '*.mdx' \) | wc -l
git status --short _posts
```

Expected: idempotency check passes, count is `23`, and `_posts/` has no modifications.

- [ ] **Step 5: Add parity assertions for all migrated records**

Extend `tests/contracts/blog-migration.test.ts` to loop through all source and output files and assert:

```ts
expect(outputs).toHaveLength(23);
expect(canonicalPaths).toContain('/2020/05/23/mac_apps.html');
expect(new Set(canonicalPaths).size).toBe(23);
expect(migrated.data.title).toBe(source.data.title);
expect(migrated.data.publishedAt).toBe(sourceFileName.slice(0, 10));
expect(migrated.data.summary).toBe(normalizeSummary(source.data.excerpt ?? firstPlainTextParagraph(source.content)));
expect(migrated.data.comments).toBe(source.data.comments ?? true);
expect(migrated.data.preservedHeadingIds).toEqual(baseline.headings.map((heading) => heading.id));
expect(migrated.body).not.toMatch(/!\[\]\(/);
expect(migrated.body).not.toContain('alt=""');
expect(migratedFor('/2026/02/24/listwithme-returns.html').body).toContain('https://apps.apple.com/us/app/listwithme/id1224284271');
expect(migratedFor('/2026/02/24/listwithme-returns.html').body).not.toContain('](#)');
expect(allFigureAssetKeys.every((assetKey) => importedLegacyAssets.has(assetKey))).toBe(true);
```

Run:

```bash
npm test -- tests/contracts/blog-migration.test.ts tests/contracts/legacy-html.test.ts tests/contracts/preserved-heading-ids.test.ts
npm run check
```

Expected: PASS with 23 schema-valid entries.

- [ ] **Step 6: Commit the blog migration**

```bash
git add package.json package-lock.json astro.config.mjs scripts/migrate-jekyll-posts.ts scripts/lib scripts/data/blog-enrichments.ts scripts/data/image-enrichments.ts src/lib/markdown src/lib/media.ts src/assets/legacy src/components/editorial/EmbedFrame.astro src/components/editorial/Figure.astro tests/fixtures/migration tests/contracts/blog-migration.test.ts tests/contracts/legacy-html.test.ts tests/contracts/preserved-heading-ids.test.ts src/content/blog
git commit -m "feat: migrate all legacy posts to Astro content"
```

---

### Task 6: Add the 16 Approved Launch Records and Site Data

**Files:**
- Create: `src/content/app-library/{obsidian,codex,hermes-agent,superhuman}.md`
- Create: `src/content/projects/{hermes-ios,listwithme,healthql,drift-dreams}.md`
- Create: `src/content/skill-library/{deep-research,browser-control,frontend-design,documents,pdf}.md`
- Create: `src/content/skills/{write-like-grant,goodreads-export,hatch-pet}.md`
- Create: `src/assets/projects/.gitkeep` before any optional project media is available
- Create when verified source media exists: `src/assets/projects/{hermes-ios,listwithme,healthql,drift-dreams}.*`
- Create: `docs/design/media-sources.md`
- Create: `src/data/site.ts`
- Create: `src/data/navigation.ts`
- Create: `src/data/social.ts`
- Create: `src/data/now.ts`
- Create: `src/data/collections.ts`
- Create: `src/data/listwithme.ts`
- Create: `scripts/lib/source-graph.ts`
- Create: `scripts/validate-source.ts`
- Create: `tests/contracts/launch-content.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: Schemas and graph validation from Task 4; approved manifest and verified destinations in spec Section 12.
- Produces: the exact 4/4/5/3 record sets with evidence-supported, sparse-valid variant field-note sections, `SITE`, `NAVIGATION`, `SOCIAL_LINKS`, `NOW_ITEMS`, and collection copy used by all routes.

- [ ] **Step 1: Write the failing launch-manifest test**

Create `tests/contracts/launch-content.test.ts`. Load frontmatter through `scripts/lib/source-graph.ts` and assert:

```ts
const ids = (records: readonly AnySiteRecord[]) => records.map(({ id }) => id);

expect(ids(graph['app-library'])).toEqual(['obsidian', 'codex', 'hermes-agent', 'superhuman']);
expect(ids(graph.projects)).toEqual(['hermes-ios', 'listwithme', 'healthql', 'drift-dreams']);
expect(ids(graph['skill-library'])).toEqual(['deep-research', 'browser-control', 'frontend-design', 'documents', 'pdf']);
expect(ids(graph.skills)).toEqual(['write-like-grant', 'goodreads-export', 'hatch-pet']);
expect(find(graph, 'projects', 'listwithme').data.canonicalPath).toBe('/listwithme/');
expect(allPaths(graph)).not.toContain('/projects/listwithme/');
expect(find(graph, 'projects', 'listwithme').data.links.find((link) => link.kind === 'primary')?.href).toBe('https://apps.apple.com/us/app/listwithme/id1224284271');
expect(graph.skills.flatMap((record) => record.data.links).some((link) => link.kind === 'install')).toBe(false);
expect(graph.skills.filter((record) => record.data.visibility === 'private').every((record) => record.data.links.length === 0)).toBe(true);

for (const collection of NON_BLOG_COLLECTIONS) {
  const allowedKeys = ALLOWED_FIELD_NOTE_KEYS[collection];
  for (const record of graph[collection].filter(({ data }) => data.hasDetailPage)) {
    const actual = record.data.fieldNotes.map(({ key }) => key);
    expect(new Set(actual).size, `${collection}/${record.id}: duplicate field-note key`).toBe(actual.length);
    expect(actual.length, `${collection}/${record.id}: sparse-detail minimum`).toBeGreaterThanOrEqual(2);
    expect(actual.every((key) => allowedKeys.includes(key)), `${collection}/${record.id}: approved variant keys`).toBe(true);
  }
}
```

Define `NON_BLOG_COLLECTIONS = ['app-library', 'projects', 'skill-library', 'skills'] as const` and `ALLOWED_FIELD_NOTE_KEYS` in the test from the exact four collection lists in Task 4. This loop covers all 16 launch dossiers, not only one representative page.

Run: `npm test -- tests/contracts/launch-content.test.ts`

Expected: FAIL because the records do not exist.

- [ ] **Step 2: Create all records from one exact manifest**

Use this matrix verbatim for ID, canonical path, ownership, ordering, and verified primary destination:

| Collection | ID | Canonical path | Ownership | Homepage | Primary destination |
|---|---|---|---|---|---|
| App Library | `obsidian` | `/app-library/obsidian/` | used | app-library / 1 | `https://obsidian.md` |
| App Library | `codex` | `/app-library/codex/` | used | app-library / 2 | `https://openai.com/codex/` |
| App Library | `hermes-agent` | `/app-library/hermes-agent/` | used | app-library / 3 | `https://github.com/NousResearch/hermes-agent` |
| App Library | `superhuman` | `/app-library/superhuman/` | used | app-library / 4 | `https://superhuman.com` |
| My Apps | `hermes-ios` | `/projects/hermes-ios/` | made | featured-project-primary | `https://github.com/glisom/hermes-ios` |
| My Apps | `listwithme` | `/listwithme/` | made | featured-project-secondary | `https://apps.apple.com/us/app/listwithme/id1224284271` |
| My Apps | `healthql` | `/projects/healthql/` | made | none | `https://github.com/glisom/HealthQL` |
| My Apps | `drift-dreams` | `/projects/drift-dreams/` | made | none | `https://getdriftdreams.com` |
| Skill Library | `deep-research` | `/skill-library/deep-research/` | used | none | verified public source or honest no-action |
| Skill Library | `browser-control` | `/skill-library/browser-control/` | used | none | verified public source or honest no-action |
| Skill Library | `frontend-design` | `/skill-library/frontend-design/` | used | none | verified public source or honest no-action |
| Skill Library | `documents` | `/skill-library/documents/` | used | none | verified public source or honest no-action |
| Skill Library | `pdf` | `/skill-library/pdf/` | used | none | verified public source or honest no-action |
| My Skills | `write-like-grant` | `/skills/write-like-grant/` | made | authored-skills / 1 | no public action |
| My Skills | `goodreads-export` | `/skills/goodreads-export/` | made | authored-skills / 2 | no public action |
| My Skills | `hatch-pet` | `/skills/hatch-pet/` | made | authored-skills / 3 | no public action |

Set `displayOrder` to the one-based row order within each collection shown above: App Library 1–4, My Apps 1–4, Skill Library 1–5, and My Skills 1–3. `scripts/lib/source-graph.ts` must sort non-blog records by `displayOrder` and then ID, and sort Blog records with `comparePostsNewestFirst`, so tests and rendering never depend on filesystem glob order.

Task 6 owns authoring the strongest evidence-supported subset of each record's approved project/app/skill section set. Aim for the complete variant anatomy, but preserve the approved sparse behavior: every generated dossier must contain `summary`, one real action or honest `actionState`, at least two facts, at least two allowed field-note sections, and paragraphs of at least 40 non-whitespace characters. Omit unsupported optional sections rather than inventing them. If verified source material cannot support even that sparse minimum, stop and present the affected record and missing evidence to Grant. With explicit approval, set `hasDetailPage: false`, add `actionState: 'Kept in my private toolkit.'` where appropriate, and update `public-routes.json`, its group/count totals, `tests/contracts/production-baseline.test.ts` hard-coded artifact/sitemap totals, source-validation expectations, sitemap total, and final acceptance checklist in one reviewed spec-amendment commit. Stage that conditional amendment explicitly with `git add docs/superpowers/specs/2026-09-02-grantisom-astro-site-design.md docs/superpowers/plans/2026-09-02-grantisom-astro-rebuild.md tests/fixtures/public-routes.json tests/contracts/production-baseline.test.ts tests/contracts/launch-content.test.ts scripts/validate-source.ts` before committing it. Never create filler prose or silently reduce the approved 52-route contract to satisfy a test.

Use this complete shape for each file:

```markdown
---
title: Obsidian
slug: obsidian
canonicalPath: /app-library/obsidian/
summary: The place I keep notes, projects, and the connections between them.
draft: false
hasDetailPage: true
featured: false
displayOrder: 1
homepageSlot: app-library
homepageOrder: 1
tags: [notes, knowledge]
ownership: used
category: Thinking and notes
reasonItStays: It gives my notes enough structure to stay useful without making them rigid.
reviewedAt: '2026-09-02'
links:
  - { label: 'Visit Obsidian', href: 'https://obsidian.md', kind: 'primary' }
relationships: []
facts:
  - { label: 'Job', value: 'Notes and connected knowledge' }
  - { label: 'Cadence', value: 'Daily' }
fieldNotes:
  - key: workflow
    heading: The job it does
    body:
      - I use Obsidian as the durable home for notes, active projects, and the connections I want to find again later.
  - key: details-i-love
    heading: The details I love
    body:
      - Plain text keeps the underlying work portable, while links and structure let the vault grow without turning into a filing cabinet.
  - key: friction-and-limits
    heading: Friction and limits
    body:
      - 'The flexibility is also the trap: without a small set of conventions, it is easy for capture to outrun the work of making notes useful again.'
  - key: who-it-suits
    heading: Who it suits
    body:
      - It is especially useful for someone who values local files, wants to shape their own system, and does not mind tending that system over time.
---
```

For the other records, take factual claims only from the approved prototype, current project pages and repositories, official public destinations, or Grant's local skill descriptions. Public My Skills entries may describe purpose, trigger, supported tools, and design choices; they must not copy private instructions, client details, tokens, local paths, or private source material.

Before using an external product/repository page as a factual or visual source, open it in the in-app browser and capture the relevant real artifact. Save only imagery that belongs to Grant's project or is licensed for this use, crop it to the measured card/detail slot, and record source URL plus capture date in `docs/design/media-sources.md`. If a destination has no legitimate usable media, omit its media field; never substitute a fake screenshot or generic placeholder.

- [ ] **Step 3: Create the single-source site data**

Create `src/data/site.ts`:

```ts
export const SITE = {
  name: 'Grant Isom',
  origin: 'https://grantisom.com',
  title: 'Grant Isom — Writer, maker, tinkerer',
  description: 'Writing, small software, useful systems, and the tools and skills shaping how I work.',
  tagline: 'Writer · maker · tinkerer',
  footerLine: 'Grant Isom · Writer, maker, curious person',
  locationLine: 'Chicago, Illinois · My corner of the internet',
  email: 'grant.isom@gmail.com',
  locale: 'en',
  timeZone: 'America/Chicago',
} as const;
```

Create `src/data/navigation.ts` with exactly Blog `/blog/`, App Library `/app-library/`, My Apps `/projects/`, Skill Library `/skill-library/`, My Skills `/skills/`, and a separate About `/about/`. Create `src/data/social.ts` with GitHub, LinkedIn, RSS, and email. Create `src/data/now.ts` with Writing `Notes from the workbench`, Building `Hermes iOS`, and Using `Obsidian + Codex`.

Create `src/data/collections.ts` with the five approved titles and descriptions, including:

```ts
blog: {
  label: 'Blog',
  title: "Things I've written.",
  description: 'Posts, build logs, playlists, and whatever else seemed worth writing down.',
}
```

Create `src/data/listwithme.ts` by preserving the current Support and Privacy claims exactly and by adding only structural metadata: `lastUpdated`, section IDs, contact path, and back path.

- [ ] **Step 4: Add source validation to every build**

Implement `scripts/lib/source-graph.ts` to glob all five content directories, parse Markdown frontmatter, apply the Task 4 schemas, set every `SiteRecord.id` with the shared `contentIdFromData()` helper used by Astro's explicit `generateId`, and return a collection-specific `ContentGraph` in the deterministic order defined above. For blog bodies, pass the complete body through Task 5's token-aware `validateLegacyHtml`; it ignores fenced/indented code and exempts only exact generated `EmbedFrame` and `Figure` tokens. Add the real Accessibility Testing post as a regression fixture so `<your_bundle_id>` inside code never becomes HTML. Implement `scripts/validate-source.ts` to call `assertValidContentGraph`, then assert record counts `23/4/4/5/3` and deep-equality between `buildRouteManifest(graph)` and every `{ canonicalPath, outputPath, kind, inSitemap }` object in the 52-route oracle after independently sorting both arrays by `canonicalPath`—not count equality alone. The launch-content test must also assert each source-graph ID equals `contentIdFromData(record.data)`, preventing Astro/source-parser identity drift.

Add to `package.json`:

```json
"validate:source": "tsx scripts/validate-source.ts",
"build": "npm run validate:source && astro check && astro build"
```

Run:

```bash
npm test -- tests/contracts/launch-content.test.ts tests/contracts/content-schema.test.ts
npm run validate:source
npm run build
```

Expected: PASS with exact collection counts `23`, `4`, `4`, `5`, and `3`; build route manifest count `52`; no placeholder destination; no private skill action.

- [ ] **Step 5: Commit launch content and data**

```bash
git add package.json package-lock.json src/content src/data src/assets/projects docs/design/media-sources.md scripts/validate-source.ts scripts/lib/source-graph.ts tests/contracts/launch-content.test.ts tests/fixtures/public-routes.json
git commit -m "feat: add personal site launch collections"
```

---

### Task 7: Build the Shared Evidence Index Shell and Visual Tokens

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`
- Create: `src/styles/shell.css`
- Create: `src/styles/utilities.css`
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/shell/{SkipLink,IdentityRail,MobileHeader,MobileNav,SiteFooter,SeoHead}.astro`
- Create: `src/components/media/{ResponsiveImage,HalftoneImage,Icon}.astro`
- Modify: `src/lib/media.ts`
- Create: `tests/contracts/site-shell.test.ts`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `BaseLayoutProps`, `RailContext`, `SITE`, `NAVIGATION`, and `SOCIAL_LINKS`.
- Produces: `<BaseLayout {...BaseLayoutProps}>`, `<IdentityRail activeCollection railContext>`, `<MobileNav activeCollection>`, `<Icon name>`, `resolveLocalImage(src: string): ImageMetadata`, and global CSS tokens/breakpoints used by every later page family.

- [ ] **Step 1: Write the failing built-shell contract**

Create `tests/contracts/site-shell.test.ts` to run against `dist/index.html` after a build:

```ts
expect($('html').attr('lang')).toBe('en');
expect($('a[href="#main-content"]').text().trim()).toBe('Skip to content');
expect($('main#main-content')).toHaveLength(1);
expect($('nav[aria-label="Browse"] a').map((_, element) => $(element).text().trim()).get()).toEqual([
  'Blog', 'App Library', 'My Apps', 'Skill Library', 'My Skills',
]);
expect($('nav[aria-label="Mobile browse"] a[href="/about/"]')).toHaveLength(1);
expect($('link[rel="alternate"][type="application/rss+xml"]').attr('href')).toBe('https://grantisom.com/feed.xml');
expect($('link[rel~="icon"][href="/favicon.ico"]')).toHaveLength(1);
expect(html).not.toContain('/assets/js/darkmode.js');
expect(html).not.toContain('/css/main.css');
```

Add a helper in the test that executes `npm run build` once in `beforeAll` and loads `dist/index.html` with Cheerio.

Run: `npm test -- tests/contracts/site-shell.test.ts`

Expected: FAIL because the interim page has no shared shell.

- [ ] **Step 2: Establish exact tokens and global behavior**

Create `src/styles/tokens.css`:

```css
:root {
  color-scheme: light;
  --paper: #f7f6f2;
  --paper-bright: #fbfaf6;
  --ink: #141516;
  --muted: #62645f;
  --line: #d5d4ce;
  --line-dark: #b8b7b0;
  --blue: #2348f5;
  --blue-dark: #1739cf;
  --lime: #bdd600;
  --black: #111214;
  --rail-wide: 250px;
  --rail-compact: 210px;
  --mobile-header: 62px;
  --radius: 4px;
  --utility-small: 0.625rem;
  --utility: 0.75rem;
  --serif: 'Source Serif 4', Georgia, serif;
  --sans: 'DM Sans', system-ui, sans-serif;
  --mono: 'IBM Plex Mono', ui-monospace, monospace;
}
```

In `global.css`, import the exact font weights used by the Vite reference, normalize box sizing, set `overflow-x: clip`, add visible `:focus-visible` outlines on paper/blue/lime/black surfaces, set body selection blue, bound media, and disable nonessential transition/animation and smooth-scroll behavior under `prefers-reduced-motion: reduce`. At 820px and below, make every link/button/summary/control—including inline prose links—expose at least a 44×44px hit region without changing visible prose order. In `utilities.css`, create reusable `.eyebrow`, `.registry-line`, `.arrow-link`, `.sr-only`, and bounded overflow utilities; all small labels use `--utility-small` or `--utility`, never a value below 10px, and their components emit `data-utility-label` for computed-style verification.

- [ ] **Step 3: Implement the static document shell**

Create `src/layouts/BaseLayout.astro`:

```astro
---
import type { BaseLayoutProps } from '../types/content';
import SkipLink from '../components/shell/SkipLink.astro';
import IdentityRail from '../components/shell/IdentityRail.astro';
import MobileHeader from '../components/shell/MobileHeader.astro';
import SiteFooter from '../components/shell/SiteFooter.astro';
import SeoHead from '../components/shell/SeoHead.astro';
import '../styles/tokens.css';
import '../styles/global.css';
import '../styles/shell.css';
import '../styles/utilities.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/source-serif-4/400.css';
import '@fontsource/source-serif-4/400-italic.css';
import '@fontsource/source-serif-4/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@phosphor-icons/web/regular';

const props = Astro.props as BaseLayoutProps;
---

<!doctype html>
<html lang="en">
  <head><SeoHead {...props} /></head>
  <body>
    <SkipLink />
    <IdentityRail activeCollection={props.activeCollection} railContext={props.railContext} />
    <MobileHeader activeCollection={props.activeCollection} />
    <div class="site-frame">
      <main id="main-content" tabindex="-1"><slot /></main>
      <SiteFooter />
    </div>
  </body>
</html>
```

`SeoHead.astro` initially emits charset, viewport, title, description, absolute canonical, RSS alternate, `<link rel="icon" href="/favicon.ico">`, basic Open Graph/Twitter values, and noindex when requested. Task 13 adds article JSON-LD and the final social asset; the preserved launch favicon is never replaced.

- [ ] **Step 4: Build the desktop identity rail and native mobile Browse control**

`IdentityRail.astro` renders the GI monogram, `Writer · maker · tinkerer`, `Currently building Hermes iOS`, the five exact primary links, page-specific `RailContext` (including a quiet title/parent block for utility pages), and GitHub/LinkedIn/RSS/email. The active link uses `aria-current="page"` and an adjacent text-readable active state.

Implement `MobileNav.astro` as native disclosure markup with no framework runtime:

```astro
<details class="mobile-nav">
  <summary>Browse</summary>
  <nav aria-label="Mobile browse">
    {NAVIGATION.map((item) => <a href={item.href} aria-current={item.id === activeCollection ? 'page' : undefined}>{item.label}</a>)}
    <a href="/about/">About</a>
    <a href="/feed.xml">RSS</a>
    <a href={`mailto:${SITE.email}`}>Email</a>
  </nav>
</details>
```

`MobileHeader.astro` keeps monogram and name visible beside this disclosure. `Icon.astro` maps approved icon names to Phosphor class names and always requires an accessible label or `decorative={true}`.

Extend the Task 5 `src/lib/media.ts` eager asset map without changing its `resolveLocalImage` contract. `resolveLocalImage('evidence/evidence-map.png')` and the existing `legacy/...` keys both return metadata and throw a path-specific build error when absent. `ResponsiveImage.astro` imports `{ Picture }` from `astro:assets` and passes that metadata to `<Picture>`—not `<Image>`, because multiple `formats` are a Picture-only prop—with authored alt text, widths appropriate to the measured slot, `formats={['avif', 'webp']}`, and intrinsic width/height. When `decorative` is true, it emits `alt=""` plus `data-decorative="true"`; informative images never emit that marker. `HalftoneImage.astro` wraps it only with the approved crop/treatment class; it does not synthesize art.

- [ ] **Step 5: Match the approved responsive shell geometry**

In `shell.css` implement exactly:

```css
@media (min-width: 1220px) {
  .identity-rail { width: var(--rail-wide); }
  .site-frame { margin-left: var(--rail-wide); }
}

@media (min-width: 821px) and (max-width: 1219px) {
  .identity-rail { width: var(--rail-compact); }
  .site-frame { margin-left: var(--rail-compact); }
}

@media (max-width: 820px) {
  .identity-rail { display: none; }
  .mobile-header { display: flex; min-height: var(--mobile-header); position: sticky; top: 0; }
  .site-frame { margin-left: 0; }
  .mobile-nav summary, .mobile-nav a { min-height: 44px; }
}
```

Use `overflow-wrap: anywhere` for rail titles. Do not truncate. Set the desktop rail fixed from top to bottom, while the mobile header remains sticky.

- [ ] **Step 6: Switch the interim homepage to `BaseLayout` and verify**

Replace `src/pages/index.astro` with:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout
  title="Grant Isom — Writer, maker, tinkerer"
  description="Writing, small software, useful systems, and the tools and skills shaping how I work."
  canonicalPath="/"
  railContext={{ kind: 'home' }}
>
  <h1>Grant Isom</h1>
  <p>Writer, maker, curious person.</p>
</BaseLayout>
```

Run:

```bash
npm run build
npm test -- tests/contracts/site-shell.test.ts
```

Expected: PASS; one H1; correct five-link Browse navigation; no legacy stylesheet or dark-mode script reference.

- [ ] **Step 7: Commit the shell**

```bash
git add src/styles src/layouts/BaseLayout.astro src/components/shell src/components/media src/lib/media.ts src/pages/index.astro tests/contracts/site-shell.test.ts
git commit -m "feat: build the shared Evidence Index shell"
```

---

### Task 8: Port the Approved Homepage from Vite to Astro

**Files:**
- Create: `src/layouts/HomeLayout.astro`
- Create: `src/components/home/Hero.astro`
- Create: `src/components/home/NowStrip.astro`
- Create: `src/components/home/EvidenceGrid.astro`
- Create: `src/components/home/FeaturedWritingCard.astro`
- Create: `src/components/home/ProjectCard.astro`
- Create: `src/components/home/ToolListCard.astro`
- Create: `src/components/home/LatestPostsCard.astro`
- Create: `src/components/home/SkillLibraryCard.astro`
- Create: `src/components/home/AuthoredSkillsCard.astro`
- Create: `src/components/home/PersonalNote.astro`
- Create: `src/styles/home.css`
- Create: `src/assets/evidence/{evidence-map,production-hands,healthql-hands,listwithme-hand,belief-rings,groundwork-surveyor}.png`
- Create: `tests/contracts/homepage.test.ts`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `selectHomepageContent(graph): HomepageContent`, `NOW_ITEMS`, shared shell/media components, and the frozen Vite `App.jsx` plus `styles.css`.
- Produces: a static `/` page whose records and links come from content while its geometry, hierarchy, type, palette, rules, and crops match the approved Vite reference.

- [ ] **Step 1: Apply the shared deterministic post comparator**

Import `comparePostsNewestFirst` from `src/lib/content/date.ts` into `src/lib/content/homepage.ts` and replace the date-only sort with:

```ts
const latestPosts = graph.blog
  .filter((record) => !record.data.draft && record.id !== featuredWriting.id)
  .toSorted(comparePostsNewestFirst)
  .slice(0, 3);
```

Extend `tests/contracts/content-schema.test.ts` with a graph whose two newest posts share `2026-09-01` but have distinct `originalTimestamp` values. Assert latest-post IDs `vampire`, `skill-thief`, and `healthql-react-native` after excluding `listwithme-returns`.

- [ ] **Step 2: Write the failing homepage output contract**

Create `tests/contracts/homepage.test.ts` and load `dist/index.html` after a build:

```ts
expect($('h1').text().replace(/\s+/g, ' ').trim()).toBe('I build useful things and write what I learn.');
expect($('[data-home-hero] a[href="/blog/"]')).toHaveLength(1);
expect($('[data-home-hero] a[href="/projects/"]')).toHaveLength(1);
expect($('[data-home-slot="featured-writing"] h2').text()).toBe('Bringing ListWithMe Back to Life');
expect($('[data-home-slot="featured-project-primary"] h2').text()).toBe('Hermes iOS');
expect($('[data-home-slot="featured-project-secondary"] h2').text()).toBe('ListWithMe');
expect($('[data-home-slot="app-library"] [data-record-title]').map((_, node) => $(node).text().trim()).get()).toEqual(['Obsidian', 'Codex', 'Hermes Agent', 'Superhuman']);
expect($('[data-home-slot="skill-library"] [data-record-title]').map((_, node) => $(node).text().trim()).get()).toEqual(['Deep Research', 'Browser Control', 'Frontend Design', 'Documents', 'PDF']);
expect($('[data-home-slot="latest-posts"] [data-post-row] > a')).toHaveLength(3);
expect($('[data-home-slot="my-skills"] [data-record-title]').map((_, node) => $(node).text().trim()).get()).toEqual(['write-like-grant', 'goodreads-export', 'hatch-pet']);
expect($('a[href^="#blog"], a[href^="#my-apps"]')).toHaveLength(0);
```

`Hero.astro` owns the `data-home-hero` region. `ToolListCard.astro`, `SkillLibraryCard.astro`, and `AuthoredSkillsCard.astro` add `data-record-title` only to each record name; `LatestPostsCard.astro` marks each row with `data-post-row`, so contracts never count surrounding actions or descriptive copy.

Run: `npm test -- tests/contracts/homepage.test.ts`

Expected: FAIL against the interim homepage.

- [ ] **Step 3: Copy the six real evidence assets into Astro's image pipeline**

Copy exactly these files from `design-reference/vite-homepage/public/assets/` to `src/assets/evidence/`:

```text
evidence-map.png
production-hands.png
healthql-hands.png
listwithme-hand.png
belief-rings.png
groundwork-surveyor.png
```

Use `ResponsiveImage.astro` or `HalftoneImage.astro` for them so Astro emits width/height, responsive sources, and modern formats. Do not reference the Vite server and do not replace art with CSS or improvised vectors.

- [ ] **Step 4: Port the Vite structure into focused Astro components**

`src/pages/index.astro` must only load and select data:

```astro
---
import HomeLayout from '../layouts/HomeLayout.astro';
import Hero from '../components/home/Hero.astro';
import NowStrip from '../components/home/NowStrip.astro';
import EvidenceGrid from '../components/home/EvidenceGrid.astro';
import PersonalNote from '../components/home/PersonalNote.astro';
import { loadContentGraph } from '../lib/content/load';
import { selectHomepageContent } from '../lib/content/homepage';
import { NOW_ITEMS } from '../data/now';

const content = selectHomepageContent(await loadContentGraph());
---

<HomeLayout>
  <Hero />
  <NowStrip items={NOW_ITEMS} />
  <EvidenceGrid content={content} />
  <PersonalNote />
</HomeLayout>
```

`EvidenceGrid.astro` consumes `content.skillLibrary` for the Skill Library panel and never copies the frozen prototype's stale hard-coded skill names or external Hermes link. `Hero.astro` uses the approved copy verbatim:

```text
Writing · Small software · Useful systems
I build useful things and write what I learn.
I'm Grant, an app maker, obsessive software user, and writer in Chicago. This is where I keep the things I've built, the tools I actually use, the skills shaping how I work, and the notes I want to remember.
```

The two actions are `Read the blog` → `/blog/` and `See what I'm building` → `/projects/`. Preserve the `Personal rule 01 / Make what you want to use.` evidence-map caption.

- [ ] **Step 5: Port approved CSS values without carrying the single-page prototype behavior**

Move homepage-only selectors from frozen `src/styles.css` into `src/styles/home.css`, retaining the approved grid tracks, gaps, rule widths, display font sizes, card radii, and image object positions. Replace `.sidebar` and global selectors with the Task 7 shell equivalents. Override every prototype utility label below 10px to the approved 10–12px production tokens. Remove hash-scroll state, React selectors, companion tooling, and prototype-only external self-links.

The responsive states remain 1586×992, 1024×768, and 390×844. Import `home.css` only from `HomeLayout.astro`.

- [ ] **Step 6: Verify data behavior and static output**

Run:

```bash
npm run build
npm test -- tests/contracts/homepage.test.ts tests/contracts/content-schema.test.ts
```

Expected: PASS; homepage content is real and ordered; no hash-based collection navigation; no client-side React bundle is emitted.

- [ ] **Step 7: Inspect the homepage against the frozen reference**

Run the reference on port 4173 and Astro on port 4321 in separate terminals. In the in-app browser, inspect both at 1586×992, 1024×768, and 390×844. Check rail/header dimensions, primary section bounds, line wrapping, type families/weights, rules, image crops, and computed utility-label sizes. Always create `docs/design/homepage-implementation-notes.md`; write `No intentional deviations.` when none exist, otherwise record only differences already authorized by spec Section 3.

Expected: no clipped text, page-level horizontal overflow, missing rules, distorted imagery, or inactive primary navigation.

- [ ] **Step 8: Commit the homepage**

```bash
git add src/layouts/HomeLayout.astro src/components/home src/styles/home.css src/assets/evidence src/pages/index.astro src/lib/content/homepage.ts tests/contracts/homepage.test.ts tests/contracts/content-schema.test.ts docs/design/homepage-implementation-notes.md
git commit -m "feat: port the approved personal homepage"
```

---

### Task 9: Build the Shared Article System and Exact Dated Routes

**Files:**
- Create: `src/layouts/ArticleLayout.astro`
- Create: `src/components/editorial/{ArticleMeta,Prose,TableOfContents,Callout,RelatedRecords,PostNavigation,Comments}.astro`
- Modify: `src/components/editorial/{EmbedFrame,Figure}.astro`
- Create: `src/styles/prose.css`
- Create: `src/pages/[year]/[month]/[day]/[slug].astro`
- Create: `tests/contracts/article-pages.test.ts`
- Modify: `scripts/data/blog-enrichments.ts`
- Modify by rerunning the deterministic generator: `src/content/blog/*.{md,mdx}`

**Interfaces:**
- Consumes: `CollectionEntry<'blog'>`, `calculateReadingMinutes`, rendered Astro headings, `resolveRelationships`, and shared shell/media components.
- Produces: `getStaticPaths()` for all 23 exact `.html` routes and an `ArticleLayout` that handles long titles, no-heading posts, code, Spotify, book covers, related records, post navigation, and pathname-based comments.

- [ ] **Step 1: Write the failing article-route and semantic tests**

Create `tests/contracts/article-pages.test.ts` and inspect built HTML with Cheerio:

```ts
expect(await exists('dist/2020/05/23/mac_apps.html')).toBe(true);
expect(await exists('dist/2026/09/01/vampire.html')).toBe(true);
expect(await exists('dist/projects/listwithme/index.html')).toBe(false);
expect(article('/2026/02/24/listwithme-returns.html').$('h1')).toHaveLength(1);
expect(article('/2018/04/02/reading-list.html').$('[data-toc]')).toHaveLength(0);
expect(article('/2020/02/10/2019-playlists.html').$('iframe[src^="https://open.spotify.com/"][loading="lazy"][title]')).not.toHaveLength(0);
expect(article('/2026/09/01/vampire.html').$('pre code')).not.toHaveLength(0);
const bookFigures = article('/2023/01/02/mustread-books-for.html').$('figure.article-figure');
expect(bookFigures).not.toHaveLength(0);
expect(bookFigures.find('source[type="image/avif"][srcset*="/_astro/"]')).toHaveLength(bookFigures.length);
expect(bookFigures.find('source[type="image/webp"][srcset*="/_astro/"]')).toHaveLength(bookFigures.length);
expect(bookFigures.find('source[sizes]')).toHaveLength(bookFigures.length * 2);
expect(bookFigures.find('img[src^="/images/"][width][height][alt]')).toHaveLength(bookFigures.length);
```

Loop through `legacy-pages.json` and assert every baseline heading ID appears in the matching output. Parse every AVIF/WebP `srcset` candidate and assert its `/_astro/` file exists beneath `dist/`; also assert every original `/images/` fallback resolves. Run: `npm test -- tests/contracts/article-pages.test.ts`.

Expected: FAIL because dated pages do not exist.

- [ ] **Step 2: Implement exact static path generation**

Create `src/pages/[year]/[month]/[day]/[slug].astro` with:

```astro
---
import { getCollection, render, type CollectionEntry } from 'astro:content';
import ArticleLayout from '../../../../layouts/ArticleLayout.astro';

export async function getStaticPaths() {
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .toSorted((a, b) => a.data.canonicalPath.localeCompare(b.data.canonicalPath));
  return posts.map((post) => {
    const match = post.data.canonicalPath.match(/^\/(\d{4})\/(\d{2})\/(\d{2})\/(.+)\.html$/);
    if (!match) throw new Error(`${post.id}: invalid dated canonical path`);
    const [, year, month, day, slug] = match;
    return { params: { year, month, day, slug }, props: { post } };
  });
}

interface Props { post: CollectionEntry<'blog'> }
const { post } = Astro.props;
const { Content, headings } = await render(post);
---

<ArticleLayout post={post} headings={headings}>
  <Content />
</ArticleLayout>
```

Inside `ArticleLayout`, import `loadContentGraph` from `src/lib/content/load.ts`, load the graph once, sort published posts by timestamp, calculate previous/next, resolve authored relationships, format the authored calendar date with `formatPublicDate`, and pass only serializable values into child components. Do not import `astro:content` into the pure graph utilities.

Pass `post.data.canonicalOverride` through `BaseLayout` only when authored; otherwise omit it so `SeoHead` derives the canonical from `SITE.origin + canonicalPath`.

- [ ] **Step 3: Implement article masthead, facts, reading grid, and prose**

Match `docs/design/mockups/article-family-approved.html` structurally:

```text
All writing back link
Blog / {kind} · {year}
Title with optional exact titleAccent
Summary dek
Optional real evidence figure
Published / Reading time / Filed under / Connected project facts
Field note margin / prose / generated contents
Tags and connected context / related records / previous-next / optional comments
```

`Prose.astro` is only a semantic wrapper around the content slot. `prose.css` owns a 680–720px body measure, Source Serif 4 at about 19px/1.7, blue underlined links, blue-rule blockquotes, dark code panels, bounded overflow for code/tables, and full/wide/portrait/gallery figures. Preserve the Task 5 `Figure` picture/source/fallback contract while styling it. Breakout figures reach at most 920px only at 1220px and wider.

Add an explicit 821–1023px rule that stacks the article masthead, keeps the 210px rail, lays facts inline in normal flow, and prevents every context section from becoming sticky. This is a separate state from the 1024px approved visual baseline, not an accidental interpolation between tablet and phone.

- [ ] **Step 4: Implement responsive table of contents**

Filter rendered headings to depths 2 and 3. `TableOfContents.astro` returns no markup when there are fewer than three. At 1220px it is the right-side sticky ledger; from 821–1219px it appears above prose; at 820px and below render the same links inside native `<details data-toc>`.

Use heading slugs exactly as rendered and preserve document order. Number H2 display only when `post.data.numberHeadings` is true; never infer numbering.

- [ ] **Step 5: Implement real embeds, fallbacks, and lazy comments**

Keep the semantic `EmbedFrame.astro` boundary created in Task 5, add its final article-family classes/styles, and preserve this markup contract:

```astro
<figure class="embed-frame" data-migrated-embed>
  <iframe src={src} title={title} loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe>
  <figcaption data-embed-fallback><a href={src}>Open {title}</a></figcaption>
</figure>
```

`Comments.astro` renders only when `comments` is true, preserves repository `glisom/grantisom-com-comments`, `issue-term="pathname"`, and label `Comment`, and injects the Utterances script only when its reserved region approaches the viewport. Use the reviewed light Utterances theme; do not load comments before primary content.

- [ ] **Step 6: Author the complete article relationship manifest**

Add the following reviewed values to `BLOG_ENRICHMENTS`, then run `npm run migrate:posts`. The map keys remain full canonical paths, while relationship IDs use the frontmatter `slug` because Astro and the source graph both call the explicit shared `contentIdFromData()` rule. Encode each cell in its shown order as `{ label, collection, id }`; never derive or reorder this editorial data from tags. This manifest gives every published article exactly two or three named records, as required by the approved default ending:

| Canonical article | Explicit related records, in authored order |
|---|---|
| `/2018/04/02/reading-list.html` | `Continued in → blog/mustread-books-for`; `Related skill → skills/goodreads-export` |
| `/2018/11/27/playlists.html` | `Continued in → blog/2019-playlists`; `Another personal archive → blog/reading-list` |
| `/2019/05/30/listwithme.html` | `Built as → projects/listwithme`; `Rebuilt later → blog/listwithme-returns` |
| `/2019/06/04/wwdc-day-1.html` | `Next day → blog/wwdc-day-2`; `Week in review → blog/wwdc-review` |
| `/2019/06/06/wwdc-day-2.html` | `Previous day → blog/wwdc-day-1`; `Next day → blog/wwdc-day-3`; `Week in review → blog/wwdc-review` |
| `/2019/06/07/wwdc-day-3.html` | `Previous day → blog/wwdc-day-2`; `Next day → blog/wwdc-day-4`; `Week in review → blog/wwdc-review` |
| `/2019/06/08/wwdc-day-4.html` | `Previous day → blog/wwdc-day-3`; `Week in review → blog/wwdc-review` |
| `/2019/06/09/wwdc-review.html` | `Where the week began → blog/wwdc-day-1`; `How the week ended → blog/wwdc-day-4` |
| `/2020/02/10/2019-playlists.html` | `Earlier playlists → blog/playlists`; `Another annual list → blog/reading-list` |
| `/2020/05/23/mac_apps.html` | `Current notes tool → app-library/obsidian`; `One developer workflow → blog/safari-inspecting-simulators`; `Later tools thinking → blog/notion-for-software` |
| `/2020/05/29/safari-inspecting-simulators.html` | `Part of the toolkit → blog/mac_apps`; `Another iOS test workflow → blog/accessibility-testing-in` |
| `/2020/09/28/next-chapter.html` | `What came next → blog/2-years-at-illuminate`; `More healthcare software → blog/healthql-sql-for-healthkit` |
| `/2022/11/07/2-years-at-illuminate.html` | `Where the chapter began → blog/next-chapter`; `Later healthcare software → blog/healthql-sql-for-healthkit` |
| `/2023/01/02/mustread-books-for.html` | `Earlier reading list → blog/reading-list`; `Related skill → skills/goodreads-export` |
| `/2023/01/14/notion-for-software.html` | `What I use now → app-library/obsidian`; `Earlier tools list → blog/mac_apps` |
| `/2023/02/01/expo-app-config.html` | `Built on this stack → blog/healthql-react-native`; `Another mobile workflow → blog/accessibility-testing-in` |
| `/2023/05/15/using-act-to.html` | `Another CI test workflow → blog/accessibility-testing-in`; `Another release workflow → blog/expo-app-config` |
| `/2023/07/19/accessibility-testing-in.html` | `Related mobile setup → blog/expo-app-config`; `Related local CI workflow → blog/using-act-to`; `Earlier iOS testing → blog/safari-inspecting-simulators` |
| `/2026/02/01/healthql-sql-for-healthkit.html` | `Built as → projects/healthql`; `Expanded in → blog/healthql-react-native` |
| `/2026/02/07/healthql-react-native.html` | `Built as → projects/healthql`; `Built on → blog/healthql-sql-for-healthkit`; `Related Expo setup → blog/expo-app-config` |
| `/2026/02/24/listwithme-returns.html` | `Built as → projects/listwithme`; `Earlier chapter → blog/listwithme` |
| `/2026/09/01/skill-thief.html` | `Related authored skill → skills/write-like-grant`; `Related authored skill → skills/goodreads-export` |
| `/2026/09/01/vampire.html` | `Earlier Mac toolkit → blog/mac_apps`; `Another Swift project → blog/healthql-sql-for-healthkit`; `Another app revival → blog/listwithme-returns` |

Also set `relatedProject: listwithme` on both ListWithMe posts and `relatedProject: healthql` on both HealthQL posts. Set `numberHeadings: true` only on canonical path `/2026/02/24/listwithme-returns.html` for the approved article presentation; all other migrated posts remain false unless separately reviewed.

Extend `tests/contracts/article-pages.test.ts` to iterate all 23 published article outputs, require two or three `[data-related-record]` links on each, require every link to resolve to its authored internal canonical path, and assert the exact ordered targets for the ListWithMe, WWDC, HealthQL, and two 2026 tool-build fixtures. Previous/next chronology remains a separate navigation region and never counts toward the related-record total.

- [ ] **Step 7: Verify every representative article mode**

Run:

```bash
npm run build
npm test -- tests/contracts/article-pages.test.ts
npm run migrate:posts:check
```

Expected: PASS for all 23 paths and heading IDs; one H1 per page; no-heading post omits TOC; Spotify has linked fallback; comments appear only when enabled; no page-level horizontal overflow in manual in-app inspection.

- [ ] **Step 8: Compare the approved ListWithMe article state**

Inspect `/2026/02/24/listwithme-returns.html` beside `docs/design/mockups/article-family-approved.html` at all three baseline viewports. Compare top-of-page composition and full-page flow; exclude the companion bar. Verify long title, code-heavy, embed-heavy, book-cover, and no-heading posts as secondary fixtures.

- [ ] **Step 9: Commit the article family**

```bash
git add src/layouts/ArticleLayout.astro src/components/editorial src/styles/prose.css 'src/pages/[year]' scripts/data/blog-enrichments.ts src/content/blog tests/contracts/article-pages.test.ts
git commit -m "feat: build the shared article system"
```

---

### Task 10: Build All Five Collection Indexes

**Files:**
- Create: `src/layouts/CollectionIndexLayout.astro`
- Create: `src/components/index/{CollectionMasthead,FeaturedEntry,BlogLedger,ToolCatalog,AppEvidenceGrid,SkillManual,AuthoredSkillGrid}.astro`
- Create: `src/styles/indexes.css`
- Create: `src/pages/blog/index.astro`
- Create: `src/pages/app-library/index.astro`
- Create: `src/pages/projects/index.astro`
- Create: `src/pages/skill-library/index.astro`
- Create: `src/pages/skills/index.astro`
- Create: `tests/contracts/index-pages.test.ts`

**Interfaces:**
- Consumes: published collection records, `groupPostsByYear`, `COLLECTIONS`, and `CollectionIndexLayout` props `{ collection, count, updatedAt, title, description }`.
- Produces: five static collection indexes sharing one shell and masthead grammar with collection-specific content anatomy.

- [ ] **Step 1: Write the failing five-index contract**

Create `tests/contracts/index-pages.test.ts`:

```ts
expect(index('/blog/').$('h1').text()).toBe("Things I've written.");
expect(index('/blog/').$('[data-record-count]').attr('data-record-count')).toBe('23');
expect(index('/blog/').$('[data-year-group="2026"]')).toHaveLength(1);
expect(index('/blog/').$('.post-row')).toHaveLength(23);
expect(index('/app-library/').$('[data-tool-record]')).toHaveLength(4);
expect(index('/projects/').$('[data-app-record]')).toHaveLength(4);
expect(index('/skill-library/').$('[data-skill-record]')).toHaveLength(5);
expect(index('/skills/').$('[data-authored-skill]')).toHaveLength(3);
for (const path of paths) expect(index(path).$('input[type="search"], [data-filter]')).toHaveLength(0);
```

Run: `npm test -- tests/contracts/index-pages.test.ts`

Expected: FAIL because index routes do not exist.

- [ ] **Step 2: Implement the common index wrapper and masthead**

`CollectionIndexLayout.astro` wraps `BaseLayout` with `railContext={{ kind: 'index', count, updatedAt }}` and imports `indexes.css`. `CollectionMasthead.astro` renders the exact collection label, true published count, editorial title, one-sentence description, and optional real halftone mark.

At 821–1023px, stack the masthead's title, description, count, and optional mark in document flow while retaining the 210px rail; the wide multi-column masthead begins at 1024px. At 820px and below, the shared mobile header replaces the rail.

Production navigation uses links only. Do not port preview switcher buttons or the design companion bar.

- [ ] **Step 3: Implement the Blog ledger**

`src/pages/blog/index.astro` loads all 23 published posts, sorts newest first with the exported `comparePostsNewestFirst` comparator from `src/lib/content/date.ts`, groups by filename year, and passes the featured record separately without removing it from the complete ledger. Each row has full title, month/day from `formatPublicDate(..., 'short')`, authored `kind`, and calculated reading time.

Use this route pattern for every index:

```astro
<CollectionIndexLayout collection="blog" count={posts.length} updatedAt={posts[0].data.publishedAt} title={copy.title} description={copy.description}>
  <FeaturedEntry record={featured} />
  <BlogLedger groups={groupPostsByYear(posts)} />
</CollectionIndexLayout>
```

- [ ] **Step 4: Implement the four non-blog anatomies**

- `ToolCatalog`: group App Library by authored category; show title, category, `reasonItStays`, and internal dossier path or verified external destination when `hasDetailPage` is false.
- `AppEvidenceGrid`: current work first, archived below; show real project art, summary, status, platform, and one destination.
- `SkillManual`: group by category or trigger; show title, credited source, capability, and cadence/where-used fact.
- `AuthoredSkillGrid`: mark every card `Made by Grant`; show purpose, status, supported tools, and only a real public action.

For every non-blog record, link to `canonicalPath` only when `hasDetailPage` is true; otherwise link directly to its verified external destination or render the honest no-action state. Color is never the sole ownership signal. Unknown fields disappear without empty labels.

- [ ] **Step 5: Verify the indexes and responsive states**

Run:

```bash
npm run build
npm test -- tests/contracts/index-pages.test.ts
```

Expected: PASS with counts `23/4/4/5/3`, complete titles, authored grouping, and no launch search/filter UI.

Inspect Blog at all three baseline sizes, then each remaining index at desktop and phone beside the matching switched state in `index-family-approved.html`. Exclude preview switches and companion controls. Check full-page scanning rhythm and active rail context.

- [ ] **Step 6: Commit the index family**

```bash
git add src/layouts/CollectionIndexLayout.astro src/components/index src/styles/indexes.css src/pages/blog src/pages/app-library/index.astro src/pages/projects/index.astro src/pages/skill-library/index.astro src/pages/skills/index.astro tests/contracts/index-pages.test.ts
git commit -m "feat: build five collection indexes"
```

---

### Task 11: Build the Four Dossier Variants and ListWithMe Record

**Files:**
- Create: `src/layouts/DetailLayout.astro`
- Create: `src/components/detail/{RegistryLine,OwnershipStamp,ActionGroup,EvidencePanel,ScreenshotGallery,FactLedger,FieldNotes,ConnectedRecords}.astro`
- Create: `src/styles/details.css`
- Create: `src/assets/projects/listwithme/screenshots/{01-new-list,02-your-lists,03-groceries,04-activity}.png`
- Create: `src/pages/app-library/[slug]/index.astro`
- Create: `src/pages/projects/[slug]/index.astro`
- Create: `src/pages/skill-library/[slug]/index.astro`
- Create: `src/pages/skills/[slug]/index.astro`
- Create: `src/pages/listwithme/index.astro`
- Create: `src/lib/content/detail.ts`
- Create: `tests/contracts/detail-pages.test.ts`
- Modify: `src/content/projects/listwithme.md`
- Modify: `docs/design/media-sources.md`
- Verify: all 16 non-blog records created in Task 6

**Interfaces:**
- Consumes: validated non-blog records, `resolveRelationships`, `resolveLocalImage`, and the exact `DetailPageProps` interface from the Stable Interfaces section.
- Produces: `buildDetailPageProps(records, collectionLabel, record): DetailPageProps` and 16 expected dossier outputs unless a record cannot meet even the approved sparse minimum and a reviewed amendment changes the route fixture, with ListWithMe generated only at `/listwithme/` and its four-image App Store gallery stored and rendered locally.

- [ ] **Step 1: Write failing detail-route and anatomy tests**

Create `tests/contracts/detail-pages.test.ts`:

```ts
expect(await exists('dist/app-library/obsidian/index.html')).toBe(true);
expect(await exists('dist/projects/hermes-ios/index.html')).toBe(true);
expect(await exists('dist/listwithme/index.html')).toBe(true);
expect(await exists('dist/projects/listwithme/index.html')).toBe(false);
expect(detail('/listwithme/').$('[data-ownership]').text()).toContain('Made by Grant');
expect(detail('/app-library/obsidian/').$('[data-ownership]').text()).toContain('Used by Grant');
expect(detail('/listwithme/').$('a[href="https://apps.apple.com/us/app/listwithme/id1224284271"]')).toHaveLength(1);
expect(detail('/listwithme/').$('.fact-ledger > *').length).toBeGreaterThanOrEqual(4);
expect(detail('/skills/write-like-grant/').$('a[data-action="install"]')).toHaveLength(0);
expect(detail('/listwithme/').$('a[href="#"]')).toHaveLength(0);
expect(detail('/listwithme/').$('[data-record-number]').attr('data-record-number')).toBe('2');
expect(detail('/projects/drift-dreams/').$('[data-next-record]')).toHaveLength(0);
const listWithMeScreenshots = detail('/listwithme/').$('[data-app-screenshot]');
expect(listWithMeScreenshots).toHaveLength(4);
expect(listWithMeScreenshots.map((_, node) => $(node).attr('data-screenshot-device')).get()).toEqual(['iPhone', 'iPhone', 'iPhone', 'iPhone']);
expect(listWithMeScreenshots.find('source[type="image/avif"][srcset]')).toHaveLength(4);
expect(listWithMeScreenshots.find('source[type="image/webp"][srcset]')).toHaveLength(4);
expect(listWithMeScreenshots.find('img[alt]:not([alt=""])[width][height][loading="lazy"]')).toHaveLength(4);
for (const fixture of DETAIL_VARIANT_FIXTURES) {
  expect(detail(fixture.path).$('[data-field-note-key]').map((_, node) => $(node).attr('data-field-note-key')).get())
    .toEqual(fixture.expectedKeys);
}
for (const page of allDetailPages) {
  expect(page.$('[data-action-role="primary"]')).toHaveLength(page.expectedPrimaryCount);
  expect(page.$('[data-action-role="quiet"]').length).toBeLessThanOrEqual(2);
  expect(page.$('[data-connected-record]').length).toBeLessThanOrEqual(3);
}
```

`DETAIL_VARIANT_FIXTURES` contains one App Library, My App, Skill Library, and My Skills path plus the exact authored key sequence for that record; every key must belong to the variant's allowed Task 4 set, but a sparse page is not forced to synthesize all possible sections. Derive `expectedPrimaryCount` from validated content (`0` with `actionState`, otherwise `1`) rather than hard-coding a visual guess.

Use Astro's container API in the same test to render a synthetic two-section sparse record through the real component:

```ts
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import FieldNotes from '../../src/components/detail/FieldNotes.astro';

const container = await AstroContainer.create();
const sparseHtml = await container.renderToString(FieldNotes, {
  props: {
    notes: [
      { key: 'when-to-use', heading: 'When I reach for it', body: ['A substantive forty-character-or-longer test paragraph for the sparse state.'] },
      { key: 'design-decisions', heading: 'Why it stays small', body: ['Another substantive paragraph proving a valid sparse dossier renders honestly.'] },
    ],
  },
});
const $sparse = cheerio.load(sparseHtml);
expect($sparse('[data-field-note-key]').map((_, node) => $sparse(node).attr('data-field-note-key')).get())
  .toEqual(['when-to-use', 'design-decisions']);
```

Run: `npm test -- tests/contracts/detail-pages.test.ts`

Expected: FAIL because detail routes are missing.

- [ ] **Step 2: Implement shared dossier anatomy**

`DetailLayout.astro` renders, in order:

```text
Parent collection / record number
Made by Grant or Used by Grant text stamp
Title and first-person summary
One primary action when real, otherwise the honest no-action state; at most two quiet secondary links
One real evidence artifact when available
A target of four to six authored facts, with the approved sparse minimum of two and no invented values
An ordered real screenshot gallery when the project record provides one
Numbered field notes in a 68–72ch column
Optional desktop context ledger
Up to three named connected records
Back to collection and next record
```

At 821–1023px, keep the 210px rail but stack the dossier masthead and action area, place facts inline in document flow, and force the context ledger to `position: static`. Sticky context is allowed only at 1220px and wider.

`ActionGroup.astro` classifies `primary` and `install` as primary-role actions and `secondary` and `source` as quiet actions. It throws during rendering if it receives more than one primary-role action or more than two quiet actions, and emits `data-action-role` for the contract. `ConnectedRecords.astro` throws above three resolved records and marks each with `data-connected-record`. `OwnershipStamp.astro` always includes text in addition to blue/lime styling. `EvidencePanel.astro` renders nothing when no real media exists.

`ScreenshotGallery.astro` sorts by authored `order`, resolves each local asset through `resolveLocalImage`, and renders a labeled `<section data-screenshot-gallery>` after the fact ledger and before field notes. Each `<figure data-app-screenshot data-screenshot-device>` contains generated AVIF and WebP sources at widths no larger than the 1320px source plus a local PNG fallback with intrinsic dimensions, descriptive alt text, `loading="lazy"`, and `decoding="async"`. Use a four-column portrait grid at 1220px and wider, a two-column grid from 821–1219px, and a native horizontal scroll-snap row at 820px and below. Do not add a JavaScript carousel or hide screenshots behind a control.

`ActionGroup.astro` receives only action links (`primary`, `secondary`, `source`, or `install`). The ListWithMe Support and Privacy destinations render in a separately labeled utility-navigation region below the primary/source actions, so they remain discoverable without being miscounted as three secondary calls to action.

- [ ] **Step 3: Generate dynamic dossier paths**

Create `src/lib/content/detail.ts`. `buildDetailPageProps()` receives the complete published/generated collection already sorted by `displayOrder`, finds the target, returns a one-based `recordNumber`, total `recordCount`, supplied `collectionLabel`, and `nextRecord` as the following record's `{ title, canonicalPath }`. The last record returns `nextRecord: null`; do not wrap.

Each `[slug]/index.astro` exports `getStaticPaths()` from its one collection, filters drafts and `hasDetailPage: false`, and passes the record plus all four computed values. The Projects route includes ListWithMe when calculating order/count/next, then explicitly excludes it only from this dynamic path:

```ts
const visible = projects
  .filter((record) => !record.data.draft && record.data.hasDetailPage)
  .toSorted((a, b) => Number(a.data.displayOrder) - Number(b.data.displayOrder) || a.id.localeCompare(b.id));
return visible
  .filter((record) => record.id !== 'listwithme')
  .map((record) => ({
    params: { slug: record.data.slug },
    props: buildDetailPageProps(visible, COLLECTIONS.projects.label, record),
  }));
```

The other dynamic families use the same helper. `/listwithme/index.astro` loads `projects/listwithme` and calls the helper against the same complete `visible` Projects array, so it receives record 2 of 4 and HealthQL as next. Do not use a redirect for `/projects/listwithme/`; the route must not exist or be linked.

- [ ] **Step 4: Implement the four content variants**

- My App: render the authored `why-it-exists`, `what-it-does`, optional `how-it-was-built`, `what-i-learned`, and `current-state` sections.
- App Library: render `workflow`, `details-i-love`, `friction-and-limits`, and `who-it-suits`.
- Skill Library: render `trigger`, `inputs-and-outputs`, `example`, `guardrails`, `source`, and `what-i-adapted`, with visible source credit.
- My Skills: render `when-to-use`, `how-it-works`, `example`, `use-or-installation`, and `design-decisions`, exposing a public action only when real and never private material.

Task 6 owns the prose; Task 11 owns complete rendering of every authored key. `FieldNotes.astro` emits `data-field-note-key={note.key}`, follows the variant's canonical ordering, and never silently drops or synthesizes a section. Use the same components; vary labels and authored content, not page structure.

- [ ] **Step 5: Complete the ListWithMe exception**

`src/pages/listwithme/index.astro` loads only `projects/listwithme`. Ensure its record includes:

```yaml
links:
  - { label: Download on the App Store, href: https://apps.apple.com/us/app/listwithme/id1224284271, kind: primary }
  - { label: View source, href: https://github.com/glisom/ListWithMe, kind: source }
  - { label: Support, href: /listwithme/support/, kind: support }
  - { label: Privacy, href: /listwithme/privacy/, kind: privacy }
relationships:
  - { collection: blog, id: listwithme-returns, label: Wrote about }
  - { collection: blog, id: listwithme, label: Earlier chapter }
screenshots:
  - { src: projects/listwithme/screenshots/01-new-list.png, alt: 'ListWithMe New List sheet with a list-name field and the iPhone keyboard open.', decorative: false, device: iPhone, label: 'Create a list', order: 1 }
  - { src: projects/listwithme/screenshots/02-your-lists.png, alt: 'ListWithMe Your Lists screen with a Groceries card summarizing Eggs, Apples, and Bananas.', decorative: false, device: iPhone, label: 'Your lists', order: 2 }
  - { src: projects/listwithme/screenshots/03-groceries.png, alt: 'ListWithMe Groceries checklist with completed Bananas and a Send List button.', decorative: false, device: iPhone, label: 'Shared groceries', order: 3 }
  - { src: projects/listwithme/screenshots/04-activity.png, alt: 'ListWithMe Activity sheet showing items added and completed today.', decorative: false, device: iPhone, label: 'Recent activity', order: 4 }
```

Open the official App Store destination and `https://itunes.apple.com/lookup?id=1224284271&country=us` in the in-app browser before capture. Verify the returned app ID/title, take the four `screenshotUrls` in their returned order, request each source at the real `1320x2868bb.png` rendition, and save the untouched PNG bytes under the four exact local asset paths above. Verify each file is 1320×2868 and record the App Store URL, lookup URL, four resolved MZStatic source URLs, dimensions, and capture date `2026-09-02` in `docs/design/media-sources.md`. The reviewed launch gallery intentionally uses the four current iPhone screens and excludes the three visibly older iPad captures; do not hotlink either set at runtime.

Include iMessage-only discoverability, current compatibility, status, selected features, this exact real screenshot set, and the existing privacy summary. Do not invent a nonfunctional home-screen action. Extend the test to load `projects/listwithme` from the source graph and assert the exact four `src` values, order `1..4`, labels, nonempty alt text, `device: 'iPhone'`, and that `resolveLocalImage` finds every asset. A missing, reordered, remote, decorative, or silently dropped screenshot fails the detail gate.

- [ ] **Step 6: Verify dossier variants and visual behavior**

Run:

```bash
npm run build
npm test -- tests/contracts/detail-pages.test.ts tests/contracts/launch-content.test.ts
```

Expected: PASS; exact detail outputs; no `/projects/listwithme/`; action limits and ownership labels hold; all four reviewed ListWithMe screenshots render from local responsive assets in source order.

Compare ListWithMe at all three viewports with `detail-family-approved.html`. Compare one Used App, Used Skill, and My Skill against the mockup's switched states at desktop and phone. Exclude switcher and companion controls; verify sticky context only at 1220px and wider.

- [ ] **Step 7: Commit the dossier family**

```bash
git add src/layouts/DetailLayout.astro src/components/detail src/styles/details.css src/assets/projects/listwithme/screenshots docs/design/media-sources.md src/lib/content/detail.ts 'src/pages/app-library/[slug]' 'src/pages/projects/[slug]' 'src/pages/skill-library/[slug]' 'src/pages/skills/[slug]' src/pages/listwithme/index.astro src/content/projects/listwithme.md tests/contracts/detail-pages.test.ts
git commit -m "feat: build shared dossier detail pages"
```

---

### Task 12: Build About, ListWithMe Support and Privacy, and the 404 Page

**Files:**
- Create: `src/layouts/UtilityLayout.astro`
- Create: `src/styles/utility.css`
- Create: `src/pages/about/index.astro`
- Create: `src/pages/listwithme/support/index.astro`
- Create: `src/pages/listwithme/privacy/index.astro`
- Create: `src/pages/404.astro`
- Create: `tests/contracts/utility-pages.test.ts`
- Modify: `src/data/listwithme.ts`

**Interfaces:**
- Consumes: `BaseLayout`, `SITE`, `tests/fixtures/listwithme-legal.json`, the shared legal-semantic extractor, and the approved quieter About variation.
- Produces: four permanent utility HTML outputs with readable columns, correct navigation, and unchanged legal claims.

- [ ] **Step 1: Write failing utility-page contracts**

Create `tests/contracts/utility-pages.test.ts`:

```ts
expect(page('/about/').$('h1').text()).toBe("Hi, I'm Grant.");
expect(page('/about/').text()).not.toContain('RealWork Labs');
expect(page('/about/').text()).not.toContain('services');
expect(page('/listwithme/support/').$('[data-utility-content] a[href="mailto:grant.isom@gmail.com"]')).toHaveLength(1);
expect(page('/listwithme/support/').$('[data-utility-actions] a[href="/listwithme/"]')).toHaveLength(1);
expect(page('/listwithme/privacy/').text()).toContain('We do not collect any personal data.');
expect(page('/listwithme/privacy/').text()).toContain('Last updated: February 24, 2026');
expect(extractLegalHtml(page('/listwithme/support/').html())).toEqual(legalFixture.support);
expect(extractLegalHtml(page('/listwithme/privacy/').html())).toEqual(legalFixture.privacy);
expect(await exists('dist/404.html')).toBe(true);
expect(page('/404.html').$('[data-site-404]')).toHaveLength(1);
expect(page('/404.html').$('[data-404-actions] a[href="/blog/"]')).toHaveLength(1);
```

Run: `npm test -- tests/contracts/utility-pages.test.ts`

Expected: FAIL because these Astro pages are missing.

- [ ] **Step 2: Implement the quiet utility layout**

`UtilityLayout.astro` wraps `BaseLayout` with `railContext={{ kind: 'utility', title, parent }}`, uses a readable 68–72ch column, supports `lastUpdated`, optional section-anchor navigation, and imports `utility.css`. It retains the rail/mobile Browse system without evidence-card density.

- [ ] **Step 3: Build the personal About page**

Use one semantic H1 `Hi, I'm Grant.` and these exact section headings:

```text
Right now
A little background
Outside the screen
Find me elsewhere
```

Adapt the approved homepage personal note into first person. Mention app making, writing, software curiosity, Chicago, and work as one concise part of life. Do not reproduce the stale employer biography, a résumé timeline, services, testimonials, or client logos. Use one existing approved halftone accent; do not invent a portrait.

- [ ] **Step 4: Render Support and Privacy without changing their claims**

Render the section arrays from `src/data/listwithme.ts` into this exact contract:

```html
<h1 data-legal-title>...</h1>
<section data-legal-content><!-- only blocks represented by the frozen legal fixture --></section>
<nav data-utility-actions><!-- TOC, contact, and back links live outside preserved claims --></nav>
```

Preserve every heading, paragraph, ordered/unordered list, date, link label, destination, and block order captured in `listwithme-legal.json`, including iMessage-only discovery, local/iCloud storage, no analytics, no external servers, no third-party tracking SDKs, and the February 24, 2026 last-updated date. Add only section IDs, an on-page contents list, contact path, and `/listwithme/` back link outside `[data-legal-content]`.

Do not add decorative hero art to either page.

- [ ] **Step 5: Build a useful branded 404**

Create `src/pages/404.astro` with `noindex={true}`, one H1, a concise personal explanation, a stable `[data-site-404]` wrapper, and a `[data-404-actions]` region containing real links to Home, Blog, My Apps, and App Library. It must not mimic the homepage body and must not use a fake search box.

- [ ] **Step 6: Verify and commit utility pages**

Run:

```bash
npm run build
npm test -- tests/contracts/utility-pages.test.ts
```

Expected: PASS; exact four output files; the full normalized legal structure from both source and built HTML equals the same committed fixture; no stale employer framing.

```bash
git add src/layouts/UtilityLayout.astro src/styles/utility.css src/pages/about src/pages/listwithme/support src/pages/listwithme/privacy src/pages/404.astro src/data/listwithme.ts tests/contracts/utility-pages.test.ts
git commit -m "feat: add personal and utility pages"
```

---

### Task 13: Add Canonical Metadata, Full-Content RSS, Sitemap, Robots, and Social Art

**Files:**
- Create: `src/assets/social/default-og.png`
- Create: `src/lib/discovery/canonical.ts`
- Create: `src/lib/discovery/rss.ts`
- Create: `src/lib/discovery/xml.ts`
- Create: `src/pages/feed.xml.ts`
- Create: `src/pages/sitemap.xml.ts`
- Create: `src/pages/robots.txt.ts`
- Create: `tests/contracts/discovery.test.ts`
- Modify: `src/components/shell/SeoHead.astro`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: `SITE`, `buildRouteManifest`, published content, canonical paths, and the approved evidence-map asset.
- Produces: `resolveCanonicalUrl(canonicalPath: string, canonicalOverride?: string): string`, one canonical/metadata contract per HTML page, BlogPosting JSON-LD for all posts, full-content `/feed.xml`, exactly 48 canonical sitemap URLs, `/robots.txt`, and a reviewed 1200×630 fallback social image.

- [ ] **Step 1: Add the remaining exact RSS sanitization dependency**

Run:

```bash
npm install --save-exact sanitize-html@2.17.7
npm install --save-dev --save-exact @types/sanitize-html@2.16.1
```

Expected: package manifest and lockfile contain exactly those versions.

- [ ] **Step 2: Write failing discovery contracts**

Create `tests/contracts/discovery.test.ts` and parse generated HTML/XML:

```ts
import { readFile } from 'node:fs/promises';
import { resolveCanonicalUrl } from '../../src/lib/discovery/canonical';

const routeFixture = JSON.parse(await readFile(new URL('../fixtures/public-routes.json', import.meta.url), 'utf8'));
const expectedSitemapUrls = routeFixture.routes
  .filter((route: { inSitemap: boolean }) => route.inSitemap)
  .map((route: { canonicalPath: string }) => new URL(route.canonicalPath, 'https://grantisom.com').href);

expect(resolveCanonicalUrl('/projects/hermes-ios/')).toBe('https://grantisom.com/projects/hermes-ios/');
expect(resolveCanonicalUrl('/2026/09/01/vampire.html', 'https://example.com/original')).toBe('https://example.com/original');
expect(html('/').$('link[rel="canonical"]').attr('href')).toBe('https://grantisom.com/');
expect(html('/2026/09/01/vampire.html').$('script[type="application/ld+json"]')).toHaveLength(1);
expect(feed.items).toHaveLength(10);
expect(feed.items.every((item) => item.guid === item.link)).toBe(true);
expect(feed.items.every((item) => !/(?:href|src)="\//.test(item.content))).toBe(true);
expect(feed.items.every((item) => !/\{#[A-Za-z][\w:-]*\}/.test(item.content))).toBe(true);
expect(sitemap.locations).toHaveLength(48);
expect(sitemap.locations).toEqual(expectedSitemapUrls.toSorted());
expect(sitemap.locations.some((url) => url.includes('/uploads/'))).toBe(false);
expect(robots).toContain('Sitemap: https://grantisom.com/sitemap.xml');
expect(await imageSize('src/assets/social/default-og.png')).toEqual({ width: 1200, height: 630 });
```

Run: `npm test -- tests/contracts/discovery.test.ts`

Expected: FAIL because endpoints and the fallback asset are missing.

- [ ] **Step 3: Create and review the real fallback social image**

Use the built-in image-generation editor with `src/assets/evidence/evidence-map.png` attached and this exact prompt:

```text
Create a 1200 by 630 Open Graph image for GrantIsom.com using the attached approved evidence-map art as the visual source. Preserve the mineral-paper background, electric-blue halftone technical terrain, thin black rules, restrained editorial density, and square-cornered Evidence Index language. Integrate the exact text “Grant Isom” and “Writer · maker · tinkerer” with a Source Serif 4-style title and IBM Plex Mono-style small label. Keep all text fully legible inside a 72px safe area. Do not add logos, gradients, rounded marketing cards, extra icons, invented symbols, or new imagery.
```

Save the reviewed result as `src/assets/social/default-og.png`. Inspect it at original resolution; confirm exact spelling, safe-area clearance, correct palette, and no invented decorative elements. Regenerate if any text is malformed.

- [ ] **Step 4: Finish `SeoHead.astro`**

Create `src/lib/discovery/canonical.ts` so `resolveCanonicalUrl` returns `canonicalOverride ?? new URL(canonicalPath, SITE.origin).href`. Import that helper and `defaultSocialImage` from `../../assets/social/default-og.png` into `SeoHead.astro`, then build the image's absolute URL from Astro's emitted `src` plus `SITE.origin`. Only Blog records may supply the schema-validated HTTPS override. Emit exactly one absolute canonical, unique title/description, Open Graph and Twitter cards, RSS auto-discovery, and the fallback image when a record has no `socialImage`. For article pages emit JSON-LD:

```ts
const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: title,
  datePublished: publishedAt,
  ...(updatedAt ? { dateModified: updatedAt } : {}),
  author: { '@type': 'Person', name: SITE.name, url: SITE.origin },
  image: absoluteSocialImage,
  mainEntityOfPage: canonicalUrl,
};
```

Serialize JSON with `set:html={JSON.stringify(articleJsonLd).replace(/</g, '\\u003c')}`. Utility 404 uses `noindex`; public canonical pages do not.

- [ ] **Step 5: Generate full-content RSS with absolute internal URLs**

Create `src/lib/discovery/rss.ts`. `renderRssBody(body, postTitle)` must remove MDX imports; replace `<EmbedFrame src="URL" title="LABEL" />` with a normal Markdown link to `URL`; replace each deterministic `<Figure src="PATH" assetKey="KEY" alt="ALT" width={N} height={N} variant="..." />` with `![ALT](PATH)` while discarding only the build-only asset key; and remove final explicit heading suffixes such as ` {#deployed-id}` from Markdown heading lines. Render with one configured `markdown-it({ html: true, linkify: false, typographer: false })` instance so validated legacy inline HTML remains semantic before `sanitize-html` applies the explicit article-safe tag/attribute allowlist; then rewrite every root-relative `href` and `src` to `https://grantisom.com/...` using Cheerio. Add focused tests for an embed, a book-cover Figure, a preserved heading marker, a safe legacy inline-HTML fragment, and a root-relative article link so component syntax, escaped safe markup, or `{#...}` markers can never leak into RSS.

Create `src/pages/feed.xml.ts`:

```ts
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { comparePostsNewestFirst } from '../lib/content/date';
import { renderRssBody } from '../lib/discovery/rss';
import { SITE } from '../data/site';

export const GET: APIRoute = async (context) => {
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .toSorted(comparePostsNewestFirst)
    .slice(0, 10);
  return rss({
    title: `${SITE.name} — Blog`,
    description: SITE.description,
    site: context.site ?? new URL(SITE.origin),
    customData: '<language>en-us</language>',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.summary,
      pubDate: new Date(post.data.originalTimestamp ?? `${post.data.publishedAt}T12:00:00Z`),
      link: post.data.canonicalPath,
      content: renderRssBody(post.body ?? '', post.data.title),
    })),
  });
};
```

- [ ] **Step 6: Generate exact sitemap and robots endpoints**

Create `src/lib/discovery/xml.ts` with an XML escape helper covering `& < > " '`. `src/pages/sitemap.xml.ts` imports `loadContentGraph` from `src/lib/content/load.ts`, loads the graph, filters `buildRouteManifest(graph)` to `inSitemap`, sorts canonical paths, and emits absolute `<loc>` plus the best available `updatedAt`, `reviewedAt`, or `publishedAt` as `<lastmod>`. Static page last-modified date is the release content date `2026-09-02`; the pure discovery helpers do not import `astro:content`.

Create `src/pages/robots.txt.ts`:

```ts
export function GET() {
  return new Response('User-agent: *\nAllow: /\nSitemap: https://grantisom.com/sitemap.xml\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
```

- [ ] **Step 7: Verify discovery outputs and commit**

Run:

```bash
npm run build
npm test -- tests/contracts/discovery.test.ts
```

Expected: PASS; ten full-content feed items in newest-first order; all internal feed URLs absolute; sitemap exactly matches the 48 `inSitemap` route-oracle entries; no drafts, 404, discovery endpoints, or compatibility assets in sitemap.

```bash
git add package.json package-lock.json src/assets/social/default-og.png src/lib/discovery src/pages/feed.xml.ts src/pages/sitemap.xml.ts src/pages/robots.txt.ts src/components/shell/SeoHead.astro tests/contracts/discovery.test.ts
git commit -m "feat: add site metadata and discovery feeds"
```

---

### Task 14: Add Whole-Site Route, Link, Accessibility, Interaction, and Visual Verification

**Files:**
- Create: `playwright.config.ts`
- Create: `scripts/validate-built-site.mjs`
- Create: `scripts/crawl-site.mjs`
- Create: `scripts/compare-crawls.mjs`
- Create: `scripts/verify-local-preview.mjs`
- Create: `scripts/lib/crawl-policy.ts`
- Create: `scripts/serve-design-mockups.mjs`
- Create: `scripts/make-comparison.mjs`
- Create: `tests/helpers/build-contract.ts`
- Create: `tests/contracts/built-site.test.ts`
- Create: `tests/contracts/crawl-comparison.test.ts`
- Create: `tests/fixtures/crawl-policies.json`
- Create: `tests/e2e/public-routes.spec.ts`
- Create: `tests/e2e/navigation.spec.ts`
- Create: `tests/e2e/external-actions.spec.ts`
- Create: `tests/e2e/accessibility.spec.ts`
- Create: `tests/e2e/layout.spec.ts`
- Create: `tests/visual/{homepage,article,index,detail}.spec.ts`
- Create: `docs/design/baselines/**` after visual approval
- Create: `docs/qa/crawls/**`
- Modify: `package.json`

**Interfaces:**
- Consumes: `tests/fixtures/public-routes.json`, `legacy-assets.json`, `legacy-pages.json`, built `dist/`, frozen Vite reference, and three approved page-family mockups.
- Produces: `assertDistContract(distDir: URL, routes: readonly RouteContract[]): Promise<void>`, `crawlSite(baseUrl: URL, paths: readonly string[], concurrency?: number): Promise<CrawlResult[]>`, `buildCrawlPolicies(...)`, structured `compareCrawls(baseline, candidate, context): readonly CrawlDifference[]`, reviewed screenshot baselines, and `npm run verify:local-preview` as one managed command that builds, starts, recrawls, compares, and stops the candidate.

- [ ] **Step 1: Write the failing built-site contract**

Create `tests/contracts/built-site.test.ts` with these exact assertions:

```ts
expect(routeManifest).toHaveLength(52);
await expect(assertDistContract(dist, routeManifest)).resolves.toBeUndefined();
expect(await exists('dist/projects/listwithme/index.html')).toBe(false);
expect(await sha256File(file('dist/uploads/2023/f159196842.png'))).toBe(await sha256File(file('dist/images/f159196842.png')));
expect(renderedBlogPages).toHaveLength(23);
expect(allInternalLinks.every((link) => link.resolves)).toBe(true);
expect(allLocalImages.every((image) => image.resolves)).toBe(true);
expect(allHtml.every((page) => page.h1Count === 1)).toBe(true);
expect(allHtml.every((page) => page.canonicalCount === 1)).toBe(true);
expect(allRenderedHrefs).not.toContain('#');
```

Run: `npm test -- tests/contracts/built-site.test.ts`

Expected: FAIL because the helper and validator are missing.

- [ ] **Step 2: Implement deterministic dist validation**

`tests/helpers/build-contract.ts` exports:

```ts
export async function sha256File(file: URL): Promise<string>;
export async function inspectHtml(file: URL): Promise<HtmlContract>;
export async function assertDistContract(distDir: URL, routes: readonly RouteContract[]): Promise<void>;
```

`scripts/validate-built-site.mjs` must fail on:

1. Any missing oracle output or asset.
2. Any extra generated `/projects/listwithme/` route.
3. Broken internal page, image, script, stylesheet, or fragment references.
4. A missing or duplicate-on-page H1/canonical/title/description/Open Graph field, or a title/description value reused across two canonical HTML pages.
5. A new page loading dormant `/css/main.css` or `/assets/js/darkmode.js`.
6. Any `href="#"` action.
7. Any rendered `<img>` missing `alt`, or using empty alt without the component's explicit decorative marker.
8. Feed/sitemap/robots XML contract drift.
9. Any migrated heading ID or semantic article content outside the five path/field/occurrence-scoped transforms in `migration-allowances.json`.
10. Any article `<picture>` missing AVIF/WebP `srcset`, bounded `sizes`, intrinsic dimensions, a resolving `/_astro/` derivative, or its original resolving `/images/` fallback.

Update `package.json`:

```json
"validate:dist": "node scripts/validate-built-site.mjs",
"build:astro": "astro check && astro build",
"build": "npm run validate:source && npm run build:astro && npm run validate:dist",
"test:dist": "vitest run tests/contracts/built-site.test.ts"
```

Run: `npm run build && npm run test:dist`.

Expected: PASS for 52 route artifacts, 24 legacy asset entries, 23 blog pages, and all HTML contracts.

- [ ] **Step 3: Implement baseline and candidate crawls**

`crawlSite()` fetches the union of all `public-routes.json` canonical paths and `legacy-assets.json` asset paths with bounded concurrency and records `requestedPath`, status, final URL, canonical when HTML, content type, title/description when HTML, sorted local links/assets, structured article semantics when applicable, candidate embed contracts, and a response-body SHA-256. Deduplicate and sort requested paths; normalize equivalent URLs; sort every emitted array; and omit fetch timestamps, durations, headers, and other volatile values so identical sites produce byte-identical JSON.

Create `scripts/lib/crawl-policy.ts` with:

```ts
export type CrawlPolicy =
  | { path: string; mode: 'legacy-post'; allowanceIds: readonly string[] }
  | { path: string; mode: 'legal-parity'; fixtureKey: 'support' | 'privacy' }
  | { path: string; mode: 'redesigned-existing' }
  | { path: string; mode: 'new-route' }
  | { path: string; mode: 'discovery'; baselineStatus: 200 | 404; expectedContentType: string }
  | { path: string; mode: 'preserved-asset'; expectedSha256: string }
  | { path: string; mode: 'repaired-asset'; expectedSha256: string; aliasOf: string };

export interface CrawlDifference {
  path: string;
  policy: CrawlPolicy['mode'];
  field: string;
  baseline: unknown;
  candidate: unknown;
  message: string;
}

export function buildCrawlPolicies(routes, assets, config): readonly CrawlPolicy[];
export function compareCrawls(baseline, candidate, context): readonly CrawlDifference[];
```

Create `tests/fixtures/crawl-policies.json` with these explicit path groups:

```json
{
  "redesignedExisting": ["/", "/projects/", "/about/", "/listwithme/", "/404.html"],
  "legalParity": {
    "/listwithme/support/": "support",
    "/listwithme/privacy/": "privacy"
  },
  "newRoutes": [
    "/blog/", "/app-library/", "/skill-library/", "/skills/",
    "/app-library/obsidian/", "/app-library/codex/", "/app-library/hermes-agent/", "/app-library/superhuman/",
    "/projects/hermes-ios/", "/projects/healthql/", "/projects/drift-dreams/",
    "/skill-library/deep-research/", "/skill-library/browser-control/", "/skill-library/frontend-design/", "/skill-library/documents/", "/skill-library/pdf/",
    "/skills/write-like-grant/", "/skills/goodreads-export/", "/skills/hatch-pet/"
  ],
  "discovery": {
    "/feed.xml": { "baselineStatus": 200, "expectedContentType": "application/xml" },
    "/sitemap.xml": { "baselineStatus": 200, "expectedContentType": "application/xml" },
    "/robots.txt": { "baselineStatus": 404, "expectedContentType": "text/plain" }
  }
}
```

Derive 23 `legacy-post` policies from `RouteContract.kind === 'post'`, derive `repaired-asset` from `aliasOf`, and classify all other compatibility assets as `preserved-asset`. Resolve each legacy post's exact allowance IDs from the structured migration fixture. Reject duplicate, unknown, or uncovered paths; the result must contain exactly 76 unique policies: 52 public artifacts plus 24 compatibility assets.

Policy behavior is exact: legacy posts require 200 HTML, stable final/canonical path, and deep-equal article semantics after only their declared occurrence-counted transforms; legal pages must equal `listwithme-legal.json`; redesigned existing pages require baseline/candidate 200 HTML and the candidate canonical; new routes require baseline 404 and candidate 200 HTML with the expected canonical; discovery requires the declared baseline status and candidate 200/media type while Task 13 validates payload semantics; preserved assets require both 200 and the fixture hash; repaired aliases require baseline 404, candidate 200, and the target's expected hash. For the Spotify post only, capture exactly four marked embed/fallback contracts, verify title, lazy loading, source-equal fallback URL, and exact `Open {title}` text, then remove only those marked fallback nodes from a cloned semantic root before comparing prose text/links; an unmarked, extra, or altered node remains a parity failure. No whole-page semantic digest is compared across the new shell.

Create `tests/contracts/crawl-comparison.test.ts` to assert 76 unique complete policies; missing/duplicate-policy failures; an allowed Notion replacement; a valid four-embed Spotify upgrade; rejection of changed fallback text, an extra fallback link, or any unmarked prose/link addition; rejection of one undeclared article text change; acceptance of an intentionally redesigned body; rejection of a redesigned page returning 500; rejection when a new route was already 200 in the baseline; and detection of a changed compatibility hash.

Add:

```json
"crawl:production": "node scripts/crawl-site.mjs https://grantisom.com docs/qa/crawls/production-before.json",
"crawl:preview": "node scripts/crawl-site.mjs http://127.0.0.1:4321 docs/qa/crawls/astro-preview.json",
"compare:crawls": "node scripts/compare-crawls.mjs docs/qa/crawls/production-before.json docs/qa/crawls/astro-preview.json",
"verify:local-preview": "node scripts/verify-local-preview.mjs"
```

`verify-local-preview.mjs` runs the build, starts `astro preview` on an available loopback port, waits for readiness, captures fresh production and candidate crawls, invokes the structured comparison, and always terminates the child server in `finally`. It exits nonzero on any difference. This is the only release-gate local crawl command, so visual fixes cannot leave a stale candidate fixture behind.

Run:

```bash
npm test -- tests/contracts/crawl-comparison.test.ts
npm run verify:local-preview
```

Expected: every path has one policy, the fresh comparison emits zero differences, and no preview process remains.

- [ ] **Step 4: Configure browser tests but do not run them without the browser-control approval gate**

Create `playwright.config.ts` with Chromium projects at desktop 1586×992, tablet 1024×768, and phone 390×844, plus a `mid-layout` project at 900×900 whose `testMatch` includes only `tests/e2e/layout.spec.ts`. The candidate `baseURL` is `process.env.PREVIEW_ORIGIN ?? 'http://127.0.0.1:4321'`. Locally use three servers: Astro preview at 4321, frozen Vite at 4173, and `scripts/serve-design-mockups.mjs` at 4174. When `PREVIEW_ORIGIN` is present, omit only the Astro `webServer` entry and retain the two local reference servers. Set `retries: 0`, `fullyParallel: false`, and preserve traces only on failure.

The three `webServer` entries use these literal commands and readiness URLs:

```ts
webServer: [
  { command: 'npm run preview -- --host 127.0.0.1 --port 4321', url: 'http://127.0.0.1:4321/', reuseExistingServer: !process.env.CI },
  { command: 'npm --prefix design-reference/vite-homepage run dev -- --host 127.0.0.1 --port 4173', url: 'http://127.0.0.1:4173/', reuseExistingServer: !process.env.CI },
  { command: 'node scripts/serve-design-mockups.mjs --host 127.0.0.1 --port 4174', url: 'http://127.0.0.1:4174/article-family-approved.html', reuseExistingServer: !process.env.CI },
],
```

Add:

```json
"prepare:browser-tests": "npm run build && npm --prefix design-reference/vite-homepage ci",
"test:e2e": "npm run prepare:browser-tests && playwright test tests/e2e",
"test:visual": "npm run prepare:browser-tests && playwright test tests/visual --project=desktop --project=tablet --project=phone",
"test:all": "npm run build && npm test && npm run test:dist && npm run test:e2e"
```

Before the first Playwright run, explicitly confirm automated browser control with Grant. If approved, install only Chromium with `npx playwright install chromium`.

- [ ] **Step 5: Test routes, navigation, interaction, and accessibility**

`public-routes.spec.ts` requests all 51 non-error oracle paths and expects status 200, deriving content type independently: `text/html` for pages/posts, XML for feed/sitemap, and plain text for robots. It loads `/404.html` separately, asserts the designed 404 body and `noindex` regardless of the preview server's direct-file status, then asserts `/definitely-missing` returns HTTP 404 with that same designed body rather than homepage HTML. `navigation.spec.ts` covers homepage→article, article→Blog, previous/next, RSS, ListWithMe→Support/Privacy, desktop active navigation, and mobile Browse by keyboard and touch.

`accessibility.spec.ts` runs axe with WCAG 2 A/AA, WCAG 2.1/2.2 AA, and best-practice tags on one representative page per layout family and requires an empty `violations` array at every impact level. It asserts logical keyboard order; visible computed focus indicators on representative paper, blue, lime, and black surfaces; captions associated with figures; and that information/action labels visible at touch width do not appear only after hover.

At the 390px phone project, enumerate every visible `a`, `button`, `summary`, and form control—including prose links—and require a rendered hit rectangle at least 44×44px. Emulate `prefers-reduced-motion: reduce` and assert computed nonessential animation/transition durations are zero and smooth scrolling is disabled. On a comments-enabled article, intercept Utterances network traffic, prove no Utterances script/request exists before its region nears the viewport, then scroll to the region and prove exactly one lazy request occurs. Verify every iframe has `loading="lazy"` and a linked fallback.

Every E2E test installs listeners for `console.error`, uncaught `pageerror`, and failed same-origin requests before navigation and fails with the accumulated diagnostics. Third-party actions/embeds are intercepted explicitly; they are never silently ignored. `layout.spec.ts` asserts:

```ts
expect(Math.abs(actualRailWidth - expectedRailWidth)).toBeLessThanOrEqual(1);
expect(Math.abs(actualPrimaryLeft - expectedPrimaryLeft)).toBeLessThanOrEqual(4);
expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
expect(await page.locator('[data-utility-label]').evaluateAll((nodes) => nodes.every((node) => {
  const size = Number.parseFloat(getComputedStyle(node).fontSize);
  return size >= 10 && size <= 12;
}))).toBe(true);
```

Test mobile Browse open, primary-action keyboard focus, and expanded article TOC.

In the dedicated 900×900 `mid-layout` project, test representative Article, Index, and Detail pages. Assert the 210px rail is visible and the mobile header is hidden; masthead grid computation is one column; article/detail facts appear in normal inline flow; article contents precede the prose visually; detail context computes to non-sticky positioning; and no page overflows horizontally. Keep the approved pixel-comparison projects at 1586×992, 1024×768, and 390×844—the 900px state is a semantic/layout contract, not a new design-reference snapshot.

`external-actions.spec.ts` intercepts rather than depends on App Store, GitHub, and product-site uptime. Activate by pointer and keyboard: ListWithMe's exact App Store primary action; its GitHub source link; one App Library official-product link; one Skill Library source link when present; and one quiet secondary link. Assert the attempted URL, accessible name, primary/quiet role, and safe new-tab `rel` values where applicable. This exercises real authored destinations without sending a live request.

- [ ] **Step 6: Create same-frame visual comparisons before accepting snapshots**

Capture implementation and source at identical viewports/states. `scripts/make-comparison.mjs` uses Sharp to place source and implementation side by side at original resolution with only a narrow labeled divider. Produce comparisons for:

```text
Homepage: Vite #top at desktop/tablet/phone
Article: approved ListWithMe mockup at desktop/tablet/phone
Index: approved Blog mockup at desktop/tablet/phone; four variants at desktop/phone
Detail: approved ListWithMe mockup at desktop/tablet/phone; three other variants at desktop/phone
Interactions: mobile Browse open; keyboard focus; expanded TOC
```

Inspect each combined image, fix visible mismatches in the owning task's files, and regenerate until rail/header is within 1px, primary bounds/gutters within 4px, type family/weight exact, image crop visibly matched, and there is no clipped copy, unintended wrap, missing rule, broken aspect ratio, or page overflow. Commit each implementation correction immediately as a focused `fix:` commit with its owning source and contract files before accepting or staging QA baselines; Task 14's final QA commit must not hide source changes.

- [ ] **Step 7: Commit approved baselines only after visual review**

Pixel baselines are canonical only on Grant's macOS arm64 host with the pinned Playwright Chromium build; Ubuntu CI runs the semantic, geometry, interaction, and accessibility suite but does not compare platform-sensitive pixels. Record OS, architecture, Chromium revision, route, viewport, state, and source checksum in the baseline manifest. After Grant approves the combined implementation captures on that canonical host, run:

```bash
npm run test:visual -- --update-snapshots
npm run test:visual
```

Expected: zero unreviewed screenshot differences on the recorded canonical host. Copy the approved viewport and full-page comparison artifacts into `docs/design/baselines/`; `test:visual` fails early with an explanatory platform mismatch on any other host instead of comparing incompatible raster output.

- [ ] **Step 8: Run the complete release-candidate gate**

Run:

```bash
npm ci
npm run format:check
npm run check
npm run build
npm test
npm run test:dist
npm run test:e2e
npm run test:visual
npm run migrate:posts:check
npm run verify:local-preview
git diff --check
git status --short
```

Expected: every command passes; status contains only intended QA artifacts before commit.

- [ ] **Step 9: Commit whole-site verification**

```bash
git add package.json package-lock.json playwright.config.ts scripts/validate-built-site.mjs scripts/crawl-site.mjs scripts/compare-crawls.mjs scripts/verify-local-preview.mjs scripts/lib/crawl-policy.ts scripts/serve-design-mockups.mjs scripts/make-comparison.mjs tests/fixtures/crawl-policies.json tests/helpers tests/contracts/built-site.test.ts tests/contracts/crawl-comparison.test.ts tests/e2e tests/visual docs/design/baselines docs/qa/crawls
git commit -m "test: verify the complete Astro site"
```

---

### Task 15: Prepare the Reversible GitHub Pages Cutover

**Files:**
- Create: `.github/workflows/astro-ci.yml`
- Create: `.github/workflows/pages.yml`
- Create: `scripts/hash-dist.mjs`
- Create: `scripts/verify-isolated-preview.mjs`
- Create during the approved preview gate, before deployment: `docs/qa/dist-manifest.json`
- Create after approved preview deployment: `docs/qa/preview-manifest.json`
- Create after production acceptance: `docs/qa/crawls/astro-production.json`
- Create: `tests/contracts/isolated-preview.test.ts`
- Modify: `README.md`
- Modify: `.gitignore`
- Preserve unchanged until post-production approval: `.ruby-version`, `Gemfile`, `Gemfile.lock`, `Rakefile`, `_config.yml`, `_includes/`, `_layouts/`, `_pages/`, `_posts/`, `_sass/`, root `index.html`, `404.md`, `feed.xml`, `sitemap.xml`, `favicon.ico`, `CNAME`, `css/`, `images/`, `assets/`

**Interfaces:**
- Consumes: clean release-candidate branch, passing Task 14 gate, `dist/CNAME`, and explicit approval for every external GitHub action.
- Produces: read-only pull-request CI, a reproducible GitHub Pages artifact/deploy workflow, a mandatory HTTPS isolated-preview gate tied to the reviewed `dist/`, a preserved pre-cutover Jekyll branch/tag, a verified production deployment, and a no-DNS-change rollback path.

- [ ] **Step 1: Add read-only pull-request CI**

Create `.github/workflows/astro-ci.yml`:

```yaml
name: Astro CI

on:
  pull_request:
  workflow_dispatch:

permissions:
  contents: read

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 24.20.0
          cache: npm
      - run: npm install --global npm@11.19.0
      - run: test "$(node --version)" = "v24.20.0" && test "$(npm --version)" = "11.19.0"
      - run: npm ci
      - run: npm run format:check
      - run: npm run check
      - run: npm run build
      - run: npm test
      - run: npm run test:dist
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
```

This workflow has no `pages`, `id-token`, write, or deployment permission. It runs semantic/layout/accessibility browser checks only; platform-sensitive visual snapshots remain a required canonical-Mac release gate. Add the browser steps only after the Task 14 automation approval; Task 15 must not precede that gate.

- [ ] **Step 2: Add the reproducible GitHub Pages workflow**

Create `.github/workflows/pages.yml` using the current official GitHub actions. Use an explicit `npm ci` build instead of the `withastro/action` composite's `npm install`, so deployment consumes the reviewed lockfile exactly:

```yaml
name: Deploy Astro to GitHub Pages

on:
  push:
    branches: [master]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 24.20.0
          cache: npm
      - uses: actions/configure-pages@v5
      - run: npm install --global npm@11.19.0
      - run: test "$(node --version)" = "v24.20.0" && test "$(npm --version)" = "11.19.0"
      - run: npm ci
      - run: npm run build
      - run: test "$(tr -d '\r\n' < dist/CNAME)" = "grantisom.com"
      - uses: actions/upload-pages-artifact@v5
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v5
```

This follows Astro's static-output deployment model and GitHub Pages' official custom-workflow artifact/deploy contract. Do not push this workflow or change Pages settings yet.

- [ ] **Step 3: Replace README content with operating instructions**

Document:

```text
Node 24.20.0 / npm 11.19.0
npm ci
npm run dev
npm run build
npm run test:all
Frozen reference: design-reference/vite-homepage (port 4173)
Astro preview: repository root (port 4321)
Content collection locations and exact dated-route rule
GitHub Pages deployment and rollback branch
Light-only launch and dormant legacy asset policy
```

Do not describe Jekyll as the active implementation after cutover.

- [ ] **Step 4: Add exact-artifact isolated-preview verification**

`scripts/hash-dist.mjs` recursively sorts every regular file under a root, records `{ relativePath, sha256 }`, and hashes that ordered list into one `distDigest`. Its default root is `dist/`; `--root <directory>` selects a disposable byte-for-byte copy without changing the relative paths recorded in the manifest. It accepts a required manifest path in write mode or `--check <manifest>` in check mode. Symlinks, unreadable files, duplicate normalized paths, and `.DS_Store` fail rather than disappear silently.

`scripts/verify-isolated-preview.mjs` requires both `PREVIEW_ORIGIN` and `ARTIFACT_COMMIT_SHA`. It rejects non-HTTPS URLs, credentials, paths, query/fragment values, localhost, loopback/private IP literals, `grantisom.com`, and `www.grantisom.com`; validates that the SHA is a full commit ID equal to `HEAD`; refuses staged or tracked worktree changes and any untracked path other than the freshly generated `docs/qa/dist-manifest.json`; and checks that the manifest digest equals a fresh digest of local `dist/`. It fetches every file from `docs/qa/dist-manifest.json` by relative path and checks response bytes, then runs the same 76-policy route/asset crawl and structured comparison as Task 14. Only after every check passes does it write `docs/qa/preview-manifest.json`:

```json
{
  "origin": "https://unique-preview-host.example",
  "artifactCommitSha": "reviewed commit that produced dist",
  "distDigest": "aggregate digest from dist-manifest"
}
```

Export a pure verifier that accepts an injected `fetch` implementation, while the executable CLI always supplies the real global `fetch` and exposes no origin-policy bypass. Create `tests/contracts/isolated-preview.test.ts` with an HTTPS `.test` origin and a deterministic injected fetch fixture proving invalid origins are rejected, a one-byte remote difference fails, every manifest file is requested, a missing route fails the crawl, and matching bytes/policies pass. Also copy a two-file fixture to a temporary root and prove `hash-dist.mjs --root <copy> --check <manifest>` passes before a tooling-only file is added and fails afterward. Add:

```json
"hash:dist": "node scripts/hash-dist.mjs",
"verify:isolated-preview": "node scripts/verify-isolated-preview.mjs"
```

Add `.vercel/` to `.gitignore`; preview project metadata is local tooling state, never source or part of the canonical `dist/` artifact. The deployment step below gives Vercel a disposable copy because project linking may add `.vercel/` and `.gitignore` inside the directory passed to the CLI.

Run: `npm test -- tests/contracts/isolated-preview.test.ts`

Expected: PASS without contacting or creating an external preview.

- [ ] **Step 5: Verify workflow files locally and commit without publishing**

Run the Task 14 complete gate once more, then:

```bash
git add .github/workflows/astro-ci.yml .github/workflows/pages.yml README.md .gitignore package.json package-lock.json scripts/hash-dist.mjs scripts/verify-isolated-preview.mjs tests/contracts/isolated-preview.test.ts
git commit -m "ci: prepare Astro GitHub Pages deployment"
git status --short
```

Expected: clean worktree. No push or external state change has occurred.

- [ ] **Step 6: Reconcile production immediately before release**

After Grant approves publishing the implementation branch, rebuild before starting any candidate server:

```bash
git fetch origin --tags
git rebase origin/master
npm ci
npm run test:all
npm run test:visual
npm run verify:local-preview
```

The managed local verifier builds first, starts the resulting preview, writes both fresh crawls, compares, and stops it. If the crawler fixtures change, review the semantic diff rather than accepting it mechanically. If Jekyll content changed upstream, repeat Tasks 2, 3, 5, and the affected visual checks before continuing, then intentionally refresh and commit the crawl fixtures before rerunning this gate. Begin a short content freeze only after the rebase passes and the crawl fixtures are clean.

- [ ] **Step 7: Create a recoverable Jekyll release point with explicit approval**

Resolve the exact pre-Astro production commit and show it to Grant. After approval:

```bash
set -euo pipefail
export JEKYLL_PRODUCTION_SHA="$(git rev-parse origin/master)"
if git show-ref --verify --quiet refs/remotes/origin/legacy-jekyll; then test "$(git rev-parse refs/remotes/origin/legacy-jekyll)" = "$JEKYLL_PRODUCTION_SHA"; fi
if git show-ref --verify --quiet refs/heads/legacy-jekyll; then test "$(git rev-parse refs/heads/legacy-jekyll)" = "$JEKYLL_PRODUCTION_SHA"; else git branch legacy-jekyll "$JEKYLL_PRODUCTION_SHA"; fi
if git show-ref --verify --quiet refs/tags/pre-astro-cutover-2026-09-02; then test "$(git rev-parse pre-astro-cutover-2026-09-02^{})" = "$JEKYLL_PRODUCTION_SHA"; else git tag pre-astro-cutover-2026-09-02 "$JEKYLL_PRODUCTION_SHA"; fi
test "$(git rev-parse legacy-jekyll)" = "$JEKYLL_PRODUCTION_SHA"
test "$(git rev-parse pre-astro-cutover-2026-09-02^{})" = "$JEKYLL_PRODUCTION_SHA"
git push origin legacy-jekyll
git push origin pre-astro-cutover-2026-09-02
```

Expected: absent refs are created; existing refs are accepted only when their resolved SHA already matches. Any mismatch stops for review rather than moving a recovery ref. Both references point to the same pre-Astro Jekyll commit. DNS is unchanged.

- [ ] **Step 8: Open the release for review and wait for CI**

With approval, push `rebuild/astro`, open a pull request to `master`, and confirm Astro CI passes. Do not merge on failing route, legal, accessibility, feed, sitemap, or layout checks.

- [ ] **Step 9: Deploy and verify the mandatory isolated preview with explicit approval**

Stop and ask Grant to authorize the preview deployment. Invoke `vercel:vercel-cli` for the current official workflow. Use Vercel only as an isolated preview host—not production—do not pass `--prod`, do not attach `grantisom.com` or any custom domain, and do not change the repository's GitHub Pages configuration.

From the reviewed, clean artifact commit:

```bash
set -euo pipefail
npm run build
npm run hash:dist -- docs/qa/dist-manifest.json
ARTIFACT_COMMIT_SHA="$(git rev-parse HEAD)"
export ARTIFACT_COMMIT_SHA
PREVIEW_DEPLOY_DIR="$(mktemp -d "${TMPDIR:-/tmp}/grantisom-astro-preview.XXXXXX")"
export PREVIEW_DEPLOY_DIR
test -d "$PREVIEW_DEPLOY_DIR"
rsync -a dist/ "$PREVIEW_DEPLOY_DIR"/
npm run hash:dist -- --root "$PREVIEW_DEPLOY_DIR" --check docs/qa/dist-manifest.json
PREVIEW_VERCEL_CONFIG_DIR="$(mktemp -d "${TMPDIR:-/tmp}/grantisom-vercel-config.XXXXXX")"
export PREVIEW_VERCEL_CONFIG_DIR
PREVIEW_ORIGIN="$(
  env -u VERCEL_TOKEN -u VERCEL_ORG_ID -u VERCEL_PROJECT_ID -u VERCEL_TEAM_ID \
    npx --yes vercel@59.11.2 deploy "$PREVIEW_DEPLOY_DIR" \
      --global-config "$PREVIEW_VERCEL_CONFIG_DIR" --temporary --archive=tgz --json |
  node --input-type=module -e '
    let raw = "";
    for await (const chunk of process.stdin) raw += chunk;
    const payload = JSON.parse(raw);
    const value = payload?.deployment?.url ?? payload?.url;
    if (typeof value !== "string" || value.length === 0) throw new Error("Vercel JSON did not contain a deployment URL");
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    if (url.protocol !== "https:") throw new Error(`Unexpected Vercel protocol: ${url.protocol}`);
    process.stdout.write(url.origin);
  '
)"
export PREVIEW_ORIGIN
npm run hash:dist -- --check docs/qa/dist-manifest.json
npm run verify:isolated-preview
PREVIEW_ORIGIN="$PREVIEW_ORIGIN" npm run test:e2e
PREVIEW_ORIGIN="$PREVIEW_ORIGIN" npm run test:visual
```

Expected: the empty isolated global-config directory and cleared Vercel environment prevent the CLI from reusing Grant's authenticated project state; `--temporary` creates an anonymous, expiring HTTPS host without attaching an existing project or domain. Explicit JSON parsing is required because agent-aware Vercel output is a structured envelope rather than a bare URL. Vercel may add local tooling metadata only to `PREVIEW_DEPLOY_DIR`, while the second manifest check proves canonical `dist/` did not change. Every manifest byte, all 52 route contracts, all 24 compatibility assets, legal parity, accessibility, interactions, and canonical-Mac visual comparisons pass. `preview-manifest.json` records `ARTIFACT_COMMIT_SHA` and the exact digest. Grant reviews the remote comparison captures. Both disposable directories live outside the repository and can be left for the operating system's temporary-file cleanup after review.

Commit only the two QA manifests, then prove the QA-only commit did not change output:

```bash
git add docs/qa/dist-manifest.json docs/qa/preview-manifest.json
git commit -m "test: record isolated Astro preview"
npm run build
npm run hash:dist -- --check docs/qa/dist-manifest.json
git diff --name-only HEAD^..HEAD
```

Expected: the final command lists only the two QA manifests. If preview hosting is not authorized or any remote check fails, cutover remains blocked; localhost cannot satisfy this gate.

With the same branch-push approval, push the QA-only commit and wait for the pull request's Astro CI to pass again before requesting merge approval.

- [ ] **Step 10: Change GitHub Pages source and merge only with explicit approval**

Immediately before merge, Grant changes repository Settings → Pages → Build and deployment → Source to **GitHub Actions**. Then merge the approved pull request. This is the only switch from the still-live Jekyll deployment to the Astro workflow.

Expected: `pages.yml` publishes the `dist/` artifact and `dist/CNAME` retains `grantisom.com`.

- [ ] **Step 11: Run the production acceptance crawl**

After deployment completes:

```bash
node scripts/crawl-site.mjs https://grantisom.com docs/qa/crawls/astro-production.json
node scripts/compare-crawls.mjs docs/qa/crawls/production-before.json docs/qa/crawls/astro-production.json
node --input-type=module -e "const response=await fetch('https://grantisom.com/definitely-missing',{redirect:'manual'}); const html=await response.text(); if (response.status !== 404 || !html.includes('data-site-404') || !html.includes('name=\"robots\"') || !html.includes('noindex')) throw new Error('Production missing-route contract failed: '+response.status);"
node --input-type=module -e "const path='/2026/02/24/listwithme-returns.html'; const response=await fetch('https://www.grantisom.com'+path,{redirect:'manual'}); const location=response.headers.get('location'); if (![301,308].includes(response.status) || location !== 'https://grantisom.com'+path) throw new Error('Unexpected www redirect: '+response.status+' '+location);"
```

Verify all 52 oracle paths, all 24 compatibility asset paths, apex HTTPS canonicals, RSS and sitemap XML, the explicit `www` status/location assertion, useful missing-route response, and no failed internal requests. Confirm GitHub Pages reports the workflow deployment successful.

After every acceptance check passes, preserve the fresh production crawl locally and restore a clean worktree:

```bash
git add docs/qa/crawls/astro-production.json
git commit -m "test: record Astro production acceptance"
git status --short
```

Expected: the commit contains only the production crawl and status is clean. Do not push this post-deployment evidence commit without a separate explicit approval.

- [ ] **Step 12: Preserve rollback and defer legacy cleanup**

If production acceptance fails, switch Pages back to branch deployment from `legacy-jekyll`; no DNS change is needed. Keep the pre-cutover tag immutable.

Do not remove legacy Jekyll source in this release. After Astro production is approved and stable, propose a separate cleanup commit that removes duplicated root Jekyll files only after confirming their equivalents under `src/` and `public/`. That cleanup requires a new explicit approval and retains the `legacy-jekyll` branch and tag.

---

## Spec Coverage Matrix

| Spec section | Implemented and verified by |
|---|---|
| 1–4 Purpose, approved decisions, visual references, experience principles | Global Constraints; Tasks 1, 6–12, 14 |
| 5 Visual system | Tasks 7–12; Task 14 same-frame QA |
| 6 Information architecture and routes | Tasks 2, 4–6, 9–14 |
| 7 Shared shell | Task 7; Task 14 navigation/accessibility |
| 8 Homepage and About | Tasks 8 and 12 |
| 9 Article family | Task 9; Task 14 representative fixtures |
| 10 Collection index family | Task 10; Task 14 variants |
| 11 Detail family and sparse behavior | Tasks 6 and 11 |
| 12 Content architecture | Tasks 4–6 |
| 13 Astro component boundaries | File Responsibility Map; Tasks 7–12 |
| 14 Historical migration | Tasks 2, 3, 5, 9, 14 |
| 15 Metadata, discovery, feeds | Task 13; Task 14 XML assertions |
| 16 Failure and edge cases | Tasks 4–6 and 14 |
| 17 Accessibility | Tasks 7, 9–12, 14 |
| 18 Verification strategy | Task 14 |
| 19 Deployment and cutover | Task 15 |
| 20 Deferred scope | Global Constraints; no implementation task adds deferred features |

---

## Final Acceptance Checklist

- [ ] Frozen Vite reference checksums pass and it still runs independently on port 4173.
- [ ] Astro builds from a clean `npm ci` with Node 24.20.0 and npm 11.19.0.
- [ ] All five content collections validate with counts `23/4/4/5/3`.
- [ ] All 52 public artifact contracts and 24 legacy asset contracts pass.
- [ ] Sitemap contains exactly 48 canonical HTML routes; feed contains the latest ten full-content posts.
- [ ] Every historical heading ID, semantic article body, code block, image, link, and Spotify source is preserved within the five approved path-scoped transforms.
- [ ] Every published article renders two or three manually authored related records, with no tag-inferred relationships.
- [ ] ListWithMe renders the four reviewed iPhone screenshots from local responsive assets in the official App Store order.
- [ ] Homepage, Article, Index, Detail, Utility, and 404 layouts each pass semantic, interaction, and accessibility checks.
- [ ] Homepage and all three approved page-family mockups pass same-frame desktop, tablet, and phone review.
- [ ] There are no unreviewed screenshot changes, broken internal links, fake actions, duplicate H1s/canonicals, page-level overflow, console errors, or missing local assets.
- [ ] Production remains Jekyll until explicit cutover approval; rollback branch/tag exist before Pages source changes.
- [ ] Post-deployment crawl confirms custom domain, HTTPS, routes, assets, RSS, sitemap, and 404 behavior.

## Execution Notes

- Start with `superpowers:using-git-worktrees` as Task 1 requires.
- When using subagent-driven execution, dispatch one fresh implementation worker per task and complete both spec-compliance and code-quality review before moving on.
- Route/content contracts, source migration, visual page families, and deployment are separate ownership boundaries. Do not have concurrent workers edit the same files.
- When a visual task changes the approved appearance, pause for Grant's review rather than updating the reference to match the implementation.
- When a factual source is insufficient for a dossier, use the spec's `hasDetailPage: false` behavior and submit the resulting route-fixture change for explicit review.
