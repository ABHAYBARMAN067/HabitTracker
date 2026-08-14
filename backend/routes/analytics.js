const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Habit = require('../models/Habit');
const { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, getWeek } = require('date-fns');

// Get weekly trends for the past 12 weeks
router.get('/weekly-trends', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const habits = await Habit.find({ userId });

    const weeks = [];
    const currentDate = new Date();

    for (let i = 11; i >= 0; i--) {
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(currentDate.getDate() - (7 * i));

      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() - weekEnd.getDay());

      const days = eachDayOfInterval({
        start: weekStart,
        end: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000),
      });

      let totalCompletion = 0;
      let completedHabits = 0;

      habits.forEach(habit => {
        const doneDays = days.filter(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const entry = habit.entries.find(e => format(new Date(e.date), 'yyyy-MM-dd') === dateStr);
          return entry && entry.status === 'done';
        }).length;

        const completionPercentage = days.length > 0 ? Math.round((doneDays / days.length) * 100) : 0;
        totalCompletion += completionPercentage;
        completedHabits++;
      });

      const averageCompletion = completedHabits > 0 ? Math.round(totalCompletion / completedHabits) : 0;

      weeks.push({
        week: format(weekStart, 'MMM d'),
        completion: averageCompletion,
        habitsCount: completedHabits,
      });
    }

    res.json({ success: true, data: weeks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get yearly heatmap data
router.get('/yearly-heatmap', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const habits = await Habit.find({ userId });

    const year = new Date().getFullYear();
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);

    const days = eachDayOfInterval({
      start: yearStart,
      end: yearEnd,
    });

    const heatmapData = {};

    days.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      let completedHabits = 0;

      habits.forEach(habit => {
        const entry = habit.entries.find(e => format(new Date(e.date), 'yyyy-MM-dd') === dateStr);
        if (entry && entry.status === 'done') {
          completedHabits++;
        }
      });

      const completionPercentage = habits.length > 0 ? Math.round((completedHabits / habits.length) * 100) : 0;
      heatmapData[dateStr] = completionPercentage;
    });

    const percentages = Object.values(heatmapData);
    const stats = {
      perfectDays: percentages.filter(p => p === 100).length,
      activeDays: percentages.filter(p => p > 0).length,
      averagePercentage: Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length),
    };

    res.json({ success: true, data: heatmapData, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get habit correlation analysis
router.get('/habit-correlation', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const habits = await Habit.find({ userId });

    if (habits.length < 2) {
      return res.json({ success: true, data: [], message: 'Need at least 2 habits for correlation analysis' });
    }

    const correlationMatrix = {};

    // Initialize correlation matrix
    habits.forEach((habit1, idx1) => {
      habits.forEach((habit2, idx2) => {
        if (idx1 !== idx2) {
          const key = [habit1._id, habit2._id].sort().join('-');
          if (!correlationMatrix[key]) {
            correlationMatrix[key] = {
              habit1Name: habit1.name,
              habit2Name: habit2.name,
              bothCompleted: 0,
              totalDays: 0,
              correlation: 0,
            };
          }
        }
      });
    });

    // Calculate correlations
    const currentMonth = new Date();
    const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = format(new Date(d), 'yyyy-MM-dd');

      habits.forEach((habit1, idx1) => {
        habits.forEach((habit2, idx2) => {
          if (idx1 < idx2) {
            const key = [habit1._id, habit2._id].sort().join('-');
            const entry1 = habit1.entries.find(e => format(new Date(e.date), 'yyyy-MM-dd') === dateStr);
            const entry2 = habit2.entries.find(e => format(new Date(e.date), 'yyyy-MM-dd') === dateStr);

            const habit1Done = entry1 && entry1.status === 'done';
            const habit2Done = entry2 && entry2.status === 'done';

            if (habit1Done && habit2Done) {
              correlationMatrix[key].bothCompleted++;
            }
            correlationMatrix[key].totalDays++;
          }
        });
      });
    }

    // Calculate correlation coefficient
    Object.values(correlationMatrix).forEach(data => {
      if (data.totalDays > 0) {
        data.correlation = Math.round((data.bothCompleted / data.totalDays) * 100);
      }
    });

    const correlations = Object.values(correlationMatrix).sort((a, b) => b.correlation - a.correlation);

    res.json({ success: true, data: correlations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get predictive analytics
router.get('/predictive-analytics', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const habits = await Habit.find({ userId });

    // Calculate historical trend for last 30 days
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');

      let totalCompletion = 0;
      habits.forEach(habit => {
        const entry = habit.entries.find(e => format(new Date(e.date), 'yyyy-MM-dd') === dateStr);
        if (entry && entry.status === 'done') {
          totalCompletion++;
        }
      });

      const completionPercentage = habits.length > 0 ? Math.round((totalCompletion / habits.length) * 100) : 0;
      last30Days.push({
        date: format(date, 'MMM dd'),
        completion: completionPercentage,
      });
    }

    // Linear regression
    const n = last30Days.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    last30Days.forEach((item, i) => {
      sumX += i;
      sumY += item.completion;
      sumXY += i * item.completion;
      sumX2 += i * i;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate forecast
    const forecast = [];
    for (let i = 0; i < 14; i++) {
      const predictedValue = Math.max(0, Math.min(100, Math.round(intercept + slope * (n + i))));
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i + 1);

      forecast.push({
        date: format(futureDate, 'MMM dd'),
        completion: predictedValue,
      });
    }

    // Calculate insights
    const recentTrend = last30Days.slice(-7).map(d => d.completion);
    const recentAvg = Math.round(recentTrend.reduce((a, b) => a + b, 0) / recentTrend.length);

    const volatility = Math.round(
      Math.sqrt(
        recentTrend.reduce((sum, val) => sum + Math.pow(val - recentAvg, 2), 0) / recentTrend.length
      )
    );

    res.json({
      success: true,
      data: {
        historical: last30Days,
        forecast: forecast,
        metrics: {
          recentAvg,
          slope,
          volatility,
          trendDirection: slope > 0 ? 'Improving' : slope < 0 ? 'Declining' : 'Stable',
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get data for export
router.get('/export-data', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const habits = await Habit.find({ userId });

    const exportData = {
      exportDate: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      habits: habits.map(habit => ({
        id: habit._id,
        name: habit.name,
        createdAt: habit.createdAt,
        entries: habit.entries.map(entry => ({
          date: format(new Date(entry.date), 'yyyy-MM-dd'),
          status: entry.status,
        })),
      })),
      summary: {
        totalHabits: habits.length,
        exportFormat: 'Complete Data Export',
      },
    };

    res.json({ success: true, data: exportData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
