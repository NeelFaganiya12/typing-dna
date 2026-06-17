/**
 * Playwright baseline: records a human typing session through the web UI.
 *
 * Usage:
 *   npm start   (in another terminal)
 *   npm run crawler:baseline
 *
 * Env: BASE_URL, USER_ID, HEADLESS=1 (default: visible browser)
 */

import { chromium } from 'playwright';
import { BASE_URL, USER_ID, PHRASE, openTestbed } from './playwright-helpers.js';

async function main() {
  const headless = process.env.HEADLESS === '1';

  const browser = await chromium.launch({ headless, slowMo: headless ? 0 : 50 });
  const page = await browser.newPage();

  await openTestbed(page);

  await page.fill('#userId', USER_ID);
  await page.fill('#typingInput', '');
  await page.click('#btnReset');
  await page.focus('#typingInput');

  console.log(`Typing phrase: "${PHRASE}"`);
  await page.keyboard.type(PHRASE, { delay: 120 });

  await page.click('#btnCapture');
  await page.click('#btnAuto');

  await page.waitForFunction(
    () => {
      const text = document.getElementById('responseOutput')?.textContent || '';
      return text.length > 0 && text !== 'Loading…' && text !== 'No API call yet.';
    },
    { timeout: 30_000 }
  );

  const response = await page.locator('#responseOutput').textContent();
  console.log('\nAPI response:\n', response);

  if (!headless) await page.waitForTimeout(3000);
  await browser.close();
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
