import { useMemo } from 'react';
import { format } from 'date-fns';
import './HabitCorrelation.css';

const HabitCorrelation = ({ habits, currentMonth }) => {
  const correlationData = useMemo(() => {
    if (habits.length < 2) return [];

    const correlationMatrix = {};

    // Initialize correlation matrix
    habits.forEach((habit1, idx1) => {
      habits.forEach((habit2, idx2) => {
        if (idx1 !== idx2) {
          const key = [habit1._id, habit2._id].sort().join('-');
          if (!correlationMatrix[key]) {
            correlationMatrix[key] = {
              habit1,
              habit2,
              bothCompleted: 0,
              totalDays: 0,
              correlation: 0,
            };
          }
        }
      });
    });

    // Get entries for the current month
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

    return Object.values(correlationMatrix)
      .sort((a, b) => b.correlation - a.correlation);
  }, [habits, currentMonth]);

  const getCorrelationStrength = (correlation) => {
    if (correlation >= 75) return { label: 'Very Strong', color: '#1976D2' };
    if (correlation >= 60) return { label: 'Strong', color: '#4CAF50' };
    if (correlation >= 45) return { label: 'Moderate', color: '#FF9800' };
    if (correlation >= 30) return { label: 'Weak', color: '#FF5722' };
    return { label: 'Very Weak', color: '#999' };
  };

  const topCorrelations = correlationData.slice(0, 5);
  const averageCorrelation = useMemo(() => {
    if (correlationData.length === 0) return 0;
    const sum = correlationData.reduce((acc, item) => acc + item.correlation, 0);
    return Math.round(sum / correlationData.length);
  }, [correlationData]);

  return (
    <div className="habit-correlation">
      <div className="correlation-header">
        <h2>Habit Correlation Analysis</h2>
        <div className="correlation-stats">
          <div className="stat">
            <span className="label">Correlations Analyzed</span>
            <span className="value">{correlationData.length}</span>
          </div>
          <div className="stat">
            <span className="label">Average Correlation</span>
            <span className="value">{averageCorrelation}%</span>
          </div>
        </div>
      </div>

      <div className="correlation-description">
        <p>Shows how often pairs of habits are completed together. Higher percentage means these habits tend to be done on the same days.</p>
      </div>

      {topCorrelations.length > 0 ? (
        <div className="correlations-list">
          <h3>Top Correlated Habit Pairs</h3>
          {topCorrelations.map((item, index) => {
            const strength = getCorrelationStrength(item.correlation);
            return (
              <div key={index} className="correlation-item">
                <div className="correlation-info">
                  <div className="habit-names">
                    <span className="habit-name">{item.habit1.name}</span>
                    <span className="plus">+</span>
                    <span className="habit-name">{item.habit2.name}</span>
                  </div>
                  <div className="correlation-details">
                    <span className="both-completed">{item.bothCompleted} of {item.totalDays} days together</span>
                  </div>
                </div>
                <div className="correlation-bar">
                  <div
                    className="correlation-fill"
                    style={{
                      width: `${item.correlation}%`,
                      backgroundColor: strength.color,
                    }}
                  ></div>
                </div>
                <div className="correlation-value">
                  <span className="percentage">{item.correlation}%</span>
                  <span className="strength" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="no-data">
          <p>Not enough habit combinations to analyze correlation. Add more habits or track more days.</p>
        </div>
      )}

      <div className="correlation-insights">
        <h3>Insights & Recommendations</h3>
        <ul>
          <li>🔗 <strong>Synergistic Habits:</strong> Habits with high correlation (70%+) tend to reinforce each other. Consider doing them together.</li>
          <li>⚡ <strong>Independent Habits:</strong> Habits with low correlation may require different triggers or times of day.</li>
          <li>💡 <strong>Stacking Benefits:</strong> Use highly correlated habits as a "chain" to make routine building easier.</li>
          <li>📊 <strong>Pattern Recognition:</strong> Build sequences around your most correlated habit pairs.</li>
        </ul>
      </div>
    </div>
  );
};

export default HabitCorrelation;
