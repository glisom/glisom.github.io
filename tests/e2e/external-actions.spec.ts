import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

async function exercise(page: Page, path: string, name: string, role: 'primary' | 'quiet', expectedUrl: string, keyboard = false) {
  let attempted = '';
  await page.context().route(expectedUrl, async (route) => {
    attempted = route.request().url();
    await route.fulfill({ status: 204, body: '' });
  });
  await page.goto(path);
  const action = page.locator(`[data-action-role="${role}"]`, { hasText: name });
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
  await expect.poll(() => attempted && new URL(attempted).href).toBe(new URL(expectedUrl).href);
}

test('authored external actions expose exact, safe destinations', async ({ page }) => {
  await exercise(page, '/listwithme/', 'Download on the App Store', 'primary', 'https://apps.apple.com/us/app/listwithme/id1224284271');
  await exercise(page, '/listwithme/', 'View source', 'quiet', 'https://github.com/glisom/ListWithMe', true);
  await exercise(page, '/app-library/obsidian/', 'Visit Obsidian', 'primary', 'https://obsidian.md');
  await exercise(page, '/projects/healthql/', 'Read the documentation', 'quiet', 'https://glisom.github.io/HealthQL', true);
});

test('Skill Library source action is safe when a record authors one', async ({ page }) => {
  await page.goto('/skill-library/deep-research/');
  const source = page.locator('[data-action="source"]');
  if ((await source.count()) === 0) {
    expect(await page.locator('[data-action-group] [data-action-role]').count()).toBe(0);
    return;
  }
  await expect(source).toHaveAttribute('target', '_blank');
  await expect(source).toHaveAttribute('rel', /\bnoopener\b.*\bnoreferrer\b|\bnoreferrer\b.*\bnoopener\b/);
});
