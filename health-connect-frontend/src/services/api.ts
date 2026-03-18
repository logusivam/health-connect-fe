import { API_BASE_URL } from '../config/env';

// Base fetch wrapper to automatically include cookies
const fetchWithCookies = async (endpoint: string, options: RequestInit = {}) => {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include', // CRITICAL: This sends the httpOnly cookies
  });
  return res.json();
};

export const authApi = {
  login: (data: any) => fetchWithCookies('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: any) => fetchWithCookies('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => fetchWithCookies('/auth/logout', { method: 'POST' }),
  getMe: () => fetchWithCookies('/auth/me', { method: 'GET' }),
};

export const patientApi = {
  getProfile: () => fetchWithCookies('/patients/profile', { method: 'GET' }),
  updateProfile: (data: any) => fetchWithCookies('/patients/profile', { method: 'PUT', body: JSON.stringify(data) }),
};