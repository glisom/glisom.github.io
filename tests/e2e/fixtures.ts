import { test as base, expect } from '@playwright/test';

export const test = base.extend<{ diagnostics: string[] }>({
  diagnostics: [
    async ({ page }, use) => {
      const diagnostics: string[] = [];
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
