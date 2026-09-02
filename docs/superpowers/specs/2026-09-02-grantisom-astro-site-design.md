# GrantIsom.com Astro Rebuild Design

**Date:** 2026-09-02  
**Status:** Visual and architectural direction approved  
**Production domain:** `https://grantisom.com`  
**Implementation target:** the existing `glisom.github.io` repository

## 1. Purpose

Rebuild GrantIsom.com as a personal website centered on Grant's writing and the things he builds and uses.

The site has five primary collections:

1. **Blog** — Grant's posts.
2. **App Library** — apps and tools Grant uses day to day.
3. **My Apps** — personal projects and software Grant has made.
4. **Skill Library** — skills and reusable capabilities Grant uses.
5. **My Skills** — skills Grant has created.

The site must feel personal rather than commercial. Consulting and employment can appear as incidental biography where relevant, but the homepage and collection pages must not read like a consulting-business site.

## 2. Approved Decisions

- Rebuild the production site with **Astro** using static output.
- Continue hosting on **GitHub Pages** for the first release so the custom domain does not require a DNS migration.
- Use a GitHub Actions workflow to build and publish the Astro output.
- Preserve every existing public article, product, support, privacy, feed, and asset URL.
- Preserve the approved **Evidence Index** homepage visual direction.
- Keep the current Vite homepage prototype untouched as a frozen visual reference.
- Create a durable, runnable copy of that reference under `design-reference/vite-homepage/` during implementation, excluding `node_modules` and generated build output.
- Run the frozen Vite reference and Astro rebuild independently so they can be compared side by side.
- Use React only for isolated interactions that genuinely require it. The site shell, articles, indexes, and detail pages render as static HTML by default.
- Do not add site search at launch. Reconsider category filtering after a collection has roughly 24 entries and search after roughly 50 entries.

## 3. Approved Visual References

The approved design sources are committed or checksum-identified so visual acceptance does not depend on an ephemeral browser session.

### Frozen Vite homepage

The original approved prototype remains untouched at:

```text
/Users/grantisom/.codex/visualizations/2026/09/01/01a05e66-5a21-78c0-80de-66330ee5d428/grantisom-evidence-index
```

Core checksums:

```text
b4f5db54c201bed782110fca82f999d905250e8c8ae1be92e0df917ba5c79c3f  src/App.jsx
b7befee81f1df7c5bcd1dce2250ba48c7f5a7f534e139e2cb48006e09cff6ce3  src/styles.css
7f92505e9b14ce43b19098f912dadfaf4b2d9e00946515b27164056cdf2f8cb7  package-lock.json
```

The durable reference copy uses this allowlist:

```text
.npmrc
index.html
package.json
package-lock.json
vite.config.mjs
src/App.jsx
src/main.jsx
src/styles.css
public/assets/*.png
implementation-1586x992-final.png
implementation-tablet-1024x768-final.png
implementation-mobile-390x844-final.png
qa-comparison-final.png
design-qa.md
```

Do not copy `node_modules/`, `dist/`, `.openai/`, `.superpowers/`, Sites packaging scripts, workers, or generated intermediate QA images. The approved prototype was captured with Node 25.9.0 and npm 11.12.1. Its comparison command is `npm ci` followed by `npm run dev -- --port 4173` from the frozen reference directory.

### Approved page-family mockups

| Family | Committed source | Approved state | SHA-256 |
|---|---|---|---|
| Article | `docs/design/mockups/article-family-approved.html` | ListWithMe article, top of page | `efa474e3b08488a09efd617e15c99bb7ac1a156ea858068ffb35ee325296117e` |
| Index | `docs/design/mockups/index-family-approved.html` | Blog active with `Things I've written.`, top of page | `0a7c45a605b562873215f5e129152fe5031b0d3fdeb06cef5d9d9f405b70b363` |
| Detail | `docs/design/mockups/detail-family-approved.html` | My App / ListWithMe active, top of page | `60b6a3a27166f70d035cf37ccb7c0c2541e7057273a1df178698ea0b038e75ec` |

The index and detail mockups include local preview switches for inspecting their variants. Those switches are design-companion controls, not production navigation.

### Baseline viewports and states

- Desktop: 1586 × 992.
- Tablet: 1024 × 768.
- Phone: 390 × 844.
- Homepage URL state: `/#top` with no hover, focus, or menu-open state.
- Article, index, and detail state: top of page with their approved default record active.
- Capture the viewport and a full-page image for each baseline.

