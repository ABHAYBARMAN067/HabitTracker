const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const createApp = () => {
  const app = express();
  const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
  app.use(cors({ origin: allowedOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));
  app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { msg: 'Too many authentication attempts. Please try again later.' } }), require('./routes/auth'));
  app.use('/api/habits', require('./routes/habits'));
  app.use('/api/analytics', require('./routes/analytics'));
  app.use('/api/users', require('./routes/users'));
  return app;
};

module.exports = createApp;
