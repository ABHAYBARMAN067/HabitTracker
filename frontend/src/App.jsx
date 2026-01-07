import { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import HabitTracker from './components/HabitTracker';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLogin, setIsLogin] = useState(true);

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
          <button onClick={handleLogout} className="logout-btn">Logout</button>
          <HabitTracker token={token} />
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