Permitted visual differences from the Vite homepage are limited to readable utility text, accessible contrast, focus treatment, functional mobile navigation, corrected content, and responsive-image rendering. Content changes in computed `Latest posts` slots are expected; geometry, hierarchy, type, color, rules, and image treatment remain the comparison target.

## 4. Experience Principles

### Personal first

The site should answer three questions quickly:

- What has Grant written?
- What is Grant making?
- What tools and skills shape how Grant works?

Pages should use first-person language and concrete personal reasoning. Avoid services copy, testimonials, client-logo strips, consulting calls to action, pricing, employer timelines, affiliate language, star ratings, and popularity metrics.

### One visual world, different reading modes

Every page uses the same typography, mineral-paper palette, fixed identity rail, thin rules, small radii, electric blue, acid lime, and restrained halftone imagery.

The homepage is intentionally the densest and most asymmetric page. Collection indexes are calmer and more scannable. Articles are quiet and optimized for sustained reading. Detail pages feel like opening one record from the index.

### Meaningful color

- **Electric blue** is the primary interface color and marks things Grant uses.
- **Acid lime** marks authorship and things Grant made.
- **Near-black** creates occasional high-contrast evidence panels and personal notes.
- Color cannot be the only carrier of meaning; ownership stamps always include text such as `Used by Grant` or `Made by Grant`.

## 5. Visual System

### Typography

- **Source Serif 4** — display titles, article body, editorial headings, and card titles.
- **DM Sans** — interface copy, summaries, supporting text, and controls.
- **IBM Plex Mono** — metadata, collection labels, dates, status, captions, and record numbering.

Font files should be bundled locally through the project rather than fetched from a third-party font service at runtime.

### Core colors

The implementation should begin with the approved prototype values:

```css
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
```

Muted text tokens must meet WCAG AA contrast at their rendered size. Utility text should normally render at 10–12px, not the 8–9px values found in parts of the Vite prototype.

### Layout and responsive thresholds

- **1220px and wider:** fixed 250px identity rail, full page gutters, three-part article reading grid, and optional sticky right-side contents or context ledger.
- **1024–1219px:** fixed 210px identity rail, reduced gutters, no right-side article contents, and no 920px figure breakout.
- **821–1023px:** fixed 210px rail, stacked mastheads, inline facts, and non-sticky context sections. Article contents move above the body.
- **820px and below:** replace the rail with a 62px sticky identity header and a visible collection menu. All page families become one column.
- Interactive targets must be at least 44px on touch layouts.
- Information cannot depend on hover.
- Respect `prefers-reduced-motion`.
- The page itself must never scroll horizontally. Wide code, tables, and embeds scroll inside their own bounded region.
- Article figures may break out to 920px only at 1220px and wider.
- Long titles in the identity rail wrap naturally with `overflow-wrap: anywhere`; they are never ellipsized into an unintelligible label.

### Imagery

Use the approved halftone and technical-illustration language from the Vite prototype. Reuse its source assets in the Astro project through copied, optimized files; do not reference the frozen Vite server at runtime.

New imagery must be a real source image or generated asset sized for its intended slot. Do not substitute CSS illustrations, handcrafted SVG approximations, emoji, or generic placeholder boxes.

Astro's image pipeline should create responsive dimensions and modern formats while retaining originals when required for compatibility.

Use Phosphor Icons, matching the Vite prototype, for interface icons. Do not replace them with Unicode arrows, emoji, improvised SVG, or CSS drawings. Borders use square corners or the prototype's restrained 4px radius; large soft product-card rounding is outside this system.

## 6. Information Architecture and Routes

### Primary routes

| Label | Canonical route | Page family |
|---|---|---|
| Home | `/` | Curated homepage |
| Blog | `/blog/` | Collection index |
| App Library | `/app-library/` | Collection index |
| My Apps | `/projects/` | Collection index |
| Skill Library | `/skill-library/` | Collection index |
| My Skills | `/skills/` | Collection index |
| About | `/about/` | Personal profile |

The visible navigation labels must use the exact collection names above. `/projects/` remains canonical for My Apps because it is already public.

### Detail routes

