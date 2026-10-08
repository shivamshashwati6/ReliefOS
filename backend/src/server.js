import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import aiRoutes from './routes/aiRoutes.js';

// Load environment variables from .env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Operational Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'RELIEF-OS Backend API',
    model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_api_key_here')
  });
});

// AI Routes
app.use('/api/ai', aiRoutes);

// Generic 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler - guarantees no stack traces or internal secrets leak to client
app.use((err, req, res, next) => {
  console.error('[Backend Server Error]:', err.message || err);
  res.status(500).json({ error: 'AI analysis is temporarily unavailable.' });
});

app.listen(PORT, () => {
  console.log(`[RELIEF-OS Backend] Server running on http://localhost:${PORT}`);
  console.log(`[RELIEF-OS Backend] Gemini Model: ${process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'}`);
});

export default app;
