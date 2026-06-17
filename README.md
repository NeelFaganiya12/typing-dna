# TypingDNA Research Oracle

A minimal grey-box testbed for replicating server-side behavioral biometrics research (similar in spirit to *Understanding Server-side Commercial Fingerprinting*, but for keystroke dynamics).

## What this is

1. **A simple website** — captures typing via the TypingDNA JavaScript recorder
2. **A server-side oracle** — your backend proxies calls to TypingDNA so API secrets stay off the client
3. **Research hooks** — raw pattern export, pattern injection, request logging, Playwright mutation scripts

## Quick start

### 1. Get TypingDNA credentials

Sign up for a free [Starter account](https://www.typingdna.com/) and copy your `apiKey` and `apiSecret`.

### 2. Configure

```bash
cp .env.example .env
# Edit .env and paste your credentials
```

### 3. Install and run

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Basic workflow

1. Set a **User ID** (pseudonym, min 6 chars)
2. Type the fixed phrase: `your typing biometrics are unique`
3. Click **Auto** three times to enroll (first 3 patterns are enrollment only)
4. Type again and click **Verify** — observe the 0–100 score
5. Use **Inject mutated pattern** to paste modified `tp` strings for grey-box tests

All API responses are logged to `logs/research.log`.

## Playwright automation

```bash
npx playwright install chromium

# Baseline human-like typing
npm run crawler:baseline

# Mutated timing (adjust dwell/flight)
DWELL_MS=100 FLIGHT_MS=30 npm run crawler:mutate

# Robotic uniform cadence
UNIFORM=1 DWELL_MS=50 FLIGHT_MS=50 npm run crawler:mutate
```

## API endpoints (local oracle)

| Method | Path | TypingDNA action |
|--------|------|------------------|
| GET | `/api/health` | Config check |
| GET | `/api/user/:userId` | Check enrollments |
| POST | `/api/auto/:userId` | Auto enroll/verify |
| POST | `/api/save/:userId` | Enroll only |
| POST | `/api/verify/:userId` | Verify only |
| DELETE | `/api/user/:userId` | Delete user |

Request body for POST endpoints: `{ "tp": "<typing pattern>", "quality": 2 }`

## Is TypingDNA the right approach?

**Yes, for this research design — with caveats.**

| Criterion | TypingDNA | Why it matters |
|-----------|-----------|----------------|
| Public API + scores | Yes (0–100) | Mirrors Fingerprint Pro's observable server response |
| Self-serve trial | Yes | No enterprise sales gate |
| Clear modality | Keystroke dynamics only | Isolates behavioral biometrics |
| Grey-box oracle | You control frontend + backend | Can mutate inputs and observe score changes |
| Open recorder | JS SDK is open source | You can inspect what is sent |

**Limitations to plan for:**

- **Proprietary pattern format** — the `tp` string is encoded; mutating dwell/flight at the *event* level (via Playwright) is more reliable than hand-editing the string
- **SameText requirement** — enrollment and verification must use identical text (built into this testbed)
- **3-pattern minimum** — verification only starts after 3 enrollments via `/auto`
- **Not a perfect Fingerprint Pro analog** — behavioral biometrics scores depend on *how* you type, not just browser attributes; your mutation vectors differ from the original paper
- **Rate limits** — Starter plan has throughput caps; batch experiments may need pacing

**Alternative vendors** (if TypingDNA doesn't fit later): BioCatch, BehavioSec, and Plurilock offer enterprise behavioral biometrics but typically lack public self-serve APIs — harder to replicate the paper's methodology.

## Suggested research workflow

```
Enroll baseline (3× Auto)
    ↓
Capture human verify scores (N samples)
    ↓
Mutate timing via Playwright (dwell, flight, uniform cadence)
    ↓
Inject modified patterns / re-type with mutations
    ↓
Plot score distribution vs mutation magnitude
    ↓
Test threshold boundaries (what score flips result 0→1?)
```

## Project structure

```
server.js              Express oracle (proxies TypingDNA)
lib/typingdna-client.js
public/                Web UI + TypingDNA recorder
scripts/               Playwright baseline & mutation runners
logs/research.log      Auto-generated API log
```
