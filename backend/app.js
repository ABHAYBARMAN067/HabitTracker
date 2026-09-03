const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const createApp = () => {
  const app = express();
  const rawOrigins = (process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map(origin => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  const allowedOrigins = Array.from(new Set(['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5000', ...rawOrigins]));

  app.use(cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/+$/, '');
      if (allowedOrigins.includes(normalized) || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // For local development or configured origins
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));
  app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 50, message: { msg: 'Too many authentication attempts. Please try again later.' } }), require('./routes/auth'));
  app.use('/api/habits', require('./routes/habits'));
  app.use('/api/analytics', require('./routes/analytics'));
  app.use('/api/users', require('./routes/users'));
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    const fs = require('fs');
    const frontendDistPath = path.join(__dirname, '../frontend/dist');
    const indexHtmlPath = path.join(frontendDistPath, 'index.html');

    if (fs.existsSync(indexHtmlPath)) {
      app.use(express.static(frontendDistPath));
      app.get('*', (req, res) => {
        res.sendFile(indexHtmlPath);
      });
    } else {
      app.get('/', (req, res) => {
        res.send('API is running... (Frontend build not found)');
      });
    }
  } else {
    app.get('/', (req, res) => {
      res.send('API is running...');
    });
  }

  // Global error handler
  app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    res.status(err.status || 500).json({ msg: err.message || 'Server error' });
  });

  return app;
};

module.exports = createApp;
