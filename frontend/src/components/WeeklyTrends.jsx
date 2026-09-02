import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, startOfWeek, subWeeks, endOfWeek, eachDayOfInterval } from 'date-fns';
import { entryDateKey } from '../utils/dates';
import './WeeklyTrends.css';

const WeeklyTrends = ({ habits, currentMonth }) => {
  const weeklyData = useMemo(() => {
    // Get the last 12 weeks of data
    const weeks = [];
    
    for (let i = 11; i >= 0; i--) {
      const weekEnd = subWeeks(currentMonth, i);
      const weekStart = startOfWeek(weekEnd);
      const actualEnd = endOfWeek(weekStart);
      
      const days = eachDayOfInterval({
        start: weekStart,
        end: actualEnd,
      });

      let totalCompletion = 0;
      let completedHabits = 0;

      habits.forEach(habit => {
        const doneDays = days.filter(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const entry = habit.entries.find(e => entryDateKey(e.date) === dateStr);
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

    return weeks;
  }, [habits, currentMonth]);

  const averageCompletion = useMemo(() => {
    if (weeklyData.length === 0) return 0;
    const sum = weeklyData.reduce((acc, week) => acc + week.completion, 0);
    return Math.round(sum / weeklyData.length);
  }, [weeklyData]);

  const trend = useMemo(() => {
    if (weeklyData.length < 2) return 'stable';
    const lastWeek = weeklyData[weeklyData.length - 1].completion;
    const prevWeek = weeklyData[weeklyData.length - 2].completion;
    if (lastWeek > prevWeek) return 'improving';
    if (lastWeek < prevWeek) return 'declining';
    return 'stable';
  }, [weeklyData]);

  return (
    <div className="weekly-trends">
      <div className="trends-header">
        <h2>Weekly Performance Trends</h2>
        <div className="trends-stats">
          <div className="stat">
            <span className="label">Average Completion</span>
            <span className="value">{averageCompletion}%</span>
          </div>
          <div className={`stat trend-${trend}`}>
            <span className="label">Trend</span>
            <span className="value">{trend.charAt(0).toUpperCase() + trend.slice(1)}</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={weeklyData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" />
          <YAxis />
          <Tooltip formatter={(value) => `${value}%`} />
          <Legend />
          <Line
            type="monotone"
            dataKey="completion"
            stroke="#4CAF50"
            dot={{ fill: '#4CAF50', r: 5 }}
            activeDot={{ r: 7 }}
            name="Completion %"
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="trends-insights">
        <h3>Insights</h3>
        <ul>
          <li>Your average completion rate over the past 12 weeks is <strong>{averageCompletion}%</strong></li>
          <li>Current trend: <strong>{trend}</strong></li>
          <li>Highest completion: <strong>{weeklyData.length > 0 ? Math.max(...weeklyData.map(w => w.completion)) : 0}%</strong></li>
          <li>Lowest completion: <strong>{weeklyData.length > 0 ? Math.min(...weeklyData.map(w => w.completion)) : 0}%</strong></li>
        </ul>
      </div>
    </div>
  );
};

export default WeeklyTrends;
