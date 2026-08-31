const express = require('express');
const mongoose = require('mongoose');
const { body, param, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Habit = require('../models/Habit');

const router = express.Router();
const habitRules = [
  body('name').trim().isLength({ min: 1, max: 80 }),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/),
  body('icon').optional().isString().isLength({ max: 8 }),
  body('category').optional().trim().isLength({ max: 40 }),
  body('frequency').optional().isIn(['daily', 'weekly', 'specific-days']),
  body('daysOfWeek').optional().isArray(),
  body('daysOfWeek.*').optional().isInt({ min: 0, max: 6 }),
  body('target').optional().trim().isLength({ max: 100 }),
];
const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return false; }
  return true;
};
const findOwnedHabit = async (id, userId) => {
  if (!mongoose.isValidObjectId(id)) return null;
  return Habit.findOne({ _id: id, user: userId });
};

router.get('/', auth, async (req, res) => {
  try {
    const archived = req.query.archived === 'true';
    const habits = await Habit.find({ user: req.user.id, archived }).sort({ createdAt: -1 });
    res.json(habits);
  } catch (err) { res.status(500).json({ msg: 'Unable to load habits' }); }
});

router.post('/', auth, habitRules, async (req, res) => {
  if (!validate(req, res)) return;
  try {
    const habit = await Habit.create({ ...req.body, name: req.body.name.trim(), user: req.user.id });
    res.status(201).json(habit);
  } catch (err) { res.status(500).json({ msg: 'Unable to create habit' }); }
});

router.put('/:id', auth, param('id').isMongoId(), habitRules, async (req, res) => {
  if (!validate(req, res)) return;
  try {
    const habit = await findOwnedHabit(req.params.id, req.user.id);
    if (!habit) return res.status(404).json({ msg: 'Habit not found' });
    Object.assign(habit, req.body);
    await habit.save();
    return res.json(habit);
  } catch (err) { return res.status(500).json({ msg: 'Unable to update habit' }); }
});

router.put('/:id/archive', auth, param('id').isMongoId(), body('archived').isBoolean(), async (req, res) => {
  if (!validate(req, res)) return;
  try {
    const habit = await findOwnedHabit(req.params.id, req.user.id);
    if (!habit) return res.status(404).json({ msg: 'Habit not found' });
    habit.archived = req.body.archived;
    await habit.save();
    return res.json(habit);
  } catch (err) { return res.status(500).json({ msg: 'Unable to archive habit' }); }
});

router.put('/:id/entry', auth, [param('id').isMongoId(), body('date').isISO8601(), body('status').isIn(['done', 'missed', 'not-marked'])], async (req, res) => {
  if (!validate(req, res)) return;
  try {
    const habit = await findOwnedHabit(req.params.id, req.user.id);
    if (!habit) return res.status(404).json({ msg: 'Habit not found' });
    const entryDate = new Date(req.body.date);
    const dateKey = entryDate.toISOString().slice(0, 10);
    const entry = habit.entries.find(item => item.date.toISOString().slice(0, 10) === dateKey);
    if (entry) entry.status = req.body.status;
    else habit.entries.push({ date: entryDate, status: req.body.status });
    await habit.save();
    return res.json(habit);
  } catch (err) { return res.status(500).json({ msg: 'Unable to update entry' }); }
});

router.delete('/:id', auth, param('id').isMongoId(), async (req, res) => {
  if (!validate(req, res)) return;
  try {
    const habit = await findOwnedHabit(req.params.id, req.user.id);
    if (!habit) return res.status(404).json({ msg: 'Habit not found' });
    await habit.deleteOne();
    return res.status(204).end();
  } catch (err) { return res.status(500).json({ msg: 'Unable to delete habit' }); }
});

module.exports = router;
