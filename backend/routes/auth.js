const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { isMailConfigured, sendPasswordResetOtpEmail, sendRegisterOtpEmail } = require('../services/mailer');

const router = express.Router();
const jwtSecret = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'development-secret-change-me' : null);
const isProduction = process.env.NODE_ENV === 'production';
const cookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? 'none' : 'lax',
  secure: isProduction,
  maxAge: 60 * 60 * 1000,
};

const sendAuthResponse = (res, user) => {
  const payload = { user: { id: user.id } };
  if (!jwtSecret) throw new Error('JWT_SECRET must be configured in production');
  const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });
  res.cookie('token', token, cookieOptions);
  res.json({ token, user: { id: user.id, username: user.username, email: user.email, settings: user.settings } });
};

// Check Session (graceful 200 OK check on app load)
router.get('/session', async (req, res) => {
  const legacyToken = req.header('x-auth-token') || req.cookies?.token;
  const authHeader = req.header('Authorization') || req.header('authorization');
  const token = legacyToken || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

  if (!token) {
    return res.json({ authenticated: false, user: null });
  }

  try {
    if (!jwtSecret) return res.json({ authenticated: false, user: null });
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.user?.id).select('-password');
    if (!user) {
      return res.json({ authenticated: false, user: null });
    }
    return res.json({
      authenticated: true,
      user: { id: user.id, username: user.username, email: user.email, settings: user.settings },
    });
  } catch (err) {
    return res.json({ authenticated: false, user: null });
  }
});

// Send Registration OTP
router.post('/send-register-otp', [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').trim().isEmail().normalizeEmail().withMessage('Please enter a valid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ msg: errors.array()[0]?.msg || 'Invalid input' });
  }

  const username = req.body.username.trim();
  const email = req.body.email.trim().toLowerCase();

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ msg: 'An account with this email already exists' });
      }
      return res.status(400).json({ msg: 'This username is already taken' });
    }

    if (!isMailConfigured()) {
      return res.status(503).json({ msg: 'Email service is not configured. Please contact the administrator.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    // Remove any previous OTP for this email and save new one
    await Otp.deleteMany({ email });
    await new Otp({ email, otp: hashedOtp }).save();

    await sendRegisterOtpEmail({ email, username, otp });

    return res.json({ msg: 'Verification code sent to your email.' });
  } catch (err) {
    console.error('Send OTP error:', err);
    return res.status(500).json({ msg: 'Could not send verification email. Please try again.' });
  }
});

// Register (with OTP verification)
router.post('/register', [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').trim().isEmail().normalizeEmail().withMessage('Please enter a valid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('Please enter a valid 6-digit OTP code'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ msg: errors.array()[0]?.msg || 'Invalid input' });
  }

  const username = req.body.username.trim();
  const email = req.body.email.trim().toLowerCase();
  const { password, otp } = req.body;

  try {
    let existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ msg: 'An account with this email already exists' });
      }
      return res.status(400).json({ msg: 'This username is already taken' });
    }

    // Verify OTP
    const hashedOtp = crypto.createHash('sha256').update(otp.trim()).digest('hex');
    const otpRecord = await Otp.findOne({ email, otp: hashedOtp });

    if (!otpRecord) {
      return res.status(400).json({ msg: 'Invalid or expired verification code. Please request a new OTP.' });
    }

    // Create user
    const user = new User({
      username,
      email,
      password: await bcrypt.hash(password, 10),
    });

    await user.save();

    // Delete used OTP
    await Otp.deleteMany({ email });

    sendAuthResponse(res, user);
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ msg: 'Server error during registration' });
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

    // Return safe message without leaking registered emails
    if (!user) return res.json({ msg: 'If an account exists for that email, a verification code has been sent.' });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    // Remove any previous OTP for this email and save new one
    await Otp.deleteMany({ email });
    await new Otp({ email, otp: hashedOtp }).save();

    await sendPasswordResetOtpEmail({ email: user.email, username: user.username, otp });

    return res.json({ msg: 'Verification code sent to your email.' });
  } catch (err) {
    console.error('Password reset OTP request failed:', err);
    return res.status(500).json({ msg: 'Could not send verification code. Please try again later.' });
  }
});

router.post('/reset-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email address'),
  body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('Please enter a valid 6-digit OTP code'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ msg: errors.array()[0]?.msg || 'Invalid input' });

  const email = req.body.email.trim().toLowerCase();
  const { otp, password } = req.body;

  try {
    const hashedOtp = crypto.createHash('sha256').update(otp.trim()).digest('hex');
    const otpRecord = await Otp.findOne({ email, otp: hashedOtp });

    if (!otpRecord) {
      return res.status(400).json({ msg: 'Invalid or expired verification code. Please request a new OTP.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'User account not found.' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Delete used OTP
    await Otp.deleteMany({ email });

    return res.json({ msg: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error('Password reset failed:', err.message);
    return res.status(500).json({ msg: 'Server error during password reset' });
  }
});

module.exports = router;
