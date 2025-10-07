// Playwright visual tests for DS components
import { test, expect } from '@playwright/test';

const storyBase = process.env.STORYBOOK_BASE_URL || 'http://localhost:6006';

async function gotoStory(page, id) {
  await page.goto(`${storyBase}/iframe.html?id=${id}`);
  // Wait for story root to stabilize
  await page.waitForSelector('#storybook-root :first-child', { state: 'attached' });
}

async function snapshot(page, name) {
  const root = await page.locator('#storybook-root');
  await expect(root).toHaveScreenshot(`${name}.png`, { animations: 'disabled' });
}

test.describe('Design System Visuals', () => {
  test('Button', async ({ page }) => {
    await gotoStory(page, 'ui-atoms-button--basic');
    await snapshot(page, 'button-basic');
  });

  test('Panel', async ({ page }) => {
    await gotoStory(page, 'ui-organisms-panel--basic');
    await snapshot(page, 'panel-basic');
  });

  test('ActionBar', async ({ page }) => {
    await gotoStory(page, 'ui-molecules-actionbar--basic');
    await snapshot(page, 'actionbar-basic');
  });

  test('SidebarItemCard', async ({ page }) => {
    await gotoStory(page, 'ui-molecules-sidebaritemcard--basic');
    await snapshot(page, 'sidebaritemcard-basic');
  });

  test('StatCard', async ({ page }) => {
    await gotoStory(page, 'ui-molecules-statcard--info');
    await snapshot(page, 'statcard-info');
  });
});
