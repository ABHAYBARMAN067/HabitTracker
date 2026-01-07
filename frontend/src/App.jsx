import { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import HabitTracker from './components/HabitTracker';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLogin, setIsLogin] = useState(true);
  const [currentView, setCurrentView] = useState('habit-tracker');

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  const handleLogout = () => {
    setToken(null);
  };

  return (
    <div className="App">
      {token ? (
        <div>
          <div className="header">
            <button onClick={handleLogout} className="logout-btn">Logout</button>
            <div className="view-toggle">
              <button onClick={() => setCurrentView('habit-tracker')} className={currentView === 'habit-tracker' ? 'active' : ''}>Habit Tracker</button>
              <button onClick={() => setCurrentView('dashboard')} className={currentView === 'dashboard' ? 'active' : ''}>Dashboard</button>
            </div>
          </div>
          {currentView === 'habit-tracker' ? (
            <HabitTracker token={token} />
          ) : (
            <Dashboard token={token} />
          )}
        </div>
      ) : (
        isLogin ? (
          <Login setToken={setToken} onSwitchToRegister={() => setIsLogin(false)} />
        ) : (
          <Register setToken={setToken} onSwitchToLogin={() => setIsLogin(true)} />
        )
      )}
    </div>
  );
}

export default App;
