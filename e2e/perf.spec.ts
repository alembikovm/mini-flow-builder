// Measures per-node render isolation: after 500 nodes exist, changing a style
// on one node must re-render only a handful of NodeMounts (ideally just the
// root being edited), not all 500 children.
//
// The counter is instrumented in src/widgets/canvas/NodeMount.tsx (dev only).

import { expect, test } from '@playwright/test';

test('stress: changing a style on one node renders few NodeMounts', async ({ page }) => {
  await page.goto('/');

  // Fresh state.
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByRole('button', { name: /Stress test/ }).click();

  // Stress screen: 1 root stack + 500 text rows = 501 data-node-id elements.
  await expect(page.locator('[data-node-id]')).toHaveCount(501, { timeout: 10_000 });

  // Select the root stack via a child → Escape.
  const firstRow = page.locator('[data-node-id]').filter({ hasText: 'Row 1' }).first();
  await firstRow.click();
  await page.keyboard.press('Escape');

  // Focus the Gap input first so focus-related renders settle, THEN zero the
  // counter, THEN commit the change. The counter now reflects renders caused
  // by the mutation itself and nothing else.
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
