import { useEffect, useRef, useState } from 'react';
import api from '../api';
import { weakPasswords } from '../utils/constants';
import './Register.css';

const Register = ({ setToken, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [notice, setNotice] = useState('');
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
  const otpInputRef = useRef(null);

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

  // ⏳ Resend countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Focus OTP input when entering OTP step
  useEffect(() => {
    if (step === 'otp' && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

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

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => {
      setShake(false);
    }, 500);
  };

  // Step 1: Send OTP to Email
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (formData.username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      triggerShake();
      return;
    }

    const result = checkPasswordStrength(formData.password);
    if (result.score <= 1) {
      setError('Password too weak! Please use a stronger password.');
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/send-register-otp', {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      setStep('otp');
      setNotice(data.msg || 'Verification code sent to your email.');
      setResendTimer(60);
    } catch (err) {
      setError(
        err.response?.data?.msg ||
        err.response?.data?.errors?.[0]?.msg ||
        'Could not send verification code. Please check your details.'
      );
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0 || loading) return;
    setError('');
    setNotice('');
    setLoading(true);

    try {
      const { data } = await api.post('/api/auth/send-register-otp', {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
      setNotice(data.msg || 'A new verification code has been sent.');
      setResendTimer(60);
    } catch (err) {
      setError(err.response?.data?.msg || 'Could not resend verification code.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify OTP & Complete Registration
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/register', {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        otp: otp.trim(),
      });

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
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.msg ||
        err.response?.data?.errors?.[0]?.msg ||
        'Invalid verification code. Please try again.'
      );
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-screen">
      <div className={`register-box ${shake ? 'shake' : ''}`}>
        <h2>{step === 'otp' ? 'Verify Email' : 'Create Account'}</h2>

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

        {step === 'otp' ? (
          <form onSubmit={handleVerifyOtp} className="otp-form">
            <p className="register-instruction">
              Enter the 6-digit code sent to <br />
              <strong className="email-highlight">{formData.email}</strong>
            </p>

            <div className="input-group otp-group">
              <input
                ref={otpInputRef}
                type="text"
                maxLength="6"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="otp-input"
                required
                autoComplete="one-time-code"
              />
            </div>

            {notice && <p className="register-notice">{notice}</p>}
            {error && <p className="register-message">{error}</p>}

            <button
              type="submit"
              className="register-button"
              disabled={loading || otp.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify & Create Account'}
            </button>

            <div className="otp-actions">
              <button
                type="button"
                className="otp-resend-btn"
                onClick={handleResendOtp}
                disabled={resendTimer > 0 || loading}
              >
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend OTP'}
              </button>

              <button
                type="button"
                className="otp-back-btn"
                onClick={() => {
                  setStep('form');
                  setError('');
                  setNotice('');
                  setOtp('');
                }}
              >
                ← Edit Details
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRequestOtp}>
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
                placeholder="Email address"
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
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
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

            <div className="feedback">{strength.message}</div>

            {error && <p className="register-message">{error}</p>}

            <button
              type="submit"
              className="register-button"
              disabled={loading}
            >
              {loading ? 'Sending OTP...' : 'Continue & Verify Email'}
            </button>
          </form>
        )}

        {/* Switch Login */}
        {step === 'form' && (
          <div className="switch-auth">
            <span>Already have an account?</span>
            <button type="button" onClick={onSwitchToLogin}>
              Login
            </button>
          </div>
        )}

        {/* Success */}
        <div className={`success ${success ? 'active' : ''}`}>
          <svg className="checkmark" viewBox="0 0 52 52">
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