- Blog post: preserve `/:year/:month/:day/:slug.html` exactly.
- App Library entry: `/app-library/:slug/`.
- My App entry: `/projects/:slug/`, except ListWithMe.
- ListWithMe: preserve `/listwithme/`.
- Skill Library entry: `/skill-library/:slug/`.
- My Skill entry: `/skills/:slug/`.

### Permanent utility routes

- `/listwithme/support/`
- `/listwithme/privacy/`
- `/feed.xml`
- `/sitemap.xml`
- `/robots.txt`
- `/404.html`

The new document head must advertise `/feed.xml`; it must not retain the current broken `/rss` reference.

`CNAME` is a required build artifact at `dist/CNAME`, not a page route.

### Astro output contract

Use static output with source-preserving file structure:

```js
{
  site: 'https://grantisom.com',
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'preserve' }
}
```

This uses Astro's documented [`build.format: 'preserve'`](https://docs.astro.build/en/reference/configuration-reference/#buildformat) behavior so index source files emit `index.html` while non-index dated routes emit `.html` files.

Index pages use `index.astro` source files and therefore produce directory URLs. Dated posts use a non-index dynamic page and therefore produce exact `.html` files. The representative output tree is:

```text
dist/
  index.html
  about/index.html
  blog/index.html
  app-library/index.html
  app-library/obsidian/index.html
  projects/index.html
  projects/hermes-ios/index.html
  skills/index.html
  skill-library/index.html
  listwithme/index.html
  listwithme/support/index.html
  listwithme/privacy/index.html
  2026/02/24/listwithme-returns.html
  2026/09/01/vampire.html
  feed.xml
  sitemap.xml
  robots.txt
  404.html
  CNAME
```

The dated route source is `src/pages/[year]/[month]/[day]/[slug].astro` with `getStaticPaths()` returning all blog records. Route-manifest tests assert both the URL and emitted file path.

## 7. Shared Site Shell

### Desktop identity rail

The rail contains:

1. `GI` monogram, Grant Isom, and `Writer · maker · tinkerer`.
2. A short current-status line, initially `Currently building Hermes iOS`.
3. The five primary collections.
4. Context for the current page:
   - Homepage: right-now summary.
   - Index: collection count and last-updated date.
   - Article: title, date, type, and reading time.
   - Detail: record title, ownership, status, and last-reviewed date.
5. GitHub, LinkedIn, RSS, and email links.

The active collection uses `aria-current="page"` and a visible blue rule.

### Mobile header and navigation

The mobile header keeps the monogram and name visible. A real Browse control exposes all five collections plus About, RSS, and email. It must work with keyboard, touch, and screen readers and must not reduce navigation to a single contact link.

### Footer

Use the approved personal language:

- `Grant Isom · Writer, maker, curious person`
- `Chicago, Illinois · My corner of the internet`

## 8. Homepage

Port the approved Vite prototype with visual fidelity. Its core composition remains:

- Personal hero: `I build useful things and write what I learn.`
- Personal introduction centered on app making, software curiosity, writing, and Chicago.
- Primary actions to Blog and My Apps.
- Halftone evidence-map hero art.
- Right-now strip for Writing, Building, and Using.
- Asymmetric evidence grid highlighting featured writing, selected apps, app library, latest posts, Skill Library, and My Skills.
- Short personal note near the footer.

Homepage content must come from Astro collections and site data rather than hard-coded component markup. Featured state and display order are explicit content fields.

The launch slots are explicit:

- `featured-writing`: Bringing ListWithMe Back to Life.
- `featured-project-primary`: Hermes iOS.
- `featured-project-secondary`: ListWithMe.
- `app-library`: Obsidian, Codex, Hermes Agent, and Superhuman in that order.
- `authored-skills`: write-like-grant, goodreads-export, and hatch-pet.
- `latest-posts`: the three newest published posts not already occupying the featured-writing slot, computed at build time.

The `homepageSlot` and `homepageOrder` fields own curated placement. The latest-posts list is the only date-computed homepage region. A new post may change its text and wrapping; visual review compares layout behavior rather than expecting the frozen prototype's old titles.

The production homepage should match the frozen Vite reference at the same viewport before intentional improvements are accepted. Accessibility fixes, readable utility text, mobile navigation, responsive image output, and link corrections are required even if they produce small visible differences.

### About page

`/about/` uses a quieter editorial variation of the Detail layout.

