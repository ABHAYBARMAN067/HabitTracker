import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import './Dashboard.css';

const Dashboard = ({ token }) => {
  const [habits, setHabits] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const fetchHabits = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/habits', {
          headers: { 'x-auth-token': token },
        });
        setHabits(response.data);
      } catch (error) {
        console.error('Error fetching habits:', error);
      }
    };

    if (token) {
      fetchHabits();
    }
  }, [token]);

  const metrics = useMemo(() => {
    const daysInMonth = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });

    let totalCompletion = 0;
    let habitStats = [];

    habits.forEach(habit => {
      const totalDays = daysInMonth.length;
      const doneDays = habit.entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startOfMonth(currentMonth) && entryDate <= endOfMonth(currentMonth) && entry.status === 'done';
      }).length;
      const completionPercentage = totalDays > 0 ? Math.round((doneDays / totalDays) * 100) : 0;

      totalCompletion += completionPercentage;
      habitStats.push({
        name: habit.name,
        completion: completionPercentage,
      });
    });

    const monthlyCompletion = habits.length > 0 ? Math.round(totalCompletion / habits.length) : 0;
    const consistencyScore = monthlyCompletion; // For simplicity, using average completion as consistency score

    habitStats.sort((a, b) => b.completion - a.completion);
    const bestHabit = habitStats[0];
    const worstHabit = habitStats[habitStats.length - 1];

    return {
      monthlyCompletion,
      bestHabit,
      worstHabit,
      consistencyScore,
      habitStats,
    };
  }, [habits, currentMonth]);

  const pieData = [
    { name: metrics.bestHabit?.name || 'N/A', value: metrics.bestHabit?.completion || 0, color: '#00C49F' },
    { name: metrics.worstHabit?.name || 'N/A', value: metrics.worstHabit?.completion || 0, color: '#FF8042' },
  ];

  return (
    <div className="dashboard">
      <h1>Advanced Analytics Dashboard</h1>

      <div className="month-navigation">
        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
          Previous
        </button>
        <h3>{format(currentMonth, 'MMMM yyyy')}</h3>
        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
          Next
        </button>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Monthly Completion %</h3>
          <div className="metric-value">{metrics.monthlyCompletion}%</div>
          <div className="progress-bar-chart">
            <div className="progress-bar-fill" style={{ width: `${metrics.monthlyCompletion}%` }}></div>
          </div>
        </div>

        <div className="metric-card">
          <h3>Best & Worst Habits</h3>
          <div className="habit-comparison">
            <div className="habit-stat">
              <span className="label">Best:</span>
              <span className="habit-name">{metrics.bestHabit?.name || 'N/A'}</span>
              <span className="percentage">{metrics.bestHabit?.completion || 0}%</span>
            </div>
            <div className="habit-stat">
              <span className="label">Worst:</span>
              <span className="habit-name">{metrics.worstHabit?.name || 'N/A'}</span>
              <span className="percentage">{metrics.worstHabit?.completion || 0}%</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <h3>Consistency Score</h3>
          <div className="metric-value">{metrics.consistencyScore}%</div>
          <div className="gauge">
            <div className="gauge-fill" style={{ width: `${metrics.consistencyScore}%` }}></div>
          </div>
        </div>
      </div>

      <div className="habit-breakdown">
        <h3>Habit Breakdown</h3>
        <div className="breakdown-list">
          {metrics.habitStats.map((stat, index) => (
            <div key={index} className="breakdown-item">
              <span className="habit-name">{stat.name}</span>
              <div className="progress-bar-chart">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${stat.completion}%`, backgroundColor: `hsl(${120 - stat.completion * 0.6}, 70%, 50%)` }}
                ></div>
              </div>
              <span className="percentage">{stat.completion}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
