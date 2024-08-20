import { test, expect } from '@playwright/test';
import { goldBarsPage, Position } from '../classes/goldBars.page';

test.describe('Gold Bar Weighing Puzzle functions as expected', async() => {
  test('Fake Gold Bar can be identified successfully using measuring logic', async ({ page }) => {
    // Navigate to page and assert basic functionality.
    const goldBars = new goldBarsPage(page);
    await page.goto('/');
    await expect(page).toHaveTitle(/React App/);

    // Attempt to identify a fake gold bar using the UI's weighing puzzle.
    const suspectedFakeBar = await goldBars.compareBars();
    const result = await goldBars.accuseBar(suspectedFakeBar);
    expect(result).toBe('Yay! You find it!');

    // Assert that a 'real bar' provides a different result when selected.
    const realBar = await goldBars.getRandomRealBar();
    const resultReal = await goldBars.accuseBar(realBar);
    expect(resultReal).toBe('Oops! Try Again!');
  });

  test('Weight comparison fails when duplicate values exist', async ({ page }) => {
    const goldBars = new goldBarsPage(page);
    await page.goto('/');

    // Fill both the left and right scales with the "0" index gold bar.
    await goldBars.scaleItem(Position.left, 0).fill("0");
    await goldBars.scaleItem(Position.right, 0).fill("0");

    // Attempt to catch a UI validation error that should prevent this scenario.
    let alertText = "";
    page.on("dialog", async (alert) => {
      alertText = alert.message()
      await alert.accept('OK');
    });
    await goldBars.weighButton.click();
    await page.waitForTimeout(5000); // Sleep required to wait for weight processing to complete. No clear network event to wait on.
    expect(alertText).toBe('Inputs are invalid: Both sides have coin(s): 0');

    await goldBars.scaleItem(Position.right, 1).fill("0"); // Insert another duplicate value on the right side.
    await goldBars.weighButton.click();
    await page.waitForTimeout(5000);
    expect(alertText).toBe('Inputs are invalid: Right side has duplicates');
  });
});