- Opening: a short first-person introduction adapted from the approved homepage personal note.
- Sections: Right now, A little background, Outside the screen, and Find me elsewhere.
- Work appears as one concise part of Grant's life, not the organizing story of the page.
- Do not reproduce the stale RealWork Labs biography, a résumé timeline, service offerings, testimonials, or client logos.
- Use typography and one approved halftone accent. Do not invent a portrait or decorative hero image.

### Color mode

The initial Astro release is intentionally light-only because the approved Evidence Index direction has no reviewed dark palette. The existing dark-mode script remains available only as a dormant legacy asset for URL compatibility and is not loaded by new pages. A dark theme requires a separate visual-design pass.

## 9. Article Page Family

The approved article concept is a **field note inside the Evidence Index**. It should feel like clicking an index card and opening the underlying notebook.

### Masthead

- Back link to all posts.
- Eyebrow containing post type and year.
- Large Source Serif title with intentional wrapping.
- Optional blue italic phrase when the title naturally supports emphasis.
- Short dek from the post summary.
- Optional real post image or approved halftone art.
- Ruled fact ledger containing publication date, calculated reading time, tags, and related project when present.

Posts without imagery use the facts panel and whitespace. They do not receive a generic filler illustration.

### Reading layout

Wide screens use:

- A small left margin note.
- A 680–720px primary prose column.
- An optional right-side table of contents generated from H2 and H3 headings.

At 821–1219px the table of contents moves above the article. At 820px and below it becomes a native disclosure when the rendered post contains at least three H2/H3 headings. Posts below that threshold omit it entirely.

### Prose behavior

- Source Serif 4 at approximately 19px and 1.7 line height.
- Clear blue underlined body links.
- Numbered H2 sections where appropriate.
- Restrained blockquotes with a blue rule.
- Dark ink code panels with accessible blue and lime syntax accents.
- Responsive figures with captions and full, wide, portrait, and gallery variants.
- Tables and code blocks scroll within their own region.
- Images never sit behind prose.
- Figures may break out to approximately 920px; ordinary prose remains within the reading measure.

### Article ending

The default ending contains:

1. Tags and connected project context when available.
2. Two or three explicitly related records.
3. Previous and next post navigation.
4. Utterances comments only when `comments: true`.
5. RSS and site footer.

Related content is manually authored so the relationship can be named, such as `Built with`, `Wrote about`, or `Inspired`.

## 10. Collection Index Family

All five indexes share one `CollectionIndexLayout`, masthead grammar, rail context, spacing system, focus behavior, and responsive logic. The content anatomy changes by collection.

### Shared masthead

- Plain collection label and true item count computed from published collection records.
- Large editorial title.
- One-sentence personal explanation.
- Optional halftone index mark.
- Optional featured record only when there is a meaningful feature choice.

The approved Blog masthead copy is:

- Label pattern: `Blog / {published count} posts`; it renders `Blog / 23 posts` at the time of this design.
- Title: `Things I've written.`
- Description: `Posts, build logs, playlists, and whatever else seemed worth writing down.`

### Blog

- One optional featured post.
- Chronological ledger grouped by year.
- Each row includes date, complete title, post type, and reading time.
- No search at launch.

### App Library

- Compact utility records grouped by the job the software does.
- Each record includes title, category, Grant's one-sentence reason it stays, and a path to its detail page.
- Avoid faux rankings, star ratings, and affiliate treatment.

### My Apps

- Larger evidence cards with current work first and archived work below.
- Cards include real project imagery, summary, status, platform, and primary destination.
- Current projects may use a larger featured card.

### Skill Library

- Dense field-manual rows grouped by capability or trigger.
- Each row includes title, source, what the skill enables, and where Grant uses it.
- Original authors and sources are always credited.

### My Skills

- Rich authored-skill cards marked with the lime `Made by Grant` stamp.
- Each card includes purpose, status, supported tools, and the appropriate documentation, source, or install destination.
- Do not show an install action for a private skill.

## 11. Detail Page Family

All non-blog detail pages share a **dossier** grammar. They should feel like individual records from the homepage or index, not separate marketing sites.

### Shared dossier anatomy

1. Parent collection and record number.
2. Ownership stamp: `Made by Grant` in lime or `Used by Grant` in blue.
3. Large title and one first-person sentence explaining why it exists or why it earned a place.
4. One primary action and no more than two quiet secondary links.
5. One real evidence artifact when available.
6. A target of four to six useful facts in a ruled ledger.
7. Numbered field notes in a 68–72ch reading column.
8. Optional sticky context ledger at 1220px and wider; it returns to normal document flow below that threshold.
9. Up to three manually connected records with a named relationship.
10. Back to the collection and one next record.

