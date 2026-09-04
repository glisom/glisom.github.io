import { defineConfig, devices } from '@playwright/test';

process.env.ASTRO_PREVIEW_BACKGROUND ??= '0';

const baseURL = process.env.PREVIEW_ORIGIN ?? 'http://127.0.0.1:4321';
const referenceServers = [
  {
    command:
      'npm --prefix design-reference/vite-homepage run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173/',
    reuseExistingServer: !process.env.CI,
  },
  {
    command:
      'node scripts/serve-design-mockups.mjs --host 127.0.0.1 --port 4174',
    url: 'http://127.0.0.1:4174/article-family-approved.html',
    reuseExistingServer: !process.env.CI,
  },
];

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  webServer: [
    ...(!process.env.PREVIEW_ORIGIN
      ? [
          {
            command: 'npm run preview -- --host 127.0.0.1 --port 4321',
            url: 'http://127.0.0.1:4321/',
            reuseExistingServer: !process.env.CI,
          },
        ]
      : []),
    ...referenceServers,
  ],
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1586, height: 992 },
      },
    },
    {
      name: 'tablet',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1024, height: 768 },
      },
    },
    {
      name: 'phone',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: 'mid-layout',
      testMatch: /tests\/e2e\/layout\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 900, height: 900 },
      },
    },
  ],
});
