import { useEffect, useRef, useState } from 'react';
import api from '../../api';
import './Register.css';

const weakPasswords = [
  '123',
  'password',
  '123456',
  'qwerty',
  'admin',
  'welcome',
  '1234',
  '12345',
  'football',
  'baseball',
  'dragon',
  'letmein',
  'monkey',
  'abc123',
  '111111',
  'sunshine',
  'princess',
  'qwertyuiop',
];

const Register = ({ setToken, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState({
    score: 0,
    percentage: 0,
    message: '',
    feedback: '',
  });

  const [suspicious, setSuspicious] = useState(false);
  const [blinking, setBlinking] = useState(false);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);

  const eyesRef = useRef([]);
  const containerRef = useRef(null);

  // 👀 Eye movement
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
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // 👁️ Blink
  useEffect(() => {
    let timeout;

    const blink = () => {
      setBlinking(true);

      setTimeout(() => {
        setBlinking(false);
      }, 200);

      timeout = setTimeout(
        blink,
        Math.random() * 5000 + 2000
      );
    };

    timeout = setTimeout(blink, 2000);

    return () => clearTimeout(timeout);
  }, []);

  const checkPasswordStrength = (password) => {
    if (!password) {
      return {
        score: 0,
        percentage: 0,
        message: '',
        feedback: '',
      };
    }

    let score = 0;
    const feedback = [];

    if (password.length < 8) {
      feedback.push('Password is too short');
    } else {
      score += 1;
    }

    if (weakPasswords.includes(password.toLowerCase())) {
      feedback.push('Password is too common');
      score = 0;
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Add numbers');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Add uppercase letters');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Add special characters');
    }

    score = Math.min(score, 5);

    let message = '';

    if (score === 0) message = 'Very weak';
    else if (score === 1) message = 'Weak';
    else if (score === 2) message = 'Fair';
    else if (score === 3) message = 'Good';
    else if (score === 4) message = 'Strong';
    else message = 'Very strong';

    return {
      score,
      percentage: (score / 5) * 100,
      message,
      feedback:
        feedback.length > 0
          ? feedback.join(', ')
          : 'Password is adequate',
    };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === 'password') {
      const result = checkPasswordStrength(value);

      setStrength(result);

      if (weakPasswords.includes(value.toLowerCase())) {
        setError('Too weak! The eyes know this password 👀');
        setSuspicious(true);
      } else {
        setError('');
        setSuspicious(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = checkPasswordStrength(formData.password);

    if (result.score <= 1) {
      setError(
        'Password too weak! The eyes are not pleased.'
      );

      setShake(true);

      setTimeout(() => {
        setShake(false);
      }, 500);

      return;
    }

    if (formData.username.length < 3) {
      setError('Username too short!');

      setShake(true);

      setTimeout(() => {
        setShake(false);
      }, 500);

      return;
    }

    try {
      await api.post(
        '/api/auth/register',
        formData
      );

      setError('');
      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        setFormData({
          username: '',
          email: '',
          password: '',
        });
        setStrength({
          score: 0,
          percentage: 0,
          message: '',
          feedback: '',
        });

        setToken(true);
      }, 3000);
    } catch (err) {
      setError(
        err.response?.data?.msg ||
        'An error occurred'
      );
    }
  };

  return (
    <div className="register-screen">
      <div
        className={`register-box ${shake ? 'shake' : ''}`}
        ref={containerRef}
      >
        <h2>Create Account</h2>

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
          {/* Username */}
          <div className="input-group">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

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
              type={showPassword ? 'text' : 'password'}
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

          {/* Password Strength */}
          <div className="password-strength">
            <div
              className={`password-strength-bar strength-${strength.score}`}
              style={{
                width: `${strength.percentage}%`,
              }}
            />
          </div>

          <div className="feedback">
            {strength.message}
          </div>

          <p className="register-message">
            {error}
          </p>

          <button
            type="submit"
            className="register-button"
          >
            Register
          </button>
        </form>

        {/* Switch Login */}
        <div className="switch-auth">
          Already have an account?{' '}
          <button onClick={onSwitchToLogin}>
            Login
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

          <h3>Account Created!</h3>
        </div>
      </div>
    </div>
  );
};

export default Register;