Unknown or stale facts are omitted instead of displayed as empty fields.

A valid sparse detail page has a summary, one action or honest no-action state, at least two facts, and at least two substantive field-note sections. Relationships are optional. Records that cannot meet that threshold remain index entries and link directly to their verified external destination; the build does not generate a thin dossier for them.

### My App variant

- Lead: why Grant made it.
- Sections: why it exists, what it does, how it was built when relevant, what Grant learned, and current state.
- Primary action: Download, Try, or Open.
- Secondary destinations: source and related writing.
- Private or local apps state that plainly and omit a nonfunctional button.

### App Library variant

- Lead: the job the app has in Grant's day.
- Sections: actual workflow, details Grant loves, friction and limits, and who it suits.
- Primary action: official product site.
- No affiliate copy, rating, or generic review score.

### Skill Library variant

- Lead: when Grant reaches for the capability.
- Sections: trigger, inputs and outputs, example, guardrails, source, and what Grant adapted.
- Primary action: original source or documentation.
- Credit the source author clearly.

### My Skills variant

- Lead: why Grant wrote it.
- Sections: when to use it, how it works, example, use or installation, and design decisions.
- Primary action: copy, install, open, or view source only when the destination is public and real.
- Public records must not expose private instructions, client context, tokens, local paths, or personal source material.

### ListWithMe variant

Keep `/listwithme/` as the ListWithMe detail page.

- Primary action: the real App Store destination.
- Secondary action: GitHub source.
- Utility links: Support and Privacy.
- Explain its iMessage-only discoverability clearly.
- Include current compatibility, status, screenshots, selected features, privacy summary, and both history posts.
- `/listwithme/support/` and `/listwithme/privacy/` use a reduced utility layout with the shared shell, readable column, last-updated date, section anchors, contact path, and back-to-ListWithMe link.
- Legal pages must not add decorative heroes or alter legal claims as part of the visual migration.
- The ListWithMe project record sets `canonicalPath: /listwithme/`. `/projects/listwithme/` is not generated and is never linked internally.

## 12. Content Architecture

### Collections and site data

```text
src/
  content/
    blog/
    app-library/
    projects/
    skill-library/
    skills/
  data/
    navigation.ts
    now.ts
    site.ts
    social.ts
```

All collections use Astro content schemas with strict validation.

### Common fields

- `title: string`
- `slug: string`, unique within its collection.
- `canonicalPath: string`, unique across the site and beginning and ending with `/`, except dated blog paths ending in `.html`.
- `summary: string`.
- `draft: boolean`, defaulting to `false`.
- `hasDetailPage: boolean`, defaulting to `true`.
- `featured: boolean`, defaulting to `false`.
- `displayOrder?: number` for curated indexes.
- `homepageSlot?: 'featured-writing' | 'featured-project-primary' | 'featured-project-secondary' | 'app-library' | 'authored-skills'`.
- `homepageOrder?: number`, required for multi-record homepage slots.
- `tags: string[]`, defaulting to an empty array.
- `titleAccent?: string`, an exact substring to render in blue italic display type.
- `media?: { src: string; alt: string; decorative: boolean; focalPoint?: string }`.
- `featuredArt?: { src: string; alt: string; decorative: boolean; focalPoint?: string }`.
- `links: Array<{ label: string; href: string; kind: 'primary' | 'secondary' | 'source' | 'support' | 'privacy' | 'install' }>`.
- `relationships: Array<{ collection: 'blog' | 'app-library' | 'projects' | 'skill-library' | 'skills'; id: string; label: string }>`.
- `publishedAt?: string`, `updatedAt?: string`, and `reviewedAt?: string` as ISO dates.

The build computes the canonical URL from `site + canonicalPath`. A blog post may set `canonicalOverride` only when it was originally syndicated elsewhere. No record stores both an inferred canonical and an unrelated manual URL.

If `titleAccent` is present but does not exactly match the title, the build fails. Heading numbering is controlled by `numberHeadings: boolean`; templates never guess from prose. Featured artwork and index feature choices are also authored fields, not inferred presentation.

