import { useMemo } from 'react';
import { format, eachDayOfInterval, getWeek, getDay } from 'date-fns';
import './YearlyHeatmap.css';

const YearlyHeatmap = ({ habits, currentMonth }) => {
  const heatmapData = useMemo(() => {
    const year = new Date(currentMonth).getFullYear();
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);

    const days = eachDayOfInterval({
      start: yearStart,
      end: yearEnd,
    });

    const data = {};

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
      data[dateStr] = completionPercentage;
    });

    return data;
  }, [habits, currentMonth]);

  const getColor = (percentage) => {
    if (percentage === 0) return '#ebedf0';
    if (percentage < 25) return '#c6e48b';
    if (percentage < 50) return '#7bc96f';
    if (percentage < 75) return '#239a3b';
    return '#196127';
  };



  const weeks = useMemo(() => {
    const year = new Date(currentMonth).getFullYear();
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);
    const days = eachDayOfInterval({ start: yearStart, end: yearEnd });

    const weekMap = {};
    days.forEach(day => {
      const weekNum = getWeek(day);
      const dayOfWeek = getDay(day);
      if (!weekMap[weekNum]) {
        weekMap[weekNum] = {};
      }
      const dateStr = format(day, 'yyyy-MM-dd');
      weekMap[weekNum][dayOfWeek] = { date: dateStr, percentage: heatmapData[dateStr] || 0 };
    });

    return Object.entries(weekMap).map(([week, days]) => ({ week, days }));
      }, [heatmapData, currentMonth]);
  const stats = useMemo(() => {
    const percentages = Object.values(heatmapData);
    const perfectDays = percentages.filter(p => p === 100).length;
    const activeDays = percentages.filter(p => p > 0).length;
    const averagePercentage = Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length);

    return { perfectDays, activeDays, averagePercentage };
  }, [heatmapData]);

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="yearly-heatmap">
      <div className="heatmap-header">
        <h2>Yearly Overview {new Date(currentMonth).getFullYear()}</h2>
        <div className="heatmap-stats">
          <div className="stat-item">
            <span className="label">Perfect Days</span>
            <span className="value">{stats.perfectDays}</span>
          </div>
          <div className="stat-item">
            <span className="label">Active Days</span>
            <span className="value">{stats.activeDays}</span>
          </div>
          <div className="stat-item">
            <span className="label">Average</span>
            <span className="value">{stats.averagePercentage}%</span>
          </div>
        </div>
      </div>

      <div className="heatmap-legend">
        <span>Less</span>
        <div className="legend-box" style={{ backgroundColor: '#ebedf0' }}></div>
        <div className="legend-box" style={{ backgroundColor: '#c6e48b' }}></div>
        <div className="legend-box" style={{ backgroundColor: '#7bc96f' }}></div>
        <div className="legend-box" style={{ backgroundColor: '#239a3b' }}></div>
        <div className="legend-box" style={{ backgroundColor: '#196127' }}></div>
        <span>More</span>
      </div>

      <div className="heatmap-grid">
        <div className="day-labels">
          {dayLabels.map((day, idx) => (
            <div key={idx} className="day-label">
              {day}
            </div>
          ))}
        </div>

        <div className="heatmap-container">
          {weeks.map((week) => (
            <div key={week.week} className="week">
              {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
                const dayData = week.days[dayOfWeek];
                return (
                  <div
                    key={`${week.week}-${dayOfWeek}`}
                    className="day-cell"
                    style={{ backgroundColor: dayData ? getColor(dayData.percentage) : '#f0f0f0' }}
                    title={dayData ? `${dayData.date}: ${dayData.percentage}%` : ''}
                  ></div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="heatmap-insights">
        <h3>Year Summary</h3>
        <ul>
          <li>Total perfect days (100% completion): <strong>{stats.perfectDays}</strong></li>
          <li>Days with at least one habit completed: <strong>{stats.activeDays}</strong></li>
          <li>Year average completion rate: <strong>{stats.averagePercentage}%</strong></li>
          <li>Consistency: {stats.averagePercentage >= 75 ? '🌟 Excellent' : stats.averagePercentage >= 50 ? '⭐ Good' : stats.averagePercentage >= 25 ? '👍 Fair' : '📈 Needs improvement'}</li>
        </ul>
      </div>
    </div>
  );
};

export default YearlyHeatmap;
