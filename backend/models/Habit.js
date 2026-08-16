const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  color: {
    type: String,
    default: '#7C3AED',
  },
  icon: { type: String, default: '✓', maxlength: 8 },
  category: { type: String, default: 'General', maxlength: 40 },
  frequency: { type: String, enum: ['daily', 'weekly', 'specific-days'], default: 'daily' },
  daysOfWeek: [{ type: Number, min: 0, max: 6 }],
  target: { type: String, default: '', maxlength: 100 },
  archived: { type: Boolean, default: false },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  entries: [{
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['done', 'missed', 'not-marked'],
      default: 'not-marked',
    },
  }],
});

habitSchema.index({ user: 1, archived: 1, createdAt: -1 });

module.exports = mongoose.model('Habit', habitSchema);