Validation enforces unique paths, one record in each singleton homepage slot, unique order within multi-record slots, valid internal links, valid relationship targets, and real destinations for production actions. A non-decorative media object requires nonempty alt text; a decorative object requires empty alt text.

### Blog-specific fields

- `canonicalPath`
- `kind`
- `draft`
- `comments`
- `canonicalOverride`
- `socialImage`
- `relatedProject`
- `preservedHeadingIds`
- `numberHeadings`

Reading time is calculated during the build, not maintained manually in descriptions.

### Library and project fields

Use collection-specific fields for status, ownership, platform, category, cadence, source, source author, trigger, inputs, outputs, license, compatibility, primary action, and review date.

Relationships are explicit content references with a relationship label. They are not inferred from tag similarity.

### Launch collection manifest

The initial release uses the approved prototype and current production Projects page as its content boundary. It does not invent additional records during implementation.

| Collection | Initial records | Detail-page behavior |
|---|---|---|
| App Library | Obsidian, Codex, Hermes Agent, Superhuman | Generate `/app-library/{slug}/` for all four. Use verified official destinations from the Vite prototype. |
| My Apps | Hermes iOS, ListWithMe, HealthQL, Drift Dreams | Generate `/projects/hermes-ios/`, `/listwithme/`, `/projects/healthql/`, and `/projects/drift-dreams/`. |
| Skill Library | Deep Research, Browser Control, Frontend Design, Documents, PDF | Generate descriptive `/skill-library/{slug}/` records. Show a source action only when a public source URL is verified; never expose local skill paths. |
| My Skills | write-like-grant, goodreads-export, hatch-pet | Generate `/skills/{slug}/` descriptive records. Treat them as private by default and omit install or source actions until Grant intentionally publishes them. |

Known primary destinations:

```text
Obsidian      https://obsidian.md
Codex         https://openai.com/codex/
Hermes Agent  https://github.com/NousResearch/hermes-agent
Superhuman    https://superhuman.com
Hermes iOS    https://github.com/glisom/hermes-ios
ListWithMe    https://apps.apple.com/us/app/listwithme/id1224284271
HealthQL      https://github.com/glisom/HealthQL
Drift Dreams  https://getdriftdreams.com
```

Every initial detail page must meet the sparse-detail threshold in Section 11 before launch. If source material cannot support that threshold, set `hasDetailPage: false` and keep the record on its index with its verified destination. This is a content-completeness rule, not permission to generate filler copy.

## 13. Astro Component Boundaries

```text
src/layouts/
  BaseLayout.astro
  HomeLayout.astro
  ArticleLayout.astro
  CollectionIndexLayout.astro
  DetailLayout.astro
  UtilityLayout.astro

src/components/shell/
  SkipLink.astro
  IdentityRail.astro
  MobileHeader.astro
  MobileNav.astro
  SiteFooter.astro
  SeoHead.astro

src/components/editorial/
  ArticleMeta.astro
  Prose.astro
  TableOfContents.astro
  Figure.astro
  EmbedFrame.astro
  Callout.astro
  RelatedRecords.astro
  PostNavigation.astro
  Comments.astro

src/components/index/
  CollectionMasthead.astro
  FeaturedEntry.astro
  BlogLedger.astro
  ToolCatalog.astro
  AppEvidenceGrid.astro
  SkillManual.astro
  AuthoredSkillGrid.astro

src/components/detail/
  RegistryLine.astro
  OwnershipStamp.astro
  ActionGroup.astro
  EvidencePanel.astro
  FactLedger.astro
  FieldNotes.astro
  ConnectedRecords.astro

src/components/media/
  ResponsiveImage.astro
  HalftoneImage.astro
  Icon.astro
```

Each component has one clear responsibility. Page routes load and sort content, then pass serializable content into these presentational boundaries.

Global style layers:

```text
src/styles/
  tokens.css
  global.css
  shell.css
  prose.css
  utilities.css
```

Component-specific styles remain scoped with their Astro components.

## 14. Historical Content Migration

### Legacy asset contract

The following current public files remain available at their exact paths by placing originals in `public/`:

