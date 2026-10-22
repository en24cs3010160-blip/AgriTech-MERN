const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function getAuthToken() {
  return localStorage.getItem('agritechToken') || '';
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('agritechUser') || 'null');
  } catch {
    return null;
  }
}

export function setAuthSession(token, user) {
  localStorage.setItem('agritechToken', token);
  localStorage.setItem('agritechUser', JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem('agritechToken');
  localStorage.removeItem('agritechUser');
}

export async function apiRequest(path, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

export default apiRequest;

