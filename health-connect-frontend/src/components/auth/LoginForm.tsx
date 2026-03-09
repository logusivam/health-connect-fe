import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import type { Role, AuthView } from '../../types/auth.types';

interface LoginFormProps {
  onNavigate: (view: AuthView) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('PATIENT');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'DOCTOR' && otp.length < 6) {
      alert("Please enter a valid 6-digit OTP.");
      return;
    }
    console.log('Login Submitted:', { email, password, role, ...(role === 'DOCTOR' && { otp }) });
    alert(`Logged in successfully as ${role}!`);
  };

  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h2>
        <p className="text-slate-500">Please enter your details to access your portal.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 block">Login as</label>
          <select
            value={role}
            onChange={(e) => { setRole(e.target.value as Role); setOtp(''); setOtpSent(false); }}
            className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm bg-slate-50 focus:bg-white appearance-none cursor-pointer"
          >
            <option value="PATIENT">Patient</option>
            <option value="DOCTOR">Doctor</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 block">Email Address</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm bg-slate-50 focus:bg-white"
                placeholder="name@example.com"
              />
            </div>
            {role === 'DOCTOR' && (
              <button
                type="button"
                onClick={() => setOtpSent(true)}
                className="px-4 py-3 bg-blue-50 text-blue-600 text-sm font-semibold rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors whitespace-nowrap"
              >
                {otpSent ? 'Resend OTP' : 'Send OTP'}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-slate-700 block">Password</label>
            <button 
              type="button" 
              onClick={() => onNavigate('forgot_password')}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-11 pr-12 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm bg-slate-50 focus:bg-white"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {role === 'DOCTOR' && (
          <div className="space-y-1.5 pt-2">
            <label className="text-sm font-semibold text-slate-700 block">Verification Code (OTP)</label>
            <input
              type="text"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-center tracking-[0.5em] font-mono text-lg bg-slate-50 focus:bg-white"
              placeholder="000000"
            />
            <p className="text-xs text-slate-500 mt-1 text-center">
              {otpSent ? 'Enter the 6-digit code sent to your email.' : 'Click "Send OTP" to receive your code.'}
            </p>
          </div>
        )}

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-200 hover:shadow-blue-300 mt-4 active:scale-[0.98]"
        >
          Sign In
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-slate-600">
          Don't have an account?{' '}
          <button
            onClick={() => onNavigate('register')}
            className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-all"
          >
            Sign up
          </button>
        </p>
      </div>
    </>
  );
};

export default LoginForm;