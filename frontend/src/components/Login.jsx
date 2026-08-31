import { useEffect, useRef, useState } from 'react';
import api from '../../api';
import { weakPasswords } from '../utils/constants';
import './Login.css';

const Login = ({ setToken, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [suspicious, setSuspicious] = useState(false);
  const [blinking, setBlinking] = useState(false);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);

  const eyesRef = useRef([]);

  /* 👀 Eye movement */
  useEffect(() => {
    const handleMouseMove = (e) => {
      eyesRef.current.forEach((eye) => {
        if (!eye) return;

        const rect = eye.getBoundingClientRect();

        const eyeX = rect.left + rect.width / 2;
        const eyeY = rect.top + rect.height / 2;

        const distance = Math.sqrt(
          Math.pow(e.clientX - eyeX, 2) +
          Math.pow(e.clientY - eyeY, 2)
        );

        const maxDistance =
          Math.min(window.innerWidth, window.innerHeight) / 2;

        const intensity = Math.min(distance / maxDistance, 1);

        const angle = Math.atan2(
          e.clientX - eyeX,
          -(e.clientY - eyeY)
        );

        const maxMove = 12 * intensity;

        const x = Math.sin(angle) * maxMove;
        const y = -Math.cos(angle) * maxMove;

        const pupil = eye.querySelector('.pupil');

        if (pupil) {
          pupil.style.transform = `translate(${x}px, ${y}px)`;
        }
      });
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener(
        'mousemove',
        handleMouseMove
      );
    };
  }, []);

  /* 😉 Blink */
  useEffect(() => {
    let outerTimeout;
    let innerTimeout;

    const blink = () => {
      setBlinking(true);

      innerTimeout = setTimeout(() => {
        setBlinking(false);
      }, 200);

      outerTimeout = setTimeout(
        blink,
        Math.random() * 5000 + 2000
      );
    };

    outerTimeout = setTimeout(blink, 2000);

    return () => {
      clearTimeout(outerTimeout);
      clearTimeout(innerTimeout);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === 'password') {
      if (weakPasswords.includes(value.toLowerCase())) {
        setError(
          'Too weak! The eyes know this password 👀'
        );
        setSuspicious(true);
      } else {
        setError('');
        setSuspicious(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError(
        'Password too short (min 6 characters).'
      );

      setShake(true);

      setTimeout(() => {
        setShake(false);
      }, 500);

      return;
    }

    try {
      await api.post(
        '/api/auth/login',
        formData
      );

      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        setToken(true);
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.msg ||
        'Invalid email or password'
      );

      setShake(true);

      setTimeout(() => {
        setShake(false);
      }, 500);
    }
  };

  return (
    <div className="login-screen">
      <div className={`login-box ${shake ? 'shake' : ''}`}>

        <h2>Welcome Back</h2>

        {/* 👀 Eyes */}
        <div className="eyes-container">
          {[0, 1].map((index) => (
            <div
              className={`eye ${
                suspicious ? 'suspicious' : ''
              } ${blinking ? 'blink' : ''}`}
              key={index}
              ref={(el) => {
                eyesRef.current[index] = el;
              }}
            >
              <div className="pupil"></div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>

          {/* Email */}
          <div className="input-group">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Password */}
          <div className="input-group">
            <input
              type={
                showPassword
                  ? 'text'
                  : 'password'
              }
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <span
              className="input-icon"
              onClick={() =>
                setShowPassword(!showPassword)
              }
            >
              {showPassword ? '🔒' : '👁️'}
            </span>
          </div>

          <p className="login-message">
            {error}
          </p>

          <button
            type="submit"
            className="login-button"
          >
            Login
          </button>
        </form>

        {/* Register */}
        <div className="switch-auth">
          Need an account?{' '}
          <button onClick={onSwitchToRegister}>
            Register
          </button>
        </div>

        {/* Success */}
        <div
          className={`success ${
            success ? 'active' : ''
          }`}
        >
          <svg
            className="checkmark"
            viewBox="0 0 52 52"
          >
            <circle
              className="checkmark__circle"
              cx="26"
              cy="26"
              r="25"
              fill="none"
            />

            <path
              className="checkmark__check"
              fill="none"
              d="M14.1 27.2l7.1 7.2 16.7-16.8"
            />
          </svg>

          <h3>Access Granted!</h3>
        </div>

      </div>
    </div>
  );
};

export default Login;