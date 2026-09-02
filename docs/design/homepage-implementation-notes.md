# Homepage implementation notes

The frozen Vite homepage and the Astro homepage were compared side by side in
the in-app browser at 1586×992, 1024×768, and 390×844. The rail/header
breakpoint, page gutters, hero hierarchy and line wrapping, grid tracks, card
order, rules, type families and weights, and evidence-image crops retain the
approved composition. The page has no horizontal overflow or clipped text at
the three baseline sizes.

## Authorized differences

- Utility labels render at the production 10px minimum, with the muted token
  used where the prototype's lighter utility gray did not meet accessible
  contrast.
- The mobile header uses the shared, functional Browse disclosure and 44px
  touch targets. Its controls therefore occupy slightly more vertical space
  than the prototype's undersized Say hello treatment.
- Homepage cards and latest-post rows use the current content graph, corrected
  record names, canonical internal routes, and deterministic post ordering.
- Evidence art is emitted through Astro's responsive image pipeline with
  intrinsic dimensions and modern source formats rather than direct PNG tags.

No other intentional deviations.
