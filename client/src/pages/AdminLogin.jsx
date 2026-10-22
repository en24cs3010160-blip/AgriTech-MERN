import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest, setAuthSession } from '../services/api';

export default function AdminLogin() {
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
      const data = await apiRequest('/auth/admin-login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      setAuthSession(data.token, data.user);
      navigate('/admin/dashboard');
    } catch (err) {
      setMessage(err.message || 'Administrative authentication failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page admin-auth-page">
      <section className="auth-card admin-auth-card">
        <div className="admin-badge-header">
          <span className="admin-shield-icon">🛡️</span>
          <div className="brand admin-brand">AgriTech Admin</div>
          <span className="security-tag">Restricted Portal</span>
        </div>

        <h1>Administrator Sign In</h1>
        <p>Platform monitoring, user control & governance console</p>

        <form onSubmit={handleSubmit}>
          <label>
            Admin Work Email
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@agritech.internal"
              required
              autoFocus
            />
          </label>

          <label>
            Admin Password
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter secure admin password"
              required
            />
          </label>

          <button type="submit" className="admin-submit-btn" disabled={loading}>
            {loading ? 'Verifying Credentials...' : 'Authenticate & Enter Console'}
          </button>
        </form>

        {message && (
          <div className="auth-message error admin-error" role="alert">
            <span>{message}</span>
            {message.includes('administrator privileges') && (
              <div style={{ marginTop: '8px' }}>
                <Link to="/login" style={{ color: '#0f766e', fontWeight: 700 }}>
                  ← Switch to Farmer Sign In Portal
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="auth-footer-links">
          <div className="return-to-user">
            <Link to="/login">← Back to Farmer Portal</Link>
          </div>
          <p className="security-disclaimer">
            Unauthorized access attempts are logged and strictly monitored.
          </p>
        </div>
      </section>
    </main>
  );
}

