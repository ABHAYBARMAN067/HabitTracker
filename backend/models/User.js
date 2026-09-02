const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  settings: {
    theme: { type: String, enum: ['dark', 'light', 'system'], default: 'dark' },
    notificationsEnabled: { type: Boolean, default: false },
    reminderTime: { type: String, default: '20:00' },
  },
});

module.exports = mongoose.model('User', userSchema);
