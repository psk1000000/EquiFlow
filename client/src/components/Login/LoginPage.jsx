import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim());
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card glass-elevated">
          <div className="login-brand">
            <span className="login-logo">📊</span>
            <h1 className="login-title">EquiFlow</h1>
            <p className="login-subtitle">Real-time trading dashboard</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} id="login-form">
            <div className="login-field">
              <label htmlFor="email-input" className="login-label">
                Email Address
              </label>
              <input
                id="email-input"
                type="email"
                className="input login-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                autoComplete="email"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="login-error" role="alert" id="login-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary login-btn"
              disabled={loading || !email.trim()}
              id="login-submit-btn"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="login-features">
            <div className="login-feature">
              <span className="login-feature-icon">⚡</span>
              <span className="login-feature-text">Real-time<br />Prices</span>
            </div>
            <div className="login-feature">
              <span className="login-feature-icon">📈</span>
              <span className="login-feature-text">Live<br />Trading</span>
            </div>
            <div className="login-feature">
              <span className="login-feature-icon">📰</span>
              <span className="login-feature-text">Market<br />News</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
