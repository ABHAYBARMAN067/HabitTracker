const express = require('express');
const auth = require('../middleware/auth');
const Habit = require('../models/Habit');

const router = express.Router();

// Get all habits for a user
router.get('/', auth, async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.user.id });
    res.json(habits);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create a new habit
router.post('/', auth, async (req, res) => {
  const { name, color } = req.body;

  try {
    const newHabit = new Habit({
      name,
      color,
      user: req.user.id,
    });

    const habit = await newHabit.save();
    res.json(habit);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update habit entry
router.put('/:id/entry', auth, async (req, res) => {
  const { date, status } = req.body;

  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit) {
      return res.status(404).json({ msg: 'Habit not found' });
    }

    if (habit.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const entryIndex = habit.entries.findIndex(entry => entry.date.toDateString() === new Date(date).toDateString());

    if (entryIndex > -1) {
      habit.entries[entryIndex].status = status;
    } else {
      habit.entries.push({ date, status });
    }

    await habit.save();
    res.json(habit);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete a habit
router.delete('/:id', auth, async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);
    if (!habit) {
      return res.status(404).json({ msg: 'Habit not found' });
    }

    if (habit.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await Habit.findByIdAndRemove(req.params.id);
    res.json({ msg: 'Habit removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
