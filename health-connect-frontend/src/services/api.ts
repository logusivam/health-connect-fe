import { API_BASE_URL } from "../config/env";

const getHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export const authApi = {
  login: async (data: any) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // ADDED: Register method
  register: async (data: any) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  }
};

export const patientApi = {
  getProfile: async () => {
    const res = await fetch(`${API_BASE_URL}/patients/profile`, { headers: getHeaders() });
    return res.json();
  },
  updateProfile: async (data: any) => {
    const res = await fetch(`${API_BASE_URL}/patients/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  }
};