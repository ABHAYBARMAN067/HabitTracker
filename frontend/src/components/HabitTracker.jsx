import { useState, useEffect } from 'react';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import './HabitTracker.css';

const HabitTracker = ({ token }) => {
  const [habits, setHabits] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState('table'); // 'table' or 'calendar'
  const [newHabitName, setNewHabitName] = useState('');

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

  const addHabit = async () => {
    if (!newHabitName.trim()) return;
    try {
      const response = await axios.post(
        'http://localhost:5000/api/habits',
        { name: newHabitName },
        { headers: { 'x-auth-token': token } }
      );
      setHabits([...habits, response.data]);
      setNewHabitName('');
    } catch (error) {
      console.error('Error adding habit:', error);
    }
  };

  const updateHabitEntry = async (habitId, date, status) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/habits/${habitId}/entry`,
        { date, status },
        { headers: { 'x-auth-token': token } }
      );
      setHabits(habits.map(habit => habit._id === habitId ? response.data : habit));
    } catch (error) {
      console.error('Error updating habit:', error);
    }
  };

  const deleteHabit = async (habitId) => {
    try {
      await axios.delete(`http://localhost:5000/api/habits/${habitId}`, {
        headers: { 'x-auth-token': token },
      });
      setHabits(habits.filter(habit => habit._id !== habitId));
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  };

  const getStatusSymbol = (status) => {
    switch (status) {
      case 'done': return '✅';
      case 'missed': return '❌';
      default: return '⬜';
    }
  };

  const getHabitEntry = (habit, date) => {
    const entry = habit.entries.find(entry => format(new Date(entry.date), 'yyyy-MM-dd') === date);
    return entry ? entry.status : 'not-marked';
  };

  const renderTableView = () => {
    const daysInMonth = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });

    return (
      <div className="table-view">
        <div className="month-navigation">
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
            Previous
          </button>
          <h3>{format(currentMonth, 'MMMM yyyy')}</h3>
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
            Next
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Habit</th>
              {daysInMonth.map(day => (
                <th key={day}>{format(day, 'd')}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {habits.map(habit => (
              <tr key={habit._id}>
                <td>{habit.name}</td>
                {daysInMonth.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const status = getHabitEntry(habit, dateStr);
                  return (
                    <td key={dateStr}>
                      <button
                        onClick={() => {
                          const newStatus = status === 'done' ? 'missed' : status === 'missed' ? 'not-marked' : 'done';
                          updateHabitEntry(habit._id, dateStr, newStatus);
                        }}
                      >
                        {getStatusSymbol(status)}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderCalendarView = () => {
    // Simplified calendar view - you can expand this
    return (
      <div className="calendar-view">
        <h3>Calendar View (Coming Soon)</h3>
        <p>This view will show habits in a compact daily grid.</p>
      </div>
    );
  };

  return (
    <div className="habit-tracker">
      <div className="header">
        <h1>Habit Tracker</h1>
        <div className="view-toggle">
          <button onClick={() => setView('table')} className={view === 'table' ? 'active' : ''}>Table</button>
          <button onClick={() => setView('calendar')} className={view === 'calendar' ? 'active' : ''}>Calendar</button>
        </div>
      </div>

      <div className="add-habit">
        <input
          type="text"
          value={newHabitName}
          onChange={(e) => setNewHabitName(e.target.value)}
          placeholder="New habit name"
        />
        <button onClick={addHabit}>Add Habit</button>
      </div>

      {habits.map(habit => (
        <div key={habit._id} className="habit-item">
          <span>{habit.name}</span>
          <button onClick={() => deleteHabit(habit._id)}>Delete</button>
        </div>
      ))}

      {view === 'table' ? renderTableView() : renderCalendarView()}
    </div>
  );
};

export default HabitTracker;
