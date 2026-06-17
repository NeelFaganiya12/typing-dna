const BASE_URL = 'https://api.typingdna.com';

function getAuthHeader() {
  const apiKey = process.env.TYPINGDNA_API_KEY;
  const apiSecret = process.env.TYPINGDNA_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('Missing TYPINGDNA_API_KEY or TYPINGDNA_API_SECRET in .env');
  }

  const token = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  return `Basic ${token}`;
}

export async function typingDnaRequest(action, userId, body = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(body)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  }

  const response = await fetch(`${BASE_URL}/${action}/${encodeURIComponent(userId)}`, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cache-Control': 'no-cache',
    },
    body: params.toString(),
  });

  const text = await response.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

export async function typingDnaGet(action, userId) {
  const response = await fetch(`${BASE_URL}/${action}/${encodeURIComponent(userId)}`, {
    method: 'GET',
    headers: {
      Authorization: getAuthHeader(),
      'Cache-Control': 'no-cache',
    },
  });

  const text = await response.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

export async function typingDnaDelete(userId) {
  const response = await fetch(`${BASE_URL}/user/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: getAuthHeader(),
      'Cache-Control': 'no-cache',
    },
  });

  const text = await response.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}
