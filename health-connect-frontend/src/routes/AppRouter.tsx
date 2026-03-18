import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AuthPage from '../pages/auth/AuthPage';
import PatientDashboard from '../pages/patient/PatientDashboard';
import DoctorDashboard from '../pages/doctor/DoctorDashboard';
import AdminDashboard  from '../pages/admin/AdminDashboard';
import type { Role } from '../types/auth.types';

export default function AppRouter() {
  const navigate = useNavigate();
  
  // Initialize state from local storage to survive page refreshes
  const [userRole, setUserRole] = useState<Role | null>(() => {
    return (localStorage.getItem('userRole') as Role) || null;
  });

  const handleLogin = (role: string) => {
    const validRole = role as Role;
    setUserRole(validRole);
    localStorage.setItem('userRole', validRole); // Save session

    // Route to the unique base paths
    if (validRole === 'PATIENT') navigate('/patient/dashboard');
    if (validRole === 'DOCTOR') navigate('/doctor/dashboard');
    if (validRole === 'ADMIN') navigate('/admin/patient_records');
  };

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<AuthPage view="login" onLogin={handleLogin} />} />
      <Route path="/register" element={<AuthPage view="register" />} />
      <Route path="/forgot-password" element={<AuthPage view="forgot-password" />} />

      {/* Protected Dashboard Routes (The /* allows sub-routing like /patient/history) */}
      <Route 
        path="/patient/*" 
        element={userRole === 'PATIENT' ? <PatientDashboard /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/doctor/*" 
        element={userRole === 'DOCTOR' ? <DoctorDashboard /> : <Navigate to="/login" replace />} 
      />
      <Route 
        path="/admin/*" 
        element={userRole === 'ADMIN' ? <AdminDashboard /> : <Navigate to="/login" replace />} 
      />

      {/* Fallback: If URL doesn't match anything, go to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}