```text
/favicon.ico
/images/45d7f5784d.jpg
/images/475c3984d0.jpg
/images/5f538d59de.jpg
/images/5fd90bfbf1.png
/images/6647450a28.png
/images/7337cde14c.jpg
/images/96ce2ec5a6.jpg
/images/a37debf5ab.jpg
/images/a97bedecb3.jpg
/images/cloud.png
/images/develop_menu.png
/images/e1d2ad7014.jpg
/images/ec18f32904.jpg
/images/f159196842.png
/images/fa6c5dfe53.png
/images/logo.png
/images/safari_settings.png
/assets/js/darkmode.js
/css/main.css
```

`/assets/js/darkmode.js` and `/css/main.css` are dormant compatibility files and are not referenced by the Astro layouts. Capture the currently deployed `/css/main.css` before cutover because the repository contains its Sass source rather than the built file. Legacy originals are not sent through Astro's hashed image pipeline; new optimized derivatives live separately under `/_astro/`.

The currently broken Notion-image paths become valid compatibility copies while migrated article markup uses `/images/`:

```text
/uploads/2023/f159196842.png  -> /images/f159196842.png
/uploads/2023/fa6c5dfe53.png  -> /images/fa6c5dfe53.png
/uploads/2023/5fd90bfbf1.png  -> /images/5fd90bfbf1.png
/uploads/2023/6647450a28.png  -> /images/6647450a28.png
```

These legacy assets remain out of the generated sitemap.

The migration must include all 23 production posts:

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

### Markdown compatibility

Migration rules are deterministic:

- GFM fenced code blocks.
- Older indented code blocks.
- A legacy `excerpt` becomes `summary` after trimming and whitespace normalization. If no excerpt exists, use the first plain-text paragraph without truncating mid-word.
- `kind` defaults to `Post`; only explicitly authored values such as `Build log`, `Essay`, `Tools`, or `Open source` override it. Tags never infer kind.
- `publishedAt` uses the `YYYY-MM-DD` filename date as the public date. Any frontmatter timestamp is retained only as optional machine metadata. Dates display in `America/Chicago` and URLs never shift because of a time-zone conversion.
- Reading time is `max(1, ceil(proseWords / 225))` minutes. Exclude frontmatter, code blocks, raw tag names, image URLs, and embed attributes from the word count.
- Capture every heading ID from the deployed Jekyll page before conversion and store it as an explicit Markdown heading ID. Do not preserve only headings known to have inbound links.
- Convert each Spotify iframe to `EmbedFrame.astro`, retain its Spotify source URL, add `loading="lazy"`, and supply `title="Spotify playlist: {post title}"` unless a more specific label exists in the post.
- Allow trusted migrated raw HTML only for `iframe`, `div`, `span`, `a`, `img`, and `br`. Attribute allowlists are: iframe `src`, `title`, `loading`, `allow`, `allowfullscreen`, `width`, `height`, and `frameborder`; div/span `class`; anchor `href`, `title`, `class`, `target`, and `rel`; image `src`, `alt`, `title`, `class`, `width`, `height`, and `loading`. iframe sources must use `https://open.spotify.com/`. Reject `script`, `style`, `object`, event-handler attributes, and `javascript:` URLs at build time.
- Convert Kramdown `{: .button}` into the equivalent explicit link class during migration. No Kramdown attribute syntax remains in final content.
- Root-relative image paths.
- Portrait book covers.
- Posts without headings.
- Body-level H1 headings, normalized so each page has one semantic H1.
- Long titles.

Full-content RSS rewrites every internal root-relative link and image to an absolute `https://grantisom.com/...` URL.

Utterances continues using pathname-based mapping for current routes. The two older comment threads already disconnected by a previous permalink change are not remapped in this rebuild; the new site must avoid further fragmentation.

## 15. Metadata, Discovery, and Feeds

Every page receives:

- Absolute canonical URL.
- Unique title and description.
- Open Graph and Twitter metadata.
- Per-record social image when supplied, with `src/assets/social/default-og.png` as the fallback. The fallback uses the approved evidence-map artwork, site name, and personal tagline rather than the existing generic cloud image.
- Correct `lang="en"` document attribute.

Articles additionally receive Article JSON-LD with title, publication date, modification date when present, author, image, and canonical URL.

The rebuild must generate:

- `/feed.xml` containing full content for the latest ten posts, matching current subscriber expectations.
- A sitemap containing canonical public HTML pages only, with meaningful modification dates.
- `/robots.txt` pointing to the sitemap.
- A useful 404 page in the approved visual system.

