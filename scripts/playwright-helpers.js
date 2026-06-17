export const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
export const USER_ID = process.env.USER_ID || 'research_user_01';
export const PHRASE = process.env.PHRASE || 'your typing biometrics are unique';

export async function openTestbed(page) {
  console.log(`Opening ${BASE_URL} …`);

  await page.goto(BASE_URL, {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });

  await page.waitForSelector('#typingInput', { timeout: 15_000 });
  await page.waitForFunction(() => typeof window.TypingDNA === 'function', {
    timeout: 15_000,
  });
}

export function getTimingConfig() {
  return {
    dwellMs: Number(process.env.DWELL_MS || 108),
    flightMs: Number(process.env.FLIGHT_MS || 97),
    uniform: process.env.UNIFORM === '1',
  };
}

function jitter(base, uniform) {
  if (uniform) return base;
  const spread = base * 0.3;
  return base + (Math.random() * spread * 2 - spread);
}

export async function typeWithTiming(page, text, config = getTimingConfig()) {
  for (const char of text) {
    await page.keyboard.down(char);
    await page.waitForTimeout(jitter(config.dwellMs, config.uniform));
    await page.keyboard.up(char);
    await page.waitForTimeout(jitter(config.flightMs, config.uniform));
  }
}

export async function waitForApiResponse(page) {
  await page.waitForFunction(
    () => {
      const text = document.getElementById('responseOutput')?.textContent || '';
      return text.length > 0 && text !== 'Loading…' && text !== 'No API call yet.';
    },
    { timeout: 30_000 }
  );
  return page.locator('#responseOutput').textContent();
}
