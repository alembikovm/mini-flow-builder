import { expect, test } from '@playwright/test';

test('add text → scrub padding → undo restores value', async ({ page }) => {
  await page.goto('/');

  // Editor chrome is up: the top bar input is present.
  await expect(page.getByRole('textbox', { name: 'Flow name' })).toBeVisible();

  // Baseline count of text nodes rendered on the current (Welcome) screen.
  // Each node renders a [data-node-id] element; non-stacks are leaves.
  const stageSelector = '.mfb-stage, [class*=phoneScreen]';
  await page.waitForSelector(stageSelector);

  // --- Add a Text element from the palette ----------------------------------
  const before = await page.locator(`${stageSelector} [data-node-id]`).count();
  const paletteText = page.getByTitle('Add Stack');
  await paletteText.click();
  await expect(page.locator(`${stageSelector} [data-node-id]`)).toHaveCount(before + 1);

  // The newly-added node is selected: the inspector header should say "Stack".
  await expect(page.locator('aside', { hasText: 'Stack' }).first()).toBeVisible();

  // --- Scrub padding Top via its NumberInput --------------------------------
  // The Spacing section exposes four labelled number inputs (T/R/B/L).
  // We scope to the Spacing section and target its first input (T).
  const spacingHeading = page.getByText('Spacing', { exact: true });
  await expect(spacingHeading).toBeVisible();

  // The T input is the first numeric field under Spacing. We click it, select
  // all, type 40, blur.
  const spacingSection = spacingHeading.locator('..');
  const tInput = spacingSection.locator('input').first();
  await tInput.click();
  await tInput.press('ControlOrMeta+a');
  await tInput.fill('40');
  await tInput.press('Enter');
  await expect(tInput).toHaveValue('40');

  // --- Undo twice: once for the padding change, once for the add -----------
  await page.getByRole('button', { name: 'Undo' }).click(); // revert padding
  await expect(tInput).not.toHaveValue('40');

  await page.getByRole('button', { name: 'Undo' }).click(); // revert add
  await expect(page.locator(`${stageSelector} [data-node-id]`)).toHaveCount(before);
});
