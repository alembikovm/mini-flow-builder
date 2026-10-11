
import { expect, test } from '@playwright/test';

test('stress: changing a style on one node renders few NodeMounts', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByRole('button', { name: /Stress test/ }).click();

  await expect(page.locator('[data-node-id]')).toHaveCount(501, { timeout: 10_000 });

  const firstRow = page.locator('[data-node-id]').filter({ hasText: 'Row 1' }).first();
  await firstRow.click();
  await page.keyboard.press('Escape');

  const gapInput = page.locator('text=Gap').locator('..').locator('input').first();
  await gapInput.click();
  await page.waitForTimeout(50);

  await page.evaluate(() => {
    window.__mfbRenderCount = 0;
  });

  await gapInput.press('ControlOrMeta+a');
  await gapInput.fill('13');
  await gapInput.press('Enter');

  await page.waitForTimeout(100);
  const delta = (await page.evaluate(() => window.__mfbRenderCount ?? 0)) as number;

  console.log(`[perf] NodeMount renders after a single gap edit (500-node screen) = ${delta}`);

  // Isolation goal: only the edited root re-renders. In StrictMode this
  // becomes 2. Allow headroom but far below the 500-children ceiling.
  expect(delta).toBeLessThan(10);
});
