/* global TypingDNA */

const tdna = new TypingDNA();
tdna.addTarget('typingInput');

const els = {
  userId: document.getElementById('userId'),
  phrase: document.getElementById('phrase'),
  patternType: document.getElementById('patternType'),
  typingInput: document.getElementById('typingInput'),
  patternOutput: document.getElementById('patternOutput'),
  timingStats: document.getElementById('timingStats'),
  injectedPattern: document.getElementById('injectedPattern'),
  responseOutput: document.getElementById('responseOutput'),
  scoreDisplay: document.getElementById('scoreDisplay'),
  scoreValue: document.getElementById('scoreValue'),
  resultBadge: document.getElementById('resultBadge'),
  actionLabel: document.getElementById('actionLabel'),
  statusBadge: document.getElementById('status-badge'),
};

let lastCapturedPattern = '';

async function checkHealth() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    if (data.typingdnaConfigured) {
      els.statusBadge.textContent = 'TypingDNA configured';
      els.statusBadge.className = 'badge badge-ok';
    } else {
      els.statusBadge.textContent = 'Add API keys to .env';
      els.statusBadge.className = 'badge badge-error';
    }
  } catch {
    els.statusBadge.textContent = 'Server offline';
    els.statusBadge.className = 'badge badge-error';
  }
}

function getUserId() {
  return els.userId.value.trim();
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function decodePatternTimings(pattern, patternType) {
  const segments = pattern.split('|').slice(1);
  if (!segments.length) return null;

  const keystrokes = segments.map((segment) => {
    const parts = segment.split(',').map(Number);
    if (patternType === 2 && parts.length >= 4) {
      return {
        char: String.fromCharCode(parts[0]),
        seek: parts[1],
        dwell: parts[2],
      };
    }
    if (parts.length >= 2) {
      return { char: '?', seek: parts[0], dwell: parts[1] };
    }
    return null;
  }).filter(Boolean);

  if (!keystrokes.length) return null;

  const dwells = keystrokes.map((k) => k.dwell);
  const seeks = keystrokes.slice(1).map((k) => k.seek);
  const flights = [];
  for (let i = 0; i < keystrokes.length - 1; i++) {
    flights.push(keystrokes[i + 1].seek - keystrokes[i].dwell);
  }
  const positiveFlights = flights.filter((f) => f > 0);

  return {
    keystrokes,
    dwell: {
      median: Math.round(median(dwells)),
      mean: Math.round(dwells.reduce((a, b) => a + b, 0) / dwells.length),
      min: Math.min(...dwells),
      max: Math.max(...dwells),
    },
    flight: {
      median: Math.round(median(positiveFlights)),
      mean: positiveFlights.length
        ? Math.round(positiveFlights.reduce((a, b) => a + b, 0) / positiveFlights.length)
        : 0,
    },
    seek: {
      median: Math.round(median(seeks)),
    },
    overlapCount: flights.filter((f) => f <= 0).length,
    recommended: {
      dwellMs: Math.round(median(dwells)),
      flightMs: Math.round(median(positiveFlights)) || Math.round(median(seeks)),
    },
  };
}

function showTimingStats(pattern, patternType) {
  const stats = decodePatternTimings(pattern, patternType);
  if (!stats) {
    els.timingStats.classList.add('hidden');
    return;
  }

  els.timingStats.classList.remove('hidden');
  els.timingStats.innerHTML = `
    <dl>
      <div><dt>Dwell (median)</dt><dd>${stats.dwell.median} ms</dd></div>
      <div><dt>Dwell (mean)</dt><dd>${stats.dwell.mean} ms</dd></div>
      <div><dt>Dwell (range)</dt><dd>${stats.dwell.min}–${stats.dwell.max} ms</dd></div>
      <div><dt>Flight (median)</dt><dd>${stats.flight.median} ms</dd></div>
      <div><dt>Seek (median)</dt><dd>${stats.seek.median} ms</dd></div>
      <div><dt>Key overlap</dt><dd>${stats.overlapCount} keys</dd></div>
    </dl>
    <p class="hint-line">
      Suggested crawler settings:
      <strong>DWELL_MS=${stats.recommended.dwellMs}</strong>
      <strong>FLIGHT_MS=${stats.recommended.flightMs}</strong>
      · Dwell = key hold time · Flight ≈ gap after release before next key
    </p>
  `;
}

function capturePattern() {
  const type = Number(els.patternType.value);
  const text = els.phrase.value;
  const textId = TypingDNA.getTextId(text);

  const pattern = tdna.getTypingPattern({
    type,
    text,
    textId,
    targetId: 'typingInput',
    caseSensitive: false,
  });

  lastCapturedPattern = pattern;
  els.patternOutput.textContent = pattern || '(empty — type the full phrase first)';
  els.injectedPattern.value = pattern;
  if (pattern) showTimingStats(pattern, type);
  else els.timingStats.classList.add('hidden');
  return pattern;
}

function displayResponse(data) {
  els.responseOutput.textContent = JSON.stringify(data, null, 2);

  if (typeof data.score === 'number') {
    els.scoreDisplay.classList.remove('hidden');
    els.scoreValue.textContent = data.score;
    els.resultBadge.textContent = data.result === 1 ? 'Match' : 'No match';
    els.resultBadge.className = `badge ${data.result === 1 ? 'badge-match' : 'badge-no-match'}`;
    els.actionLabel.textContent = data.action ? `Action: ${data.action}` : '';
  } else if (data.enrollment === 1) {
    els.scoreDisplay.classList.remove('hidden');
    els.scoreValue.textContent = '—';
    els.resultBadge.textContent = 'Enrolled';
    els.resultBadge.className = 'badge badge-ok';
    els.actionLabel.textContent = data.action ? `Action: ${data.action}` : '';
  } else {
    els.scoreDisplay.classList.add('hidden');
  }
}

async function apiCall(method, path, body) {
  const userId = getUserId();
  if (userId.length < 6) {
    alert('User ID must be at least 6 characters.');
    return;
  }

  const options = { method };
  if (body) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  }

  els.responseOutput.textContent = 'Loading…';

  const res = await fetch(path, options);
  const data = await res.json();
  displayResponse(data);
  return data;
}

