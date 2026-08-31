const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Habit = require('../models/Habit');

const router = express.Router();
const publicUser = user => ({ id: user.id, username: user.username, email: user.email, settings: user.settings, createdAt: user.createdAt });

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    return res.json(publicUser(user));
  } catch (err) { return res.status(500).json({ msg: 'Server error' }); }
});

router.put('/me', auth, [
  body('username').optional().trim().isLength({ min: 3, max: 40 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('settings.theme').optional().isIn(['dark', 'light', 'system']),
  body('settings.reminderTime').optional().matches(/^([01]\d|2[0-3]):[0-5]\d$/),
  body('settings.notificationsEnabled').optional().isBoolean(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    const { username, email, settings } = req.body;
    if (email && email !== user.email && await User.exists({ email })) return res.status(409).json({ msg: 'Email already in use' });
    if (username) user.username = username.trim();
    if (email) user.email = email.toLowerCase();
    if (settings) user.settings = { ...user.settings.toObject(), ...settings };
    await user.save();
    return res.json(publicUser(user));
  } catch (err) { return res.status(500).json({ msg: 'Server error' }); }
});

router.put('/me/password', auth, [body('currentPassword').notEmpty(), body('newPassword').isLength({ min: 6 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const user = await User.findById(req.user.id);
    if (!user || !(await bcrypt.compare(req.body.currentPassword, user.password))) return res.status(400).json({ msg: 'Current password is incorrect' });
    user.password = await bcrypt.hash(req.body.newPassword, 10);
    await user.save();
    return res.status(204).end();
  } catch (err) { return res.status(500).json({ msg: 'Server error' }); }
});

router.delete('/me', auth, [body('password').notEmpty()], async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) return res.status(400).json({ msg: 'Password is incorrect' });
    await Habit.deleteMany({ user: user.id });
    await user.deleteOne();
    return res.status(204).end();
  } catch (err) { return res.status(500).json({ msg: 'Server error' }); }
});

module.exports = router;
