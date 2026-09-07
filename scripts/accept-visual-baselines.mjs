import { fileURLToPath } from 'node:url';
import { acceptCanonicalVisualBaselines } from './lib/canonical-visual.mjs';

export async function acceptVisualBaselines() {
  const manifest = await acceptCanonicalVisualBaselines();
  console.log(
    `Accepted ${manifest.count} byte-identical visual comparisons for ${manifest.host.os} ${manifest.host.architecture}, Playwright ${manifest.host.playwrightVersion}, Chromium r${manifest.host.chromiumRevision}.`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await acceptVisualBaselines();
}
