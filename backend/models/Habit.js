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
    default: '#007bff',
  },
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

module.exports = mongoose.model('Habit', habitSchema);
