import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

async function exercise(
  page: Page,
  path: string,
  name: string,
  role: 'primary' | 'quiet',
  expectedUrl: string,
  keyboard = false,
) {
  let attempted = '';
  await page.context().route(expectedUrl, async (route) => {
    attempted = route.request().url();
    await route.fulfill({ status: 204, body: '' });
  });
  await page.goto(path);
  const action = page.locator(`[data-action-role="${role}"]`, {
    hasText: name,
  });
  await expect(action).toHaveAccessibleName(name);
  await expect(action).toHaveAttribute('href', expectedUrl);
  await expect(action).toHaveAttribute('target', '_blank');
  await expect(action).toHaveAttribute('rel', /\bnoopener\b/);
  await expect(action).toHaveAttribute('rel', /\bnoreferrer\b/);
  if (keyboard) {
    await action.focus();
    await page.keyboard.press('Enter');
  } else {
    await action.click();
  }
  await expect
    .poll(() => attempted && new URL(attempted).href)
    .toBe(new URL(expectedUrl).href);
}

test('authored external actions expose exact, safe destinations', async ({
  page,
}) => {
  await exercise(
    page,
    '/listwithme/',
    'Download on the App Store',
    'primary',
    'https://apps.apple.com/us/app/listwithme/id1224284271',
  );
  await exercise(
    page,
    '/listwithme/',
    'View source',
    'quiet',
    'https://github.com/glisom/ListWithMe',
    true,
  );
});

test('catalog entries link straight to their products or public sources', async ({
  page,
}) => {
  for (const [path, , url] of [
    ['/app-library/', 'Obsidian', 'https://obsidian.md'],
    ['/projects/', 'HealthQL', 'https://github.com/glisom/HealthQL'],
    [
      '/skill-library/',
      'Frontend Design',
      'https://github.com/anthropics/skills/tree/main/skills/frontend-design',
    ],
    ['/skills/', 'skill-thief', 'https://github.com/glisom/skill-thief'],
  ]) {
    await page.goto(path);
    const link = page.locator(`a[href="${url}"]`);
    await expect(link).toHaveCount(1);
    await expect(link).toBeVisible();
  }
  await page.goto('/skills/');
  await expect(
    page.locator('a[href^="/skills/"]:not([href="/skills/"])'),
  ).toHaveCount(0);
  await expect(
    page
      .locator('[data-authored-skill]')
      .filter({ hasText: 'write-like-grant' })
      .locator('a'),
  ).toHaveCount(0);
});
