import dotenv from 'dotenv';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Research oracle running at http://localhost:${PORT}`);
    if (!process.env.TYPINGDNA_API_KEY || !process.env.TYPINGDNA_API_SECRET) {
      console.warn('Warning: copy .env.example to .env and add your TypingDNA credentials.');
    }
  });
}
