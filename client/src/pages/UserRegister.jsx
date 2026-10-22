import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api';

export default function UserRegister() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });

      setIsSuccess(true);
      setMessage(data.message || 'Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setIsSuccess(false);
      setMessage(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand">🌱 AgriTech</div>
        <h1>Create Farmer Account</h1>
        <p>Register to manage farms, crops, marketplace products & soil health</p>

        <div className="auth-tabs">
          <Link to="/login" className="auth-tab-link">
            Farmer Login
          </Link>
          <Link to="/register" className="auth-tab-link active">
            Farmer Signup
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            Full Name
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Ramesh Patel"
              required
              autoFocus
            />
          </label>

          <label>
            Email Address
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. farmer@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              minLength={6}
              required
            />
          </label>

          <label>
            Confirm Password
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              minLength={6}
              required
            />
          </label>

          <div className="account-type-badge">
            <span>🛡️ Account Type: <strong>Registered Farmer</strong></span>
            <small>Public registration creates farmer accounts.</small>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        {message && (
          <p className={`auth-message ${isSuccess ? 'success' : 'error'}`} role="status">
            {message}
          </p>
        )}

        <div className="auth-footer-links">
          <p>
            Already have an account? <Link to="/login">Sign In here</Link>
          </p>
          <div className="admin-access-callout">
            <span>Administrative staff?</span>{' '}
            <Link to="/admin/login" className="admin-portal-link">
              Admin Portal →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

