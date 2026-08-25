require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');

const connectDB = require('./config/db');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// ─── App Init ────────────────────────────────────────────────────────────────
const app = express();

// Connect Database
connectDB();

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,          // Disabled – frontend uses inline scripts/styles and external images
  crossOriginEmbedderPolicy: false,
}));                       // Secure HTTP headers

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5000', 'http://localhost:5500', 'http://127.0.0.1:5500'];

app.use(
  cors({
    origin: (origin, cb) => {
      // In production on Render, allow all origins (same-origin requests from the server itself)
      if (!origin) return cb(null, true);
      // Allow same-host Render URLs and any configured origin
      if (
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV === 'production' ||
        origin.endsWith('.onrender.com')
      ) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(mongoSanitize());                // Prevent NoSQL injection

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Logging ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      stream: { write: (msg) => logger.http(msg.trim()) },
      skip: (req) => req.path === '/api/health',
    })
  );
}

// ─── Rate Limiting ───────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests – please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts – please try again in 15 minutes.' },
});

app.use('/api/', globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ─── Static Files ────────────────────────────────────────────────────────────
// Force browsers to re-validate HTML & JS so stale caches never cause issues
app.use((req, res, next) => {
  if (req.path.endsWith('.html') || req.path === '/' ||
      req.path.endsWith('.js') || req.path.endsWith('.css')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});
app.use(express.static(path.join(__dirname, '../frontend')));

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));

// ─── AI Chat Route (Groq) ─────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  try {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
      return res.status(500).json({ error: { message: '⚠️ GROQ_API_KEY is not configured on the server.' } });
    }

    const { contents } = req.body;
    if (!contents || !Array.isArray(contents) || contents.length === 0) {
      return res.status(400).json({ error: { message: 'Invalid request: contents array is required.' } });
    }

    // Convert Gemini-style contents → OpenAI/Groq messages format
    const messages = [];
    let startIdx = 0;

    // First user message is the system prompt
    if (contents[0]?.role === 'user') {
      messages.push({ role: 'system', content: contents[0].parts?.[0]?.text || '' });
      startIdx = 1;
    }
    // Skip "Understood!" model acknowledgment
    if (contents[startIdx]?.role === 'model') startIdx++;

    // Convert remaining conversation history
    for (let i = startIdx; i < contents.length; i++) {
      const msg = contents[i];
      messages.push({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.parts?.[0]?.text || ''
      });
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, temperature: 0.7, max_tokens: 1024, top_p: 0.9 })
    });

    const data = await groqRes.json();
    if (!groqRes.ok) {
      return res.status(groqRes.status).json({ error: { message: data?.error?.message || 'Groq API Error' } });
    }

    const text = data?.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
    res.json({ candidates: [{ content: { parts: [{ text }] }, finishReason: 'STOP' }] });

  } catch (err) {
    logger.error('AI Chat Error: ' + err.message);
    res.status(500).json({ error: { message: 'Internal server error: ' + err.message } });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SmartCart API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// SPA fallback (non-API routes)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, '../frontend/index.html'), (err) => {
    if (err) next(); // Frontend not mounted – ignore
  });
});

// ─── Error Handling ──────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`🚀 SmartCart API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

// Graceful shutdown — log unhandled rejections but DO NOT exit (MongoDB timeouts etc. should not crash the server)
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err?.message || err}`);
  // Do NOT exit — keep serving requests even if DB/external service fails
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received – shutting down gracefully');
  server.close(() => process.exit(0));
});

module.exports = app;