`/favicon.ico` remains the launch favicon. A redesigned favicon is not part of this rebuild.

## 16. Failure and Edge-Case Behavior

- Invalid content frontmatter fails the build with a path-specific schema error.
- Duplicate slugs or duplicate canonical paths fail the build.
- Missing required image alt text fails validation.
- Broken internal relationships fail validation.
- Draft content is excluded from production and feeds.
- Optional sections disappear cleanly when their content is absent; no empty labels or blank cards render.
- External links use the real destination or are omitted. There are no `#` placeholder calls to action in production.
- Embeds receive a readable linked fallback when they cannot load.
- A missing route renders the designed 404 page and never falls back to the homepage.

## 17. Accessibility Requirements

- One semantic H1 per page.
- Skip link on every layout.
- Landmarks and heading order remain meaningful without CSS.
- All visible controls work by keyboard.
- Active navigation uses text and `aria-current`, not color alone.
- Images have useful alt text or are explicitly decorative.
- Captions remain associated with their figures.
- Touch targets are at least 44px.
- Focus indicators are visible on paper, blue, lime, and black surfaces.
- Text contrast meets WCAG AA.
- Reduced-motion preference disables nonessential movement.
- Utterances and embeds load lazily after primary content.

## 18. Verification Strategy

### Build and content checks

- Astro type and schema validation.
- Unique slug and canonical-path assertions.
- Route-manifest assertion covering every URL and emitted file in Sections 6 and 14, all permanent utility routes, and the legacy asset manifest.
- Internal-link and local-image validation.
- Feed, sitemap, canonical, Open Graph, JSON-LD, and 404 assertions.
- Homepage-slot uniqueness, ordering, and computed-post-count assertions.

### Representative page fixtures

Test at least:

- Homepage.
- Blog index.
- Every collection index.
- Standard article.
- Long-title article.
- Article without headings.
- Article with code.
- Article with Spotify embeds.
- Book-cover article.
- Each of the four dossier variants.
- ListWithMe, Support, and Privacy.

### Interaction and accessibility checks

- Desktop and mobile navigation.
- Keyboard order and visible focus.
- Table-of-contents behavior.
- External actions and secondary links.
- Automated accessibility checks on one representative page per layout family.

### Visual comparison

Run the frozen Vite reference and Astro site side by side. Capture the same desktop, tablet, and phone viewports.

- Use the exact states and dimensions in Section 3.
- Homepage comparison targets near-pixel visual fidelity for the rail, typography, section bounds, rules, palette, and image crop. Exclude intentional text changes in the computed latest-post list and byte-level differences from optimized images.
- Article, index, and detail comparisons use the committed approved mockups in Section 3.
- At each viewport, rail/header dimensions must match within 1px, primary section bounds and gutters within 4px, font families and weights exactly, and image subject/crop visibly. There can be no clipped text, unintended wrapping caused by the implementation, missing rules, broken image proportions, or horizontal page overflow.
- Capture additional interaction baselines for mobile Browse open, keyboard focus on a primary action, and an expanded article table of contents.
- Compare source and implementation screenshots together, correct visible differences, then repeat the comparison.
- Once the implementation snapshots are approved, commit them as visual-regression baselines; subsequent test runs require zero unreviewed snapshot changes.

### Pre-cutover crawl

Before replacing the Jekyll deployment, crawl both the current production site and the Astro preview. Verify that every existing public route, image, feed, canonical, and legal/support destination resolves as expected.

## 19. Deployment and Cutover

1. Build the Astro site on a dedicated implementation branch.
2. Keep the existing Jekyll site deployable until the Astro preview passes verification.
3. Add a GitHub Actions Pages workflow that pins the repository's Node and package-manager versions.
4. Preserve `CNAME` with `grantisom.com` in the published output.
5. Deploy an isolated preview for the final crawl and visual comparison.
6. Merge only after route parity, accessibility, feed, sitemap, and visual checks pass.
7. Verify the custom domain and HTTPS after the first production deployment.

No DNS change is required for this plan.

## 20. Explicitly Deferred

- Site-wide search.
- User accounts, comments on library records, ratings, likes, or popularity metrics.
- Automatically inferred related content.
- A CMS or database.
- A move away from GitHub Pages.
- A consulting-services section.
- Restoration of the two comment threads disconnected by the site's earlier permalink migration.

These items require separate decisions and are not part of the initial Astro rebuild.
