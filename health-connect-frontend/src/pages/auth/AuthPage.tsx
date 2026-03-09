import React, { useState } from 'react';
import { HeartPulse, Shield, Activity, Stethoscope } from 'lucide-react';
import type { AuthView } from '../../types/auth.types';
import LoginForm from '../../components/auth/LoginForm';
import RegisterForm from '../../components/auth/RegisterForm';
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm';

const AuthPage: React.FC = () => {
  const [activeView, setActiveView] = useState<AuthView>('login');

  const renderForm = () => {
    switch (activeView) {
      case 'login':
        return <LoginForm onNavigate={setActiveView} />;
      case 'register':
        return <RegisterForm onNavigate={setActiveView} />;
      case 'forgot_password':
        return <ForgotPasswordForm onNavigate={setActiveView} />;
      default:
        return <LoginForm onNavigate={setActiveView} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800">
      
      {/* Left side: Form Panel */}
      <div className="w-full md:w-1/2 lg:w-[45%] xl:w-[40%] flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12 bg-white shadow-[10px_0_20px_rgba(0,0,0,0.02)] z-10 min-h-screen overflow-y-auto">
        <div className="w-full max-w-md mx-auto">
          
          {/* Logo / Header */}
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-200">
              <HeartPulse className="w-7 h-7 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Health<span className="text-blue-600">Connect</span>
            </h1>
          </div>

          {/* Dynamic Form Render */}
          {renderForm()}

          {/* Footer constraints/disclaimer */}
          <div className="mt-12 text-center text-xs text-slate-400">
            By continuing, you agree to Health Connect's <br/>
            <a href="#" className="underline hover:text-slate-600">Terms of Service</a> and <a href="#" className="underline hover:text-slate-600">Privacy Policy</a>.
          </div>

        </div>
      </div>

      {/* Right side: Branding Panel */}
      <div className="hidden md:flex w-1/2 lg:w-[55%] xl:w-[60%] bg-gradient-to-br from-blue-600 via-blue-700 to-teal-800 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-400/10 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

        <div className="relative z-10 max-w-lg text-white">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6 text-sm font-medium">
            <Shield className="w-4 h-4 text-teal-300" />
            HIPAA Compliant Platform
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 leading-tight">
            Streamlined Care. <br/>
            <span className="text-teal-300">Better Outcomes.</span>
          </h2>
          
          <p className="text-blue-100 text-lg mb-10 leading-relaxed">
            A unified ecosystem connecting patients, doctors, and administrators to ensure seamless medical record management and optimal treatment pathways.
          </p>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl">
              <Activity className="w-8 h-8 text-teal-300 mb-3" />
              <h3 className="font-semibold text-lg mb-1">Real-time Data</h3>
              <p className="text-blue-100/80 text-sm">Instant access to critical patient histories and metrics.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl">
              <Stethoscope className="w-8 h-8 text-teal-300 mb-3" />
              <h3 className="font-semibold text-lg mb-1">Treatment Tracking</h3>
              <p className="text-blue-100/80 text-sm">Comprehensive tools for monitoring recovery and medications.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;