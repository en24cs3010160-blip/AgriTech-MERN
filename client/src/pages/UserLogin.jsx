import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest, setAuthSession } from '../services/api';

export default function UserLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      setAuthSession(data.token, data.user);

      if (data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setMessage(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand">🌱 AgriTech</div>
        <h1>Farmer Login</h1>
        <p>Empowering Farmers Through Digital Technology</p>

        <div className="auth-tabs">
          <Link to="/login" className="auth-tab-link active">
            Farmer Login
          </Link>
          <Link to="/register" className="auth-tab-link">
            Farmer Signup
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            Email Address
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. farmer@example.com"
              required
              autoFocus
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
          </button>
        </form>

        {message && (
          <div className="auth-message error" role="alert">
            <span>{message}</span>
            {message.includes('Admin Portal') && (
              <div style={{ marginTop: '8px' }}>
                <Link to="/admin/login" className="admin-portal-link" style={{ fontWeight: 700 }}>
                  Open Admin Portal →
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="auth-footer-links">
          <p>
            New to AgriTech? <Link to="/register">Create Farmer Account</Link>
          </p>
          <div className="admin-access-callout">
            <span>Platform Administrator?</span>{' '}
            <Link to="/admin/login" className="admin-portal-link">
              Admin Portal →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

