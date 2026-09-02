import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import api from '../../api';
import { eachDayOfInterval, endOfMonth, format, startOfMonth } from 'date-fns';
import { gsap } from 'gsap';
import { entryDateKey } from '../utils/dates';
import ProgressCharts from './ProgressCharts';
import DataExport from './DataExport';
import './HabitTracker.css';


const initialHabit = { name: '', category: 'General', icon: '★', color: '#7C3AED', frequency: 'daily', daysOfWeek: [], target: '' };

const HabitTracker = () => {
  const trackerRef = useRef(null);
  const celebratedRef = useRef(null);
  const [habits, setHabits] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [form, setForm] = useState(initialHabit);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [celebrate, setCelebrate] = useState(false);

  const showToast = message => { setToast(message); window.setTimeout(() => setToast(''), 2800); };
  useEffect(() => {
    const loadHabits = async () => {
      setLoading(true);
      try { const { data } = await api.get(`/api/habits`); setHabits(data); }
      catch { setToast('Could not load habits. Please try again.'); }
      finally { setLoading(false); }
    };
    loadHabits();
  }, []);
  useLayoutEffect(() => { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined; const ctx = gsap.context(() => gsap.from('.tracker-title, .smart-habit-form, .calendar-view', { y: 16, opacity: 0, duration: .42, stagger: .1, ease: 'power3.out' }), trackerRef); return () => ctx.revert(); }, []);

  const categories = useMemo(() => ['All', ...new Set(habits.map(habit => habit.category || 'General'))], [habits]);
  const visibleHabits = habits.filter(habit => (category === 'All' || habit.category === category) && habit.name.toLowerCase().includes(query.toLowerCase()));
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const statusFor = (habit, date) => habit.entries.find(entry => entryDateKey(entry.date) === date)?.status || 'not-marked';
  const allDone = habits.length > 0 && habits.every(habit => habit.entries.some(entry => format(new Date(entry.date), 'yyyy-MM-dd') === todayKey && entry.status === 'done'));
  const bestStreak = useMemo(() => Math.max(0, ...habits.map(habit => {
    let streak = 0;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayDone = statusFor(habit, todayStr) === 'done';
    const startOffset = todayDone ? 0 : 1;
    for (let offset = startOffset; offset < 365; offset += 1) {
      const date = new Date(); date.setDate(date.getDate() - offset);
      if (statusFor(habit, format(date, 'yyyy-MM-dd')) !== 'done') break;
      streak += 1;
    }
    return streak;
  })), [habits]);
  useEffect(() => {
    if (!allDone) return;
    if (celebratedRef.current === todayKey) return;
    celebratedRef.current = todayKey;
    setCelebrate(true);
    const id = window.setTimeout(() => setCelebrate(false), 1700);
    return () => window.clearTimeout(id);
  }, [allDone, todayKey]);

  const addHabit = async event => { event.preventDefault(); if (!form.name.trim()) return; try { const { data } = await api.post(`/api/habits`, { ...form, name: form.name.trim() }); setHabits(current => [data, ...current]); setForm(initialHabit); showToast('Habit created successfully.'); } catch (error) { showToast(error.response?.data?.msg || 'Could not create habit.'); } };
  const updateEntry = async (habit, date, status) => { try { const { data } = await api.put(`/api/habits/${habit._id}/entry`, { date, status }); setHabits(current => current.map(item => item._id === habit._id ? data : item)); } catch { showToast('Could not update this habit.'); } };
  const archiveHabit = async habit => { try { await api.put(`/api/habits/${habit._id}/archive`, { archived: true }); setHabits(current => current.filter(item => item._id !== habit._id)); showToast(`${habit.name} archived.`); } catch { showToast('Could not archive habit.'); } };
  const deleteHabit = async habit => { if (!window.confirm(`Permanently delete “${habit.name}”?`)) return; try { await api.delete(`/api/habits/${habit._id}`); setHabits(current => current.filter(item => item._id !== habit._id)); showToast('Habit deleted.'); } catch { showToast('Could not delete habit.'); } };
  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const nextStatus = status => status === 'not-marked' ? 'done' : status === 'done' ? 'missed' : 'not-marked';

  return <div className="habit-tracker" ref={trackerRef}>
    {toast && <div className="toast" role="status">{toast}</div>}{celebrate && <div className="confetti" aria-hidden="true">★ ✦ ★ ✦ ★ ✦</div>}
    <header className="header"><div><h1 className="tracker-title">Habit Tracker</h1><p className="tracker-subtitle">Build routines, track goals and celebrate every streak.</p></div><div className="score-group"><div className="daily-score">Today: <strong>{habits.filter(h => statusFor(h, todayKey) === 'done').length}/{habits.length}</strong></div>{bestStreak >= 7 && <span className="achievement-badge">7-day streak</span>}{bestStreak >= 30 && <span className="achievement-badge legendary">30-day legend</span>}</div></header>
    <form className="smart-habit-form" onSubmit={addHabit}>
      <input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} aria-label="Habit icon" maxLength="8" />
      <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="New habit name" required maxLength="80" />
      <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}><option>General</option><option>Health</option><option>Study</option><option>Fitness</option><option>Wellness</option><option>Work</option></select>
      <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="specific-days">Specific days</option></select>
      {form.frequency === 'specific-days' && <fieldset className="day-picker"><legend>Days</legend>{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <label key={`${day}-${index}`}><input type="checkbox" checked={form.daysOfWeek.includes(index)} onChange={() => setForm({ ...form, daysOfWeek: form.daysOfWeek.includes(index) ? form.daysOfWeek.filter(item => item !== index) : [...form.daysOfWeek, index] })} />{day}</label>)}</fieldset>}
      <input value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} placeholder="Target e.g. 30 min" maxLength="100" />
      <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} aria-label="Habit color" />
      <button>Add habit</button>
    </form>
    <div className="habit-tools"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search habits" aria-label="Search habits" /><select value={category} onChange={e => setCategory(e.target.value)} aria-label="Filter by category">{categories.map(item => <option key={item}>{item}</option>)}</select></div>
    {loading ? <div className="skeleton-list"><span /><span /><span /></div> : visibleHabits.length === 0 ? <div className="empty-state"><span>◎</span><h2>Create your first habit</h2><p>Start small. Consistency compounds into progress.</p></div> : <div className="habit-list">{visibleHabits.map(habit => <article key={habit._id} className="habit-item" style={{ borderLeftColor: habit.color }}><div><strong>{habit.icon} {habit.name}</strong><small>{habit.category} · {habit.frequency}{habit.target ? ` · ${habit.target}` : ''}</small></div><div className="habit-actions"><button onClick={() => archiveHabit(habit)}>Archive</button><button className="delete-habit" onClick={() => deleteHabit(habit)}>Delete</button></div></article>)}</div>}
    <section className="calendar-view"><div className="month-navigation"><button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>Previous</button><h3>{format(currentMonth, 'MMMM yyyy')}</h3><button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>Next</button></div><table className="calendar-table"><thead><tr><th>Habit</th>{days.map(day => <th key={day}>{format(day, 'd')}</th>)}</tr></thead><tbody>{visibleHabits.map(habit => <tr key={habit._id}><td className="habit-name-col">{habit.icon} {habit.name}</td>{days.map(day => { const date = format(day, 'yyyy-MM-dd'); const status = statusFor(habit, date); return <td key={date} className="calendar-cell"><button className={`status-${status}`} onClick={() => updateEntry(habit, date, nextStatus(status))} aria-label={`${habit.name}, ${date}: ${status}. Activate to change status.`}>{status === 'done' ? '✓' : status === 'missed' ? '×' : '·'}</button></td>; })}</tr>)}</tbody></table></section>
    <ProgressCharts habits={habits} currentMonth={currentMonth} /><DataExport habits={habits} />
  </div>;
};

export default HabitTracker;
