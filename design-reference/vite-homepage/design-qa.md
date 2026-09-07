# Design QA — Grant Isom Personal Index

## Comparison setup

- Source visual truth: `/Users/grantisom/.codex/generated_images/01a05e66-5a21-78c0-80de-66330ee5d428/exec-8c291f7f-cf0f-4047-be26-37ff09f2ee71.png`
- Browser-rendered implementation: `/Users/grantisom/.codex/visualizations/2026/09/01/01a05e66-5a21-78c0-80de-66330ee5d428/grantisom-evidence-index/qa/implementation-desktop.jpg`
- Same-frame comparison: `/Users/grantisom/.codex/visualizations/2026/09/01/01a05e66-5a21-78c0-80de-66330ee5d428/grantisom-evidence-index/qa/comparison-desktop.png`
- Desktop viewport and state: `1586 × 992`, `#top`, light theme, signed-out public homepage.
- Source pixels: `1586 × 992` at the intended desktop density.
- Implementation pixels: `1586 × 992` from a `1586 × 992` CSS viewport. No density normalization was required.
- Responsive evidence: `qa/implementation-tablet.jpg` at `1024 × 768` and `qa/implementation-mobile.jpg` at `390 × 844`.

## Full-view comparison evidence

The source and implementation were placed together in `qa/comparison-desktop.png`, source on the left and implementation on the right. The rewritten page preserves the selected composition: fixed identity rail, two-part editorial hero, thin rule system, three-item index strip, asymmetric evidence grid, mineral paper background, near-black feature card, electric-blue navigation and accents, acid-lime counterpoint, restrained radii, and halftone technical imagery.

The visible differences are intentional content changes approved for the personal-site direction. Writing replaces consulting as the lead proof, personal apps occupy the project cards, and app and skill libraries replace the consulting methods and business modules. The hierarchy and density remain equivalent to the visual target.

## Focused-region evidence

Separate crops were not required because the original-size `3172 × 992` comparison keeps the hero, sidebar, role strip, all desktop cards, typography, icons, borders, and image crops readable together. Tablet and mobile captures were also inspected at their native sizes, including the full lower card sequence and personal note.

## Findings

- No actionable P0, P1, or P2 differences remain.
- P3: the longer featured essay title creates a denser black card than the source’s work title. It remains readable, visually balanced, and supports the new writing-first hierarchy, so no fix is required.

## Required fidelity surfaces

- **Fonts and typography:** Source Serif 4, DM Sans, and IBM Plex Mono preserve the source’s editorial display, practical body, and index-label hierarchy. Desktop, tablet, and mobile checks found no clipped or unreadable text.
- **Spacing and layout rhythm:** Rail width, page inset, hero split, section rules, grid tracks, card padding, and compact radii match the target’s geometry. The `1120px` and `820px` breakpoints preserve hierarchy without horizontal overflow.
- **Colors and visual tokens:** Paper, ink, electric blue, acid lime, pale violet, and thin gray rules map cleanly to the selected direction with readable contrast.
- **Image quality and asset fidelity:** The implementation retains six purpose-built raster assets with appropriate crops and multiply blending. No placeholder imagery, CSS drawings, handcrafted SVG art, or emoji substitutes are present.
- **Copy and content:** All homepage text now describes Grant’s writing, personal apps, daily tools, used skills, and created skills. Limelight and Groundwork appear only in the small personal-context note.
- **Icons:** Phosphor icons remain consistent in stroke, scale, alignment, and accessible labeling.
- **Responsiveness:** Verified at `1586 × 992`, `1024 × 768`, and `390 × 844`. No horizontal overflow, overlap, unusable controls, or visually clipped content was observed.
- **Accessibility:** The page uses semantic landmarks and headings, descriptive alt text, visible focus rings, reduced-motion handling, labeled icon-only links, and practical mobile touch targets.

## Interaction and runtime checks

- Sidebar links update the URL hash and `aria-current` state for Blog, App Library, My Apps, Skill Library, and My Skills.
- The primary hero action resolves to `#blog` and updates active navigation state.
- Featured writing, Hermes iOS, ListWithMe, the full writing index, app-library, social, RSS, and email destinations use real URLs. The ListWithMe App Store ID and the writing-index route were validated against their live pages.
- Same-site writing links stay in the current tab; external app, tool, repository, and social destinations open separately.
- The browser console contains only Vite connection messages and the React development notice; no errors or warnings were observed.
- `npm run build` and all four `npm run test:sites` checks pass.

## Comparison history

- Earlier implementation QA resolved the hero wrap, method-card dominance, role-icon weight, tablet collision, and stale navigation state before the personal-content pass.
- This content pass preserved the approved visual system and corrected the only implementation-specific layout risks introduced by the rewrite: linked app-library rows now own their full grid layout, the three-entry writing card uses a tighter row rhythm, and the new personal note has responsive desktop and mobile treatments.
- A final copy and accessibility review corrected the ListWithMe App Store destination, replaced the dead archive route with the live writing index, removed a duplicated featured article from “Latest notes,” kept same-site reading in the current tab, changed the My Skills card to a proper `h2`, removed ambiguous sidebar numbering, and increased the smallest meaningful labels without disturbing the composition.
- The post-fix desktop comparison and native tablet/mobile captures show no remaining P0, P1, or P2 issues.

## Implementation checklist

- [x] Preserve the selected visual language and imagery.
- [x] Reframe the homepage around the five approved personal collections.
- [x] Use verified posts, apps, tools, and local skills.
- [x] Verify desktop, tablet, and mobile layouts.
- [x] Verify hash navigation, active states, real destinations, and console output.

final result: passed
