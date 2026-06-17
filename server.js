import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  typingDnaRequest,
  typingDnaGet,
  typingDnaDelete,
} from './lib/typingdna-client.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const LOG_DIR = path.join(__dirname, 'logs');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

function logResearchEvent(entry) {
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    ...entry,
  });

  fs.appendFileSync(path.join(LOG_DIR, 'research.log'), `${line}\n`);
}

function validateUserId(userId) {
  if (!userId || userId.length < 6 || userId.length > 256) {
    return 'userId must be between 6 and 256 characters';
  }
  return null;
}

app.get('/api/health', (_req, res) => {
  const configured = Boolean(
    process.env.TYPINGDNA_API_KEY && process.env.TYPINGDNA_API_SECRET
  );

  res.json({
    ok: true,
    typingdnaConfigured: configured,
  });
});

app.get('/api/user/:userId', async (req, res) => {
  const error = validateUserId(req.params.userId);
  if (error) return res.status(400).json({ error });

  try {
    const result = await typingDnaGet('user', req.params.userId);
    logResearchEvent({ action: 'user', userId: req.params.userId, response: result.data });
    res.status(result.status).json(result.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auto/:userId', async (req, res) => {
  const error = validateUserId(req.params.userId);
  if (error) return res.status(400).json({ error });
  if (!req.body.tp) return res.status(400).json({ error: 'tp (typing pattern) is required' });

  try {
    const result = await typingDnaRequest('auto', req.params.userId, {
      tp: req.body.tp,
      custom_field: req.body.custom_field,
    });
    logResearchEvent({
      action: 'auto',
      userId: req.params.userId,
      tpLength: req.body.tp.length,
      response: result.data,
    });
    res.status(result.status).json(result.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/save/:userId', async (req, res) => {
  const error = validateUserId(req.params.userId);
  if (error) return res.status(400).json({ error });
  if (!req.body.tp) return res.status(400).json({ error: 'tp (typing pattern) is required' });

  try {
    const result = await typingDnaRequest('save', req.params.userId, {
      tp: req.body.tp,
      custom_field: req.body.custom_field,
    });
    logResearchEvent({
      action: 'save',
      userId: req.params.userId,
      tpLength: req.body.tp.length,
      response: result.data,
    });
    res.status(result.status).json(result.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/verify/:userId', async (req, res) => {
  const error = validateUserId(req.params.userId);
  if (error) return res.status(400).json({ error });
  if (!req.body.tp) return res.status(400).json({ error: 'tp (typing pattern) is required' });

  try {
    const result = await typingDnaRequest('verify', req.params.userId, {
      tp: req.body.tp,
      quality: req.body.quality ?? 2,
      custom_field: req.body.custom_field,
    });
    logResearchEvent({
      action: 'verify',
      userId: req.params.userId,
      tpLength: req.body.tp.length,
      quality: req.body.quality ?? 2,
      response: result.data,
    });
    res.status(result.status).json(result.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/user/:userId', async (req, res) => {
  const error = validateUserId(req.params.userId);
  if (error) return res.status(400).json({ error });

  try {
    const result = await typingDnaDelete(req.params.userId);
    logResearchEvent({ action: 'delete', userId: req.params.userId, response: result.data });
    res.status(result.status).json(result.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Research oracle running at http://localhost:${PORT}`);
  if (!process.env.TYPINGDNA_API_KEY || !process.env.TYPINGDNA_API_SECRET) {
    console.warn('Warning: copy .env.example to .env and add your TypingDNA credentials.');
  }
});
