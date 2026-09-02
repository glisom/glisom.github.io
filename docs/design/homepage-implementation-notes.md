# Homepage implementation notes

The frozen Vite homepage and the Astro homepage were compared side by side in
the in-app browser at 1586×992, 1024×768, and 390×844. The Astro layout was also
re-inspected at 1220×900 and 1121×900, the two widths on either side of its
highest-risk rail and grid transitions. The rail/header breakpoint, page
gutters, hero hierarchy and line wrapping, card order, rules, type families and
weights, and evidence-image crops retain the approved composition. The page has
no horizontal overflow, clipped text, or action overlap at any of the five
inspection sizes.

## Authorized differences

- Utility labels render at the production 10px minimum, with the muted token
  used where the prototype's lighter utility gray did not meet accessible
  contrast.
- The mobile header uses the shared, functional Browse disclosure and 44px
  touch targets. Its controls therefore occupy slightly more vertical space
  than the prototype's undersized Say hello treatment.
- Homepage actions retain the shared 44px hit area through the intermediate and
  wide layouts without adding visible button chrome to inline actions.
- The hero and evidence grid enter the approved stacked/two-column treatment at
  1320px, leaving a safe margin above the 250px rail's exact-fit threshold.
  Wide grid rows retain 162px as their minimum and grow only when the real copy
  and 44px actions need more room. Cards with visually anchored actions reserve
  that action space in normal flow.
- Homepage cards and latest-post rows use the current content graph, corrected
  record names, canonical internal routes, and deterministic post ordering.
- Evidence art is emitted through Astro's responsive image pipeline with
  intrinsic dimensions and modern source formats rather than direct PNG tags.

No other intentional deviations.
