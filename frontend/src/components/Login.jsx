import { useEffect, useRef, useState } from 'react';
import api from '../api';
import { weakPasswords } from '../utils/constants';
import './Login.css';

const Login = ({ setToken, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [suspicious, setSuspicious] = useState(false);
  const [blinking, setBlinking] = useState(false);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('Access Granted!');

  // Forgot password OTP flow states
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState('email'); // 'email' | 'otp'
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [strength, setStrength] = useState({
    score: 0,
    percentage: 0,
    message: '',
    feedback: '',
  });

  const eyesRef = useRef([]);
  const otpInputRef = useRef(null);

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
      document.removeEventListener('mousemove', handleMouseMove);
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

  /* ⏳ Resend countdown timer */
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  /* Focus OTP input when entering OTP step */
  useEffect(() => {
    if (forgotMode && forgotStep === 'otp' && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [forgotMode, forgotStep]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => {
      setShake(false);
    }, 500);
  };

  const checkPasswordStrength = (password) => {
    if (!password) {
      return { score: 0, percentage: 0, message: '', feedback: '' };
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
      feedback: feedback.length > 0 ? feedback.join(', ') : 'Password is adequate',
    };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === 'password') {
      if (weakPasswords.includes(value.toLowerCase())) {
        setError('Too weak! The eyes know this password 👀');
        setSuspicious(true);
      } else {
        setError('');
        setSuspicious(false);
      }
    }
  };

  const handleNewPasswordChange = (e) => {
    const value = e.target.value;
    setNewPassword(value);
    const result = checkPasswordStrength(value);
    setStrength(result);

    if (weakPasswords.includes(value.toLowerCase())) {
      setError('Too weak! The eyes know this password 👀');
      setSuspicious(true);
    } else {
      setError('');
      setSuspicious(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError('Password too short (min 6 characters).');
      triggerShake();
      return;
    }

    try {
      await api.post('/api/auth/login', formData);

      setSuccessMessage('Access Granted!');
      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        setToken(true);
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.msg ||
        err.response?.data?.errors?.[0]?.msg ||
        'Invalid email or password'
      );
      triggerShake();
    }
  };

  // Step 1: Send Reset OTP
  const handleRequestResetOtp = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    const email = forgotEmail.trim() || formData.email.trim();
    if (!email) {
      setError('Please enter your email address.');
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/forgot-password', { email });
      setForgotEmail(email);
      setForgotStep('otp');
      setNotice(data.msg || 'Verification code sent to your email.');
      setResendTimer(60);
    } catch (err) {
      setError(
        err.response?.data?.msg ||
        err.response?.data?.errors?.[0]?.msg ||
        'Could not send reset code. Please try again.'
      );
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Resend Reset OTP
  const handleResendResetOtp = async () => {
    if (resendTimer > 0 || loading) return;
    setError('');
    setNotice('');
    setLoading(true);

    try {
      const { data } = await api.post('/api/auth/forgot-password', { email: forgotEmail });
      setNotice(data.msg || 'A new verification code has been sent.');
      setResendTimer(60);
    } catch (err) {
      setError(err.response?.data?.msg || 'Could not resend verification code.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify OTP & Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    if (!resetOtp.trim() || resetOtp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      triggerShake();
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', {
        email: forgotEmail.trim(),
        otp: resetOtp.trim(),
        password: newPassword,
      });

      setSuccessMessage('Password Reset!');
      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
        setForgotMode(false);
        setForgotStep('email');
        setResetOtp('');
        setNewPassword('');
        setFormData((prev) => ({ ...prev, email: forgotEmail, password: '' }));
        setNotice('Password reset successfully. You can now log in.');
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.msg ||
        err.response?.data?.errors?.[0]?.msg ||
        'Could not reset password. Please check your code.'
      );
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const openForgotMode = () => {
    setForgotMode(true);
    setForgotStep('email');
    setForgotEmail(formData.email);
    setResetOtp('');
    setNewPassword('');
    setError('');
    setNotice('');
  };

  const closeForgotMode = () => {
    setForgotMode(false);
    setForgotStep('email');
    setError('');
    setNotice('');
  };

  return (
    <div className="login-screen">
      <div className={`login-box ${shake ? 'shake' : ''}`}>
        <h2>
          {forgotMode
            ? forgotStep === 'otp'
              ? 'Verify & Reset'
              : 'Reset Password'
            : 'Welcome Back'}
        </h2>

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

        {forgotMode ? (
          forgotStep === 'otp' ? (
            /* Forgot Password Step 2: OTP + New Password */
            <form onSubmit={handleResetPassword} className="otp-form">
              <p className="login-message instruction">
                Enter the 6-digit code sent to <br />
                <strong className="email-highlight">{forgotEmail}</strong>
              </p>

              {/* OTP Input */}
              <div className="input-group otp-group">
                <input
                  ref={otpInputRef}
                  type="text"
                  maxLength="6"
                  placeholder="000000"
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                  className="otp-input"
                  required
                  autoComplete="one-time-code"
                />
              </div>

              {/* New Password */}
              <div className="input-group">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="New password"
                  value={newPassword}
                  onChange={handleNewPasswordChange}
                  minLength="6"
                  required
                />
                <span
                  className="input-icon"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  title={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? '🔒' : '👁️'}
                </span>
              </div>

              {/* Password Strength */}
              {newPassword && (
                <>
                  <div className="password-strength">
                    <div
                      className={`password-strength-bar strength-${strength.score}`}
                      style={{ width: `${strength.percentage}%` }}
                    />
                  </div>
                  <div className="feedback">{strength.message}</div>
                </>
              )}

              {notice && <p className="login-message notice">{notice}</p>}
              {error && <p className="login-message error">{error}</p>}

              <button
                type="submit"
                className="login-button"
                disabled={loading || resetOtp.length !== 6 || newPassword.length < 6}
              >
                {loading ? 'Resetting Password...' : 'Verify & Set Password'}
              </button>

              <div className="otp-actions">
                <button
                  type="button"
                  className="otp-resend-btn"
                  onClick={handleResendResetOtp}
                  disabled={resendTimer > 0 || loading}
                >
                  {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend OTP'}
                </button>

                <button
                  type="button"
                  className="otp-back-btn"
                  onClick={() => {
                    setForgotStep('email');
                    setError('');
                    setNotice('');
                    setResetOtp('');
                  }}
                >
                  ← Change Email
                </button>
              </div>
            </form>
          ) : (
            /* Forgot Password Step 1: Request OTP */
            <form onSubmit={handleRequestResetOtp}>
              <p className="login-message instruction">
                Enter your email address to receive a 6-digit verification code.
              </p>
              <div className="input-group">
                <input
                  type="email"
                  placeholder="Email address"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>

              {notice && <p className="login-message notice">{notice}</p>}
              {error && <p className="login-message error">{error}</p>}

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'Sending Code...' : 'Send Verification OTP'}
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={closeForgotMode}
              >
                ← Back to Login
              </button>
            </form>
          )
        ) : (
          /* Regular Login Form */
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

            {notice && <p className="login-message notice">{notice}</p>}
            {error && <p className="login-message error">{error}</p>}

            <button type="submit" className="login-button">
              Login
            </button>
          </form>
        )}

        {/* Switch Auth Options */}
        {!forgotMode && (
          <div className="auth-links-group">
            <div className="switch-auth">
              <span>Forgot password?</span>
              <button type="button" onClick={openForgotMode}>
                Reset Password
              </button>
            </div>

            <div className="switch-auth">
              <span>Need an account?</span>
              <button type="button" onClick={onSwitchToRegister}>
                Register
              </button>
            </div>
          </div>
        )}

        {forgotMode && forgotStep === 'email' && (
          <div className="switch-auth">
            <span>Remember your password?</span>
            <button type="button" onClick={closeForgotMode}>
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
          <h3>{successMessage}</h3>
        </div>
      </div>
    </div>
  );
};

export default Login;
