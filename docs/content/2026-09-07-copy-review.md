# Copy and content review, September 7, 2026

This is an editorial draft, not a record of Grant approving every selection. The redesign supplied the initial inventory. An installed tool establishes availability, not frequency of use or a personal endorsement.

## Changes made

- Rewrote homepage, collection introductions, and shared labels in plain language. Explained AI skills and distinguished authored skills from third-party skills.
- Removed unsupported daily/weekly cadences, “reinstall first” language, and detailed briefing routines from app entries.
- Grounded Obsidian’s entry in the existing Goodreads export workflow and Hermes Agent’s entry in the public Hermes iOS project.
- Added Vampire to My Apps and skill-thief to My Skills, with detail pages and links to their existing build posts. The three private skills remain the homepage selection.
- Compared all three private skill descriptions with their local source files. Kept private instructions, writing samples, and local paths out of the site.
- Simplified all five third-party skill descriptions. Corrected Browser Control’s source to the installed computer-use plugin and Deep Research’s trigger to an explicit request.
- Removed inherited review dates from app and library entries where they could imply a verified personal recommendation. A copy review is not a product review.
- Removed the conflicting current-employer and unconfirmed location claims from the homepage, About page, and footer.
- Kept Drift Dreams archived but stopped treating a failed website request as proof of its current availability.

## Evidence and boundaries

