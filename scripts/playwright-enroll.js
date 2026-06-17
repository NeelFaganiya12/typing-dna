/**
 * Enroll a crawler user via Playwright (3× Auto enrollments).
 *
 * Usage:
 *   npm start   (in another terminal)
 *   USER_ID=crawler1 npm run crawler:enroll
 *
 * Env: BASE_URL, USER_ID, PHRASE, DWELL_MS, FLIGHT_MS, UNIFORM=1, ENROLL_COUNT=3
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

const ENROLL_COUNT = Number(process.env.ENROLL_COUNT || 3);

async function enrollOnce(page, trial) {
  await page.fill('#typingInput', '');
  await page.click('#btnReset');
  await page.focus('#typingInput');

  console.log(`\nEnrollment ${trial}/${ENROLL_COUNT} …`);
  await typeWithTiming(page, PHRASE);

  await page.click('#btnCapture');
  await page.click('#btnAuto');

  const response = await waitForApiResponse(page);
  console.log(response);
  return response;
}

async function main() {
  const config = getTimingConfig();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await openTestbed(page);
  await page.fill('#userId', USER_ID);

  console.log(`Enrolling user: ${USER_ID}`);
  console.log(`Phrase: "${PHRASE}"`);
  console.log(`Timing: dwell=${config.dwellMs}ms flight=${config.flightMs}ms uniform=${config.uniform}`);

  for (let i = 1; i <= ENROLL_COUNT; i++) {
    await enrollOnce(page, i);
  }

  await page.click('#btnUser');
  const userInfo = await waitForApiResponse(page);
  console.log('\n--- Enrollment complete ---');
  console.log(userInfo);

  await browser.close();
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
