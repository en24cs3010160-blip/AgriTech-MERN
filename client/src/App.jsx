import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import UserLogin from './pages/UserLogin';
import UserRegister from './pages/UserRegister';
import AdminLogin from './pages/AdminLogin';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { getCurrentUser, getAuthToken, apiRequest, setAuthSession, clearAuthSession } from './services/api';
import './App.css';

function HomeRedirect() {
  const user = getCurrentUser();
  const token = getAuthToken();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

function ProtectedRoute({ children }) {
  const user = getCurrentUser();
  const token = getAuthToken();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const user = getCurrentUser();
  const token = getAuthToken();

  if (!token || !user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    apiRequest('/auth/me')
      .then(data => {
        if (data?.user) {
          setAuthSession(token, data.user);
        }
      })
      .catch(() => {
        clearAuthSession();
      });
  }, []);

  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<UserLogin />} />
      <Route path="/register" element={<UserRegister />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}