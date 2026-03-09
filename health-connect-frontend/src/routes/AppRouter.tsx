import React, { useState } from 'react';
import AuthPage from '../pages/auth/AuthPage';
import PatientDashboard from '../pages/patient/PatientDashboard';
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Doctor Dashboard</h2>
          <p className="text-slate-500">Coming soon...</p>
        </div>
      </div>
    );
  }

  // Default: Render the Auth page and pass the handleLogin function
  return (
    <AuthPage onLogin={handleLogin} />
  );
}