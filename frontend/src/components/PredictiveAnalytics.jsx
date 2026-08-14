import { useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './PredictiveAnalytics.css';

const PredictiveAnalytics = ({ habits }) => {
  const predictions = useMemo(() => {
    if (habits.length === 0) return { forecast: [], insights: [] };

    // Calculate historical trend
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');

      let completedCount = 0;
      habits.forEach(habit => {
        const entry = habit.entries.find(e => format(new Date(e.date), 'yyyy-MM-dd') === dateStr);
        if (entry && entry.status === 'done') {
          completedCount++;
        }
      });

      const completionPercentage = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;
      last30Days.push({
        date: format(date, 'MMM dd'),
        completion: completionPercentage,
        type: 'historical',
      });
    }

    // Simple linear regression for trend
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

    // Generate forecast for next 14 days
    const forecast = [];
    for (let i = 0; i < 14; i++) {
      const predictedValue = Math.max(0, Math.min(100, Math.round(intercept + slope * (n + i))));
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i + 1);

      forecast.push({
        date: format(futureDate, 'MMM dd'),
        completion: predictedValue,
        type: 'predicted',
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

    const consistency = volatility < 15 ? 'High' : volatility < 30 ? 'Moderate' : 'Low';
    const trendDirection = slope > 0 ? 'Improving' : slope < 0 ? 'Declining' : 'Stable';

    const insights = [
      {
        title: 'Trend Direction',
        value: trendDirection,
        icon: slope > 0 ? '📈' : slope < 0 ? '📉' : '➡️',
        color: slope > 0 ? '#4CAF50' : slope < 0 ? '#f44336' : '#FF9800',
      },
      {
        title: 'Consistency Level',
        value: consistency,
        icon: consistency === 'High' ? '⭐' : consistency === 'Moderate' ? '✓' : '⚠️',
        color: consistency === 'High' ? '#4CAF50' : consistency === 'Moderate' ? '#FF9800' : '#f44336',
      },
      {
        title: 'Recent Avg (7 days)',
        value: `${recentAvg}%`,
        icon: '📊',
        color: '#2196F3',
      },
      {
        title: 'Predicted Avg (14 days)',
        value: `${Math.round(forecast.reduce((a, b) => a + b.completion, 0) / forecast.length)}%`,
        icon: '🔮',
        color: '#9C27B0',
      },
    ];

    const combinedData = [...last30Days, ...forecast];

    return { forecast: combinedData, insights, consistency, trendDirection, slope };
  }, [habits]);

  const successProbability = useMemo(() => {
    if (predictions.forecast.length === 0) return 0;
    const nextWeekPredictions = predictions.forecast.filter(d => d.type === 'predicted').slice(0, 7);
    if (nextWeekPredictions.length === 0) return 0;

    const avgPrediction = nextWeekPredictions.reduce((a, b) => a + b.completion, 0) / nextWeekPredictions.length;
    return Math.round(avgPrediction);
  }, [predictions]);

  return (
    <div className="predictive-analytics">
      <div className="predictive-header">
        <h2>Predictive Analytics & Forecasting</h2>
        <div className="success-probability">
          <span className="label">Predicted Success Rate (Next 7 Days)</span>
          <div className="probability-circle">
            <span className="percentage">{successProbability}%</span>
          </div>
        </div>
      </div>

      <div className="insights-grid">
        {predictions.insights.map((insight, idx) => (
          <div key={idx} className="insight-card">
            <div className="insight-icon">{insight.icon}</div>
            <div className="insight-content">
              <div className="insight-title">{insight.title}</div>
              <div className="insight-value" style={{ color: insight.color }}>
                {insight.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="forecast-chart-container">
        <h3>30-Day Forecast</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={predictions.forecast} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => `${value}%`} />
            <Legend />
            <Line
              type="monotone"
              dataKey="completion"
              stroke="#2196F3"
              strokeDasharray="0"
              name="Completion %"
              dot={(props) => {
                const { cx, cy, payload } = props;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={payload.type === 'predicted' ? 3 : 4}
                    fill={payload.type === 'predicted' ? '#9C27B0' : '#2196F3'}
                  />
                );
              }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="chart-legend">
          <span><span className="dot" style={{ backgroundColor: '#2196F3' }}></span> Historical Data</span>
          <span><span className="dot" style={{ backgroundColor: '#9C27B0' }}></span> Predicted Data</span>
        </div>
      </div>

      <div className="recommendations">
        <h3>AI Recommendations</h3>
        <div className="recommendations-content">
          {predictions.slope > 2 && (
            <div className="recommendation-item positive">
              <span className="emoji">🎉</span>
              <p><strong>Momentum Building:</strong> Your habits show an improving trend! Keep up the momentum and you're likely to hit 90%+ completion soon.</p>
            </div>
          )}

          {predictions.slope < -2 && (
            <div className="recommendation-item warning">
              <span className="emoji">⚠️</span>
              <p><strong>Attention Needed:</strong> Your completion rate is declining. Consider reviewing your habits or adjusting your schedule.</p>
            </div>
          )}

          {predictions.consistency === 'High' && (
            <div className="recommendation-item positive">
              <span className="emoji">✨</span>
              <p><strong>High Consistency:</strong> Your habits are very stable! Consider adding new habits to build on this consistency.</p>
            </div>
          )}

          {predictions.consistency === 'Low' && (
            <div className="recommendation-item warning">
              <span className="emoji">📉</span>
              <p><strong>Inconsistent Pattern:</strong> Try to establish more consistent triggers or times for your habits to improve reliability.</p>
            </div>
          )}

          {successProbability >= 80 && (
            <div className="recommendation-item positive">
              <span className="emoji">🏆</span>
              <p><strong>On Track for Success:</strong> Based on current trends, you have an {successProbability}% probability of maintaining high completion next week!</p>
            </div>
          )}

          {successProbability < 50 && (
            <div className="recommendation-item warning">
              <span className="emoji">💪</span>
              <p><strong>Recovery Opportunity:</strong> Your success rate is below 50%. Start with 2-3 key habits this week to rebuild momentum.</p>
            </div>
          )}
        </div>
      </div>

      <div className="ml-disclaimer">
        <p>💡 <strong>Note:</strong> Predictions are based on simple linear regression of past 30 days. Actual results may vary based on external factors.</p>
      </div>
    </div>
  );
};

export default PredictiveAnalytics;
