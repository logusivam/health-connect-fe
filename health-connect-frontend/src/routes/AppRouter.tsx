import React, { useState } from 'react';
import AuthPage from '../pages/auth/AuthPage';
import PatientDashboard from '../pages/patient/PatientDashboard';
import DoctorDashboard from '../pages/doctor/DoctorDashboard';
import AdminDashboard  from '../pages/admin/AdminDashboard';
import type { Role } from '../types/auth.types';

export default function AppRouter() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<Role | null>(null);

  const handleLogin = (role: string) => {
    setIsAuthenticated(true);
    setUserRole(role as Role);
  };

  // If logged in and role is PATIENT, render the dashboard
  if (isAuthenticated && userRole === 'PATIENT') {
    return <PatientDashboard />;
  }

  // Placeholder for Doctor Dashboard
  if (isAuthenticated && userRole === 'DOCTOR') {
    return <DoctorDashboard />;
  }
  // Render Admin Dashboard
  if (isAuthenticated && userRole === 'ADMIN') {
    return <AdminDashboard />;
  }

  // Default: Render the Auth page and pass the handleLogin function
  return (
    <AuthPage onLogin={handleLogin} />
  );
}