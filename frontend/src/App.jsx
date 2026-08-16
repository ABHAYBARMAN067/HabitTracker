import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import Login from './components/Login';
import Register from './components/Register';
import HabitTracker from './components/HabitTracker';
import Dashboard from './components/Dashboard';
import ProfileSettings from './components/ProfileSettings';
import './App.css';

function App() {
  const appRef = useRef(null);
  const [token, setToken] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [currentView, setCurrentView] = useState('habit-tracker');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/me`, { credentials: 'include' })
      .then(response => setToken(response.ok))
      .catch(() => setToken(false));
  }, []);

  const handleLogout = () => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    setToken(null);
    setIsProfileMenuOpen(false);
    setCurrentView('habit-tracker');
  };

  useLayoutEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return undefined;

    const context = gsap.context(() => {
      gsap.fromTo('.app-nav', { y: -18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out' });
      gsap.fromTo('.app-view', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out', delay: 0.08 });
    }, appRef);

    return () => context.revert();
  }, [token, currentView]);

  const openAuth = (login) => {
    setIsLogin(login);
    setIsProfileMenuOpen(false);
  };

  const selectView = (view) => {
    setCurrentView(view);
    setIsProfileMenuOpen(false);
  };

  return (
    <div className="App" ref={appRef}>
      <header className="site-nav app-nav">
        <button className="brand" onClick={() => token ? selectView('habit-tracker') : openAuth(true)} aria-label="HabitFlow home">
          <span className="brand-mark" aria-hidden="true">✓</span>
          <span>HabitFlow</span>
        </button>

        <nav className="primary-nav" aria-label="Primary navigation">
          <button onClick={() => token ? selectView('habit-tracker') : openAuth(true)} className={token && currentView === 'habit-tracker' ? 'active' : ''}>Home</button>
          <button onClick={() => token ? selectView('dashboard') : openAuth(true)} className={token && currentView === 'dashboard' ? 'active' : ''}>Dashboard</button>
          <a href="#about">About</a>
          <a href="#services">Services</a>
        </nav>

        <div className="nav-actions">
          {token ? (
            <>
              <div className="notification-wrap">
                <button
                  type="button"
                  className="notification-btn"
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  aria-label="Open notifications"
                  aria-expanded={isNotificationsOpen}
                >
                  <span aria-hidden="true">🔔</span>
                  <span className="notification-badge">1</span>
                </button>
                {isNotificationsOpen && (
                  <div className="notification-popover" role="status">
                    <strong>Today’s reminder</strong>
                    <span>Mark your habits before the day ends.</span>
                  </div>
                )}
              </div>

              <div className="profile-wrap">
                <button
                  type="button"
                  className="profile-btn"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  aria-expanded={isProfileMenuOpen}
                >
                  <span className="profile-avatar" aria-hidden="true">👤</span>
                  <span>Profile</span>
                  <span className="chevron" aria-hidden="true">⌄</span>
                </button>
                {isProfileMenuOpen && (
                  <div className="profile-menu">
                    <button onClick={() => selectView('profile')}>👤 Profile</button>
                    <button onClick={() => selectView('settings')}>⚙ Settings</button>
                    <button onClick={() => selectView('dashboard')}>▦ Dashboard</button>
                    <button onClick={handleLogout} className="menu-logout">↪ Logout</button>
                  </div>
                )}
              </div>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </>
          ) : (
            <>
              <button onClick={() => openAuth(true)} className={isLogin ? 'text-action active' : 'text-action'}>Login</button>
              <button onClick={() => openAuth(false)} className="register-btn">Sign Up</button>
            </>
          )}
        </div>
      </header>

      {token ? (
        <main className="app-view">
          {currentView === 'habit-tracker' && <HabitTracker token={token} />}
          {currentView === 'dashboard' && <Dashboard token={token} />}
          {(currentView === 'profile' || currentView === 'settings') && <ProfileSettings token={token} onDeleted={handleLogout} />}
        </main>
      ) : (
        <main className="auth-view app-view">
          {isLogin ? (
            <Login setToken={setToken} onSwitchToRegister={() => setIsLogin(false)} />
          ) : (
            <Register setToken={setToken} onSwitchToLogin={() => setIsLogin(true)} />
          )}
        </main>
      )}
    </div>
  );
}

export default App;
