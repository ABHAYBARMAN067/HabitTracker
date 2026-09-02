const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { isMailConfigured, sendPasswordResetEmail } = require('../services/mailer');

const router = express.Router();
const jwtSecret = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'development-secret-change-me' : null);
const cookieOptions = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 1000,
};

const sendAuthResponse = (res, user) => {
  const payload = { user: { id: user.id } };
  if (!jwtSecret) throw new Error('JWT_SECRET must be configured in production');
  const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });
  res.cookie('token', token, cookieOptions);
  res.json({ token, user: { id: user.id, username: user.username, email: user.email, settings: user.settings } });
};

// Register
router.post('/register', [
  body('username').isLength({ min: 3 }),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const username = req.body.username.trim();
  const email = req.body.email.trim().toLowerCase();
  const { password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      username,
      email,
      password: await bcrypt.hash(password, 10),
    });

    await user.save();

    sendAuthResponse(res, user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Login
router.post('/login', [
  body('email').isEmail(),
  body('password').exists(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const email = req.body.email.trim().toLowerCase();
  const { password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    sendAuthResponse(res, user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', cookieOptions);
  res.status(204).end();
});

router.post('/forgot-password', [body('email').isEmail().normalizeEmail()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  if (!isMailConfigured()) return res.status(503).json({ msg: 'Email service is not configured. Please contact the administrator.' });

  try {
    const email = req.body.email.trim().toLowerCase();
    const user = await User.findOne({ email });

    // Always return the same response so this endpoint cannot reveal registered emails.
    if (!user) return res.json({ msg: 'If an account exists for that email, a reset link has been sent.' });

    const token = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    try {
      await sendPasswordResetEmail({ email: user.email, username: user.username, token });
    } catch (mailError) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      console.error('Password reset email failed:', mailError.message);
      return res.status(502).json({ msg: 'Unable to send reset email. Please try again later.' });
    }

    return res.json({ msg: 'If an account exists for that email, a reset link has been sent.' });
  } catch (err) {
    console.error('Password reset request failed:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/reset-password', [
  body('token').isLength({ min: 64, max: 64 }).isHexadecimal(),
  body('password').isLength({ min: 6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const hashedToken = crypto.createHash('sha256').update(req.body.token).digest('hex');
    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ msg: 'This reset link is invalid or has expired.' });

    user.password = await bcrypt.hash(req.body.password, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    return res.status(204).end();
  } catch (err) {
    console.error('Password reset failed:', err.message);
    return res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
