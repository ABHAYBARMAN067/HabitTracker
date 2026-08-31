import { useEffect, useState } from 'react';
import api from '../../api';
import './ProfileSettings.css';



const ProfileSettings = ({ token, onDeleted }) => {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });

  useEffect(() => {
    api.get(`/api/users/me`).then(({ data }) => setUser(data)).catch(() => setMessage('Could not load your profile.'));
  }, [token]);

  useEffect(() => {
    if (!user) return;
    const theme = user.settings?.theme || 'dark';
    document.documentElement.dataset.theme = theme;
    if (user.settings?.notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      const [hour, minute] = (user.settings.reminderTime || '20:00').split(':').map(Number);
      const now = new Date();
      const reminder = new Date();
      reminder.setHours(hour, minute, 0, 0);
      if (reminder <= now) reminder.setDate(reminder.getDate() + 1);
      const timer = window.setTimeout(() => new Notification('HabitFlow reminder', { body: 'Take a moment to complete today’s habits.' }), reminder - now);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [user]);

  const saveProfile = async (event) => {
    event.preventDefault();
    try {
      const { data } = await api.put(`/api/users/me`, { username: user.username, email: user.email, settings: user.settings });
      setUser(data); setMessage('Profile and settings saved.');
    } catch (error) { setMessage(error.response?.data?.msg || 'Could not save settings.'); }
  };
  const changePassword = async (event) => {
    event.preventDefault();
    try { await api.put(`/api/users/me/password`, passwords); setPasswords({ currentPassword: '', newPassword: '' }); setMessage('Password changed successfully.'); }
    catch (error) { setMessage(error.response?.data?.msg || 'Could not change password.'); }
  };
  const deleteAccount = async () => {
    const password = window.prompt('Enter your password to permanently delete your account and habits.');
    if (!password || !window.confirm('This cannot be undone. Delete account?')) return;
    try { await api.delete(`/api/users/me`, { data: { password } }); onDeleted(); }
    catch (error) { setMessage(error.response?.data?.msg || 'Could not delete account.'); }
  };
  const enableNotifications = async () => {
    if (!('Notification' in window)) return setMessage('Browser notifications are not supported here.');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return setMessage('Notification permission was not granted.');
    try {
      const { data } = await api.put('/api/users/me', { settings: { ...user.settings, notificationsEnabled: true } });
      setUser(data);
      setMessage('Notifications enabled.');
    } catch { setMessage('Could not save notification setting.'); }
  };

  if (!user) return <section className="account-panel"><h1>Loading your profile…</h1></section>;
  return <section className="settings-page">
    <div><h1>Profile & Settings</h1><p>Manage your account, appearance and daily reminders.</p></div>
    {message && <div className="settings-message" role="status">{message}</div>}
    <form className="settings-card" onSubmit={saveProfile}>
      <h2>Profile</h2>
      <label>Name<input value={user.username} onChange={e => setUser({ ...user, username: e.target.value })} required minLength="3" /></label>
      <label>Email<input type="email" value={user.email} onChange={e => setUser({ ...user, email: e.target.value })} required /></label>
      <h2>Preferences</h2>
      <label>Theme<select value={user.settings?.theme || 'dark'} onChange={e => setUser({ ...user, settings: { ...user.settings, theme: e.target.value } })}><option value="dark">Dark</option><option value="light">Light</option><option value="system">System</option></select></label>
      <div className="reminder-row"><label><input type="checkbox" checked={Boolean(user.settings?.notificationsEnabled)} onChange={e => setUser({ ...user, settings: { ...user.settings, notificationsEnabled: e.target.checked } })} /> Enable daily reminder</label><button type="button" onClick={enableNotifications}>Allow notifications</button></div>
      <label>Reminder time<input type="time" value={user.settings?.reminderTime || '20:00'} onChange={e => setUser({ ...user, settings: { ...user.settings, reminderTime: e.target.value } })} /></label>
      <button className="settings-primary">Save settings</button>
    </form>
    <form className="settings-card" onSubmit={changePassword}><h2>Change password</h2><label>Current password<input type="password" value={passwords.currentPassword} onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })} required /></label><label>New password<input type="password" minLength="6" value={passwords.newPassword} onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} required /></label><button className="settings-primary">Update password</button></form>
    <section className="settings-card danger-zone"><h2>Danger zone</h2><p>Permanently delete your account and every habit entry.</p><button type="button" onClick={deleteAccount}>Delete account</button></section>
  </section>;
};

export default ProfileSettings;