| Content                                            | Evidence                                                                                                    | Editorial decision                                                                                        |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Vampire                                            | Existing September 1 build post; [public repository](https://github.com/glisom/vampire) checked September 7 | Added to My Apps. No claim of an App Store release.                                                       |
| skill-thief                                        | Existing September 1 post; [public repository](https://github.com/glisom/skill-thief) checked September 7   | Added as a public authored skill/plugin. Link to README for installation.                                 |
| Hermes iOS                                         | [Public repository](https://github.com/glisom/hermes-ios) checked September 7                               | Retained; replaced “control plane” and “cockpit” with a concrete description.                             |
| HealthQL and ListWithMe                            | Existing launch posts and product/support content                                                           | Retained feature and platform copy. No new claims about release availability or privacy.                  |
| goodreads-export, hatch-pet, write-like-grant      | Local SKILL.md files                                                                                        | Updated descriptive copy; source stays private.                                                           |
| Skill Library                                      | Installed skill metadata and computer-use tool documentation                                                | Describe capabilities and provenance, without inferring frequent use.                                     |
| App Library                                        | Existing inventory, installed tools, Goodreads workflow, Hermes client                                      | Retained four candidates; removed invented personal preferences.                                          |
| Bio                                                | Legacy About page says RealWork Labs; redesigned page says Limelight and Groundwork AI                      | Grant approved the Limelight/Groundwork introduction and confirmed Kansas City, MO.                       |
| Drift Dreams                                       | Existing archived entry; public website fetch failed                                                        | No working download or present availability established.                                                  |
| Historical posts                                   | Existing authored archive                                                                                   | Preserved the posts as dated writing; not rewritten as current recommendations.                           |
| ListWithMe support and privacy                     | Existing support and policy source                                                                          | Reviewed for scope; preserved instructions and legal claims pending a separate product/policy fact check. |
| Navigation, 404, footer, article and detail labels | Existing site templates                                                                                     | Navigation retained; generic collection and relationship language simplified.                             |

## Decisions for Grant

1. Review the remaining About copy. Confirmed: Limelight, Groundwork AI, and Kansas City, MO.
2. Which of Obsidian, Codex, Hermes Agent, and Superhuman actually belong in the App Library? What else is missing?
3. Which installed skills deserve a public recommendation? The five inherited selections are not a complete installed inventory.
4. Should any private skills be published, and should skill-thief replace one of the three homepage skill picks?
5. Which apps should be featured? Hermes iOS and ListWithMe remain the existing homepage picks. Should Vampire or HealthQL take a slot?
6. Is Drift Dreams still worth listing, and is there a current destination for it?
7. Is the “Right now” strip accurate? It still names Hermes iOS and Obsidian + Codex.

## Future edits

Edit entries in `src/content`, shared descriptions in `src/data/collections.ts`, identity in `src/data/site.ts`, and the current-work strip in `src/data/now.ts`. Homepage placement uses `homepageSlot` and `homepageOrder`; display order alone does not feature an entry.

A new entry also needs an explicit route in `tests/fixtures/public-routes.json` and updated collection counts in `scripts/validate-source.ts`. Keep source and availability claims dated only when verified. Never infer ownership or a recommendation from an installed plugin alone.

## Validation

- Production build passed: 54 route artifacts, 24 compatibility assets, 23 blog pages, and internal HTML contracts.
- The full test run passed 279 of 285 tests before the final fixes. Re-ran all 53 tests in the three affected suites after correcting heading rendering, collection dates, and new-route fixtures; all passed.
- Checked eight pages at 390px and 1440px widths with no horizontal overflow. Inspected homepage and My Skills screenshots. The four-skill grid now uses two desktop columns and one mobile column.
- Added actual September 7 production crawl observations for the two new routes to the existing baseline. Both returned 404; existing observations were preserved.
- No deployment performed. Personal selections listed above still need Grant’s input.

## Confirmed App Library selections

Grant added Notion, Claude, Linear, Slack, Poolsuite FM, Spotify, and Wispr Flow, and chose Notion, Claude, Linear, and Slack for the four homepage positions. The previous four entries remain in the full library, bringing it to eleven apps.

New entries link to official product pages and use short capability descriptions. Personal workflow notes remain for the section-by-section review; no detailed reviews were invented to fill pages. Official destinations were checked on September 7: [Notion](https://www.notion.com/product), [Claude](https://claude.ai/), [Linear](https://linear.app/), [Slack](https://slack.com/), [Poolsuite](https://poolsuite.net/), [Spotify](https://open.spotify.com/), and [Wispr Flow](https://wisprflow.ai/).

## Direct-link catalogs

Grant requested removal of the individual app and skill detail pages. All four catalogs now link to official product pages or public source repositories. Private skills and archived apps without public destinations remain descriptions without links. ListWithMe retains its standalone product, support, and privacy pages, while its catalog card opens the App Store.

Seventeen catalog routes were removed from generated output and the sitemap. Related blog links now resolve to external destinations; references to private skills without destinations were removed. The former detail content remains in the collection source for future editing, but is not published as separate pages. The homepage and collection cards share one destination resolver.

Direct-link validation: production build passed with 37 route artifacts. Checked the homepage and four catalogs at 390px and 1440px with no overflow or links to removed catalog routes. The full test run passed 285 tests, with the article relationship fixture requiring an update because some posts now have fewer related links.

### My Skills selection and GitHub review

- User approved keeping every discussed skill except Hatch Pet; removed its site record.
- Added comment-detective, comment-conductor, and change-review-digest from the public limelighthq/vercel-comment-skills repository. Each links to its source folder and credits Limelight.
- Reviewed glisom's public repositories and found ux-deep-dive, an app-screen capture and annotated PDF audit skill. Added it with a direct repository link.
- All seven retained skills appear on the homepage and My Skills index. Write Like Grant and Goodreads Export remain private and unlinked.
- Verified descriptions against the public repository READMEs. Build and mobile/desktop overflow and direct-link checks passed.

### Community Skill Library

- User approved replacing all five OpenAI/Anthropic entries with Impeccable, Superpowers, Compound Engineering, Obsidian Markdown, Obsidian Bases, and JSON Canvas.
- Grouped the six approved entries under Product design, Development, and Obsidian, with creator credits and direct public GitHub links. No individual site pages.
- Source repositories verified: pbakaus/impeccable, obra/superpowers, EveryInc/compound-engineering-plugin, and kepano/obsidian-skills.
- Build and desktop/mobile count, overflow, and direct-link checks passed. Claude's installed configuration was not modified.
- User approved all six descriptions, including the simpler Compound Engineering copy: "Helps coding agents plan, build, review, and learn from each project."

### About opening

- Applied the reviewed About opening with the user’s correction: “I build AI agents” instead of “AI products.” Updated the homepage introduction to match.

- User approved the LinkedIn-grounded career background: learning to code at 16, university consultancy, Cerner and HealthKit, Illuminate clinical AI, RealWork mobile and voice agents, and the founding AI role at Limelight. Applied as two paragraphs.

- Outside the screen: user added coffee. Approved wording: “Outside of software, I’m a dad and a tennis player with strong opinions about Kansas City barbecue and coffee.”

- User approved Find me elsewhere and requested Twitter. Added https://x.com/grantisom to the shared social list as X (Twitter), with the X icon in the site sidebar and a link on About. Updated the About sentence to mention Twitter.

- User approved keeping navigation unchanged and simplifying the footer to “Grant Isom · Software Engineer · Applied AI” and “Kansas City, MO.” Applied in the shared site settings.

### Final copy sweep

- Reviewed rendered homepage, catalogs, About, ListWithMe, and 404 copy, plus all blog summaries and shared metadata.
- Replaced the stale homepage “Writer, maker, tinkerer” title with the approved Software Engineer · Applied AI positioning. Homepage metadata now comes from SITE.
- Updated the default social preview image to the approved tagline; the original remains available alongside the new default-og-v2.png.
- Corrected the original ListWithMe article’s unrelated playlist summary in both Astro content and its legacy source. Historical article bodies remain unchanged.
- Removed catalog promises of examples/detail notes that disappeared with the per-item pages; corrected “Grouped by the job it does” to “Grouped by what they do.”
- Changed the homepage authored-skills heading to “Skills I’ve built.” to include both personal and Limelight work. Added Claude to Write Like Grant’s supported tools based on the verified local skill installation.
- Confirmed no broken internal links across 34 generated HTML pages, no stale homepage tagline/AI-products/Hatch Pet references in visible current content, and no horizontal overflow across seven primary pages at 390px and 1440px.
- ListWithMe support/privacy remain preserved product documentation; this copy sweep does not establish their current technical or legal accuracy.