document.getElementById('btnReset').addEventListener('click', () => {
  tdna.reset();
  els.typingInput.value = '';
  els.patternOutput.textContent = 'Recorder reset. Type the phrase again.';
  els.timingStats.classList.add('hidden');
});

document.getElementById('btnCapture').addEventListener('click', () => {
  capturePattern();
});

document.getElementById('btnAuto').addEventListener('click', async () => {
  const tp = capturePattern();
  if (!tp) return alert('Capture a pattern first by typing the phrase.');
  await apiCall('POST', `/api/auto/${encodeURIComponent(getUserId())}`, { tp });
});

document.getElementById('btnSave').addEventListener('click', async () => {
  const tp = capturePattern();
  if (!tp) return alert('Capture a pattern first by typing the phrase.');
  await apiCall('POST', `/api/save/${encodeURIComponent(getUserId())}`, { tp });
});

document.getElementById('btnVerify').addEventListener('click', async () => {
  const tp = capturePattern();
  if (!tp) return alert('Capture a pattern first by typing the phrase.');
  await apiCall('POST', `/api/verify/${encodeURIComponent(getUserId())}`, { tp, quality: 2 });
});

document.getElementById('btnUser').addEventListener('click', async () => {
  await apiCall('GET', `/api/user/${encodeURIComponent(getUserId())}`);
});

document.getElementById('btnDelete').addEventListener('click', async () => {
  if (!confirm(`Delete all enrolled patterns for "${getUserId()}"?`)) return;
  await apiCall('DELETE', `/api/user/${encodeURIComponent(getUserId())}`);
});

document.getElementById('btnInjectVerify').addEventListener('click', async () => {
  const tp = els.injectedPattern.value.trim();
  if (!tp) return alert('Paste a typing pattern first.');
  await apiCall('POST', `/api/verify/${encodeURIComponent(getUserId())}`, { tp, quality: 2 });
});

document.getElementById('btnCopyPattern').addEventListener('click', async () => {
  const text = lastCapturedPattern || els.injectedPattern.value;
  if (!text) return alert('No pattern to copy.');
  await navigator.clipboard.writeText(text);
});

checkHealth();
