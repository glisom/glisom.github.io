import { test as base, expect } from '@playwright/test';
import { e2eNetworkPolicy } from '../helpers/e2e-network-contract';

export const test = base.extend<{ diagnostics: string[] }>({
  diagnostics: [
    async ({ page, baseURL }, use) => {
      const diagnostics: string[] = [];
      const allowedOrigins = [
        new URL(baseURL ?? 'http://127.0.0.1:4321').origin,
      ];
      page.on('console', (message) => {
        if (message.type() === 'error')
          diagnostics.push(`console.error: ${message.text()}`);
      });
      page.on('pageerror', (error) =>
        diagnostics.push(`pageerror: ${error.message}`),
      );
      page.on('requestfailed', (request) => {
        try {
          if (new URL(request.url()).origin === new URL(page.url()).origin) {
            diagnostics.push(
              `same-origin request failed: ${request.url()} (${request.failure()?.errorText})`,
            );
          }
        } catch {
          // Navigation may not yet have established an origin.
        }
      });
      await page.context().route(/^https?:\/\//, async (route) => {
        const url = route.request().url();
        const policy = e2eNetworkPolicy(url, allowedOrigins);
        if (policy === 'continue') {
          await route.continue();
          return;
        }
        if (policy === 'fulfill') {
          await route.fulfill({
            status: 200,
            contentType:
              new URL(url).hostname === 'open.spotify.com'
                ? 'text/html; charset=utf-8'
                : 'text/javascript; charset=utf-8',
            body: '',
          });
          return;
        }
        diagnostics.push(`blocked unexpected cross-origin request: ${url}`);
        await route.abort('blockedbyclient');
      });
      await use(diagnostics);
      expect(diagnostics, diagnostics.join('\n')).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';

export async function interceptThirdParties(
  page: import('@playwright/test').Page,
) {
  await page.route(
    /https:\/\/(?:utteranc\.es|open\.spotify\.com)\//,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/javascript',
        body: '',
      });
    },
  );
}
