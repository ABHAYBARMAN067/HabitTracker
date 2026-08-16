import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import './ProgressCharts.css';

const ProgressCharts = ({ habits, currentMonth }) => {
  const stats = useMemo(() => {
    const daysInMonth = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });

    const newStats = {};

    habits.forEach(habit => {
      const totalDays = daysInMonth.length;
      const doneDays = habit.entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entry.status === 'done'
          && entryDate >= startOfMonth(currentMonth)
          && entryDate <= endOfMonth(currentMonth);
      }).length;
      const completionPercentage = totalDays > 0 ? Math.round((doneDays / totalDays) * 100) : 0;

      // Calculate current streak
      let currentStreak = 0;
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const entry = habit.entries.find(e => format(new Date(e.date), 'yyyy-MM-dd') === dateStr);
        if (entry && entry.status === 'done') {
          currentStreak++;
        } else {
          break;
        }
      }

      newStats[habit._id] = {
        completionPercentage,
        currentStreak,
        doneDays,
        totalDays,
      };
    });

    return newStats;
  }, [habits, currentMonth]);

  const shareProgress = () => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const todayHabits = habits.map(habit => {
      const entry = habit.entries.find(e => format(new Date(e.date), 'yyyy-MM-dd') === todayStr);
      const status = entry ? entry.status : 'not-marked';
      return `${habit.name}: ${status === 'done' ? '✅' : status === 'missed' ? '❌' : '⬜'}`;
    }).join('\n');

    const shareText = `My habit progress for ${format(today, 'MMMM d, yyyy')}:\n\n${todayHabits}`;

    if (navigator.share) {
      navigator.share({
        title: 'Habit Tracker Progress',
        text: shareText,
      });
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Progress copied to clipboard!');
      });
    }
  };

  return (
    <div className="progress-charts">
      <h2>Progress Overview</h2>
      <button onClick={shareProgress} className="share-btn">Share Today's Progress</button>
      <div className="stats-grid">
        {habits.map(habit => (
          <div key={habit._id} className="stat-card">
            <h3>{habit.name}</h3>
            <div className="stat-item">
              <span>Completion: {stats[habit._id]?.completionPercentage || 0}%</span>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${stats[habit._id]?.completionPercentage || 0}%` }}
                ></div>
              </div>
            </div>
            <div className="stat-item">
              <span>Current Streak: {stats[habit._id]?.currentStreak || 0} days</span>
            </div>
            <div className="stat-item">
              <span>Done: {stats[habit._id]?.doneDays || 0} / {stats[habit._id]?.totalDays || 0} days</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressCharts;
