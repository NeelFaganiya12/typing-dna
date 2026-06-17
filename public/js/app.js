/* global TypingDNA */

const tdna = new TypingDNA();
tdna.addTarget('typingInput');

const els = {
  userId: document.getElementById('userId'),
  phrase: document.getElementById('phrase'),
  patternType: document.getElementById('patternType'),
  typingInput: document.getElementById('typingInput'),
  patternOutput: document.getElementById('patternOutput'),
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
