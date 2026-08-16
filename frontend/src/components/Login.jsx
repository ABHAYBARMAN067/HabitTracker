import { useLayoutEffect, useRef, useState } from 'react';
import axios from 'axios';
import { gsap } from 'gsap';
import './Login.css';

const Login = ({ setToken, onSwitchToRegister }) => {
  const loginRef = useRef(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
      timeline
        .fromTo('.login-container', { y: 34, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.6 })
        .from('.login-container h2, .login-form input, .login-form button, .switch-auth', { y: 12, opacity: 0, duration: 0.35, stagger: 0.08 }, '-=0.28');
    }, loginRef);
    return () => context.revert();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await axios.post('http://localhost:5000/api/auth/login', formData, { withCredentials: true });
      setToken(true);
    } catch (err) {
      setError(err.response?.data?.msg || 'An error occurred');
    }
  };

  return (
    <div className="login-screen" ref={loginRef}>
      <div className="login-container">
        <div className="login-orb login-orb-one" aria-hidden="true" />
        <div className="login-orb login-orb-two" aria-hidden="true" />
        <h2>Welcome back</h2>
        <p className="login-subtitle">Log in to continue your streak.</p>
        <form className="login-form" onSubmit={handleSubmit}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <button type="submit">Login</button>
        </form>
        {error && <p className="error">{error}</p>}
        <div className="switch-auth">
          <button onClick={onSwitchToRegister}>
            Need an account? Register
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
