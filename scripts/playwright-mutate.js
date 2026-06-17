/**
 * Playwright mutation test: type with controlled dwell/flight timing.
 *
 * Usage:
 *   npm start   (in another terminal)
 *   npm run crawler:mutate
 *
 * Env: BASE_URL, USER_ID, PHRASE, DWELL_MS, FLIGHT_MS, UNIFORM=1
 */

import { chromium } from 'playwright';
import {
  USER_ID,
  PHRASE,
  openTestbed,
  getTimingConfig,
  typeWithTiming,
  waitForApiResponse,
} from './playwright-helpers.js';

async function main() {
  const config = getTimingConfig();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await openTestbed(page);

  await page.fill('#userId', USER_ID);
  await page.click('#btnReset');
  await page.focus('#typingInput');

  console.log(`Typing with dwell=${config.dwellMs}ms flight=${config.flightMs}ms uniform=${config.uniform}`);
  await typeWithTiming(page, PHRASE);

  await page.click('#btnCapture');
  await page.click('#btnVerify');

  const response = await waitForApiResponse(page);
  const scoreMatch = response.match(/"score":\s*(\d+)/);
  const resultMatch = response.match(/"result":\s*(\d)/);

  console.log('\n--- Mutation result ---');
  if (scoreMatch) console.log(`Score: ${scoreMatch[1]}`);
  if (resultMatch) console.log(`Result: ${resultMatch[1] === '1' ? 'match' : 'no match'}`);
  console.log(response);

  await browser.close();
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
