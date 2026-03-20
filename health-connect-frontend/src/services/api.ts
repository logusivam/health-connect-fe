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
  // Inside export const authApi = { ... }
  sendLoginOtp: (data: { email: string, role: string }) => fetchWithCookies('/auth/login/send-otp', { method: 'POST', body: JSON.stringify(data) }),
  verifyLoginOtp: (data: { email: string, otp: string }) => fetchWithCookies('/auth/login/verify-otp', { method: 'POST', body: JSON.stringify(data) }),
  // ... forget password routes ...
  sendResetOtp: (data: { email: string, role: string }) => fetchWithCookies('/auth/forgot-password/send-otp', { method: 'POST', body: JSON.stringify(data) }),
  verifyResetOtp: (data: { email: string, otp: string }) => fetchWithCookies('/auth/forgot-password/verify-otp', { method: 'POST', body: JSON.stringify(data) }),
  resetPassword: (data: any) => fetchWithCookies('/auth/forgot-password/reset', { method: 'POST', body: JSON.stringify(data) }),
};

export const patientApi = {
  getProfile: () => fetchWithCookies('/patients/profile', { method: 'GET' }),
  updateProfile: (data: any) => fetchWithCookies('/patients/profile', { method: 'PUT', body: JSON.stringify(data) }),
};

export const doctorApi = {
  getProfile: () => fetchWithCookies('/doctors/profile', { method: 'GET' }),
  updateProfile: (data: any) => fetchWithCookies('/doctors/profile', { method: 'PUT', body: JSON.stringify(data) }),
};