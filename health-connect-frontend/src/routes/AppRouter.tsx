import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AuthPage from '../pages/auth/AuthPage';
import PatientDashboard from '../pages/patient/PatientDashboard';
import DoctorDashboard from '../pages/doctor/DoctorDashboard';
import AdminDashboard from '../pages/admin/AdminDashboard';
import HomePage from '../pages/HomePage';
import favIcon from '../assets/logo-v1.png';
import type { Role } from '../types/auth.types';
import { authApi } from '../services/api'; 

export default function AppRouter() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Check auth status via cookies on initial load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await authApi.getMe();
        if (res.success) {
          setIsAuthenticated(true);
          setUserRole(res.data.role);
        }
      } catch (error) {
        // Not logged in or expired
      } finally {
        setIsInitializing(false);
      }
    };
    checkSession();
  }, []);

  const handleLogin = (role: string) => {
    const validRole = role as Role;
    setIsAuthenticated(true);
    setUserRole(validRole);

    if (validRole === 'PATIENT') navigate('/patient/dashboard');
    if (validRole === 'DOCTOR') navigate('/doctor/dashboard');
    if (validRole === 'ADMIN') navigate('/admin/patient_records');
  };

  // Show a loading screen while checking the session cookie
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <img src={favIcon} alt="HealthConnect Logo" className='w-12 h-12 ' />
        <p className="text-slate-500 font-medium">Securing session...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route path="/login" element={<AuthPage view="login" onLogin={handleLogin} />} />
      <Route path="/register" element={<AuthPage view="register" />} />
      <Route path="/forgot-password" element={<AuthPage view="forgot-password" />} />

      <Route path="/patient/*" element={isAuthenticated && userRole === 'PATIENT' ? <PatientDashboard /> : <Navigate to="/login" replace />} />
      <Route path="/doctor/*" element={isAuthenticated && userRole === 'DOCTOR' ? <DoctorDashboard /> : <Navigate to="/login" replace />} />
      <Route path="/admin/*" element={isAuthenticated && userRole === 'ADMIN' ? <AdminDashboard /> : <Navigate to="/login" replace />} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}