# grantisom.com

The site is a static Astro build. Use Node 24.20.0 and npm 11.19.0; both
versions are enforced by the repository.

## Local operation

From the repository root:

```sh
npm ci
npm run dev
npm run build
npm run test:all
```

`npm run dev` serves the Astro implementation from the repository root on port
4321. The frozen Vite homepage reference lives at
`design-reference/vite-homepage` and is served on port 4173 by the visual test
tooling. Treat that reference as read-only.

## Content and routes

Astro content collections live in:

- `src/content/blog/`
- `src/content/app-library/`
- `src/content/projects/`
- `src/content/skill-library/`
- `src/content/skills/`

Every blog record declares its exact dated canonical route as
`/YYYY/MM/DD/slug.html`. Preserve that `.html` route exactly; the build uses
the authored `canonicalPath`, not a directory-style replacement.

## Deployment and rollback

After the approved cutover, a push to `master` builds the reviewed lockfile and
deploys `dist/` through the GitHub Pages workflow. The pre-cutover Jekyll state
is preserved on the `legacy-jekyll` rollback branch; Jekyll remains historical
rollback context, not the active post-cutover implementation.

Launch is light-only. Legacy CSS, images, scripts, and compatibility aliases
remain dormant, byte-stable output for old URLs and rollback safety. Do not
activate, rewrite, or remove those assets until post-production cleanup is
separately approved.
