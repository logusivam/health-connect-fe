import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { Role } from '../../types/auth.types';
import { authApi } from '../../services/api';

interface LoginFormProps {
  onLogin: (role: Role) => void; 
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('PATIENT');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  // MFA States
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');

  const requiresOtp = role === 'DOCTOR' || role === 'ADMIN';

  // Countdown Timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Auto-verify OTP when 6 digits are typed
  useEffect(() => {
    if (otp.length === 6 && !isOtpVerified) {
      verifyOtpAutomatically();
    }
  }, [otp]);

  const handleSendOtp = async () => {
    if (!email) return setGlobalError("Please enter your email address.");
    
    setGlobalError('');
    setOtpError('');
    setOtpSuccessMsg('');
    setIsLoading(true);
    
    try {
      const res = await authApi.sendLoginOtp({ email, role });
      if (res.success) {
        setOtpSent(true);
        setCountdown(res.cooldown); // 90, 120, or 150 seconds dynamically
        setOtpSuccessMsg('OTP sent successfully');
      } else {
        // Backend returns "Role and email doesn't match" or "Too many attempts"
        setGlobalError(res.message);
      }
    } catch (err) {
      setGlobalError("Network error sending OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtpAutomatically = async () => {
    setOtpError('');
    try {
      const res = await authApi.verifyLoginOtp({ email, otp });
      if (res.success) {
        setIsOtpVerified(true);
        setOtpSuccessMsg('OTP verified successfully');
        setOtpError('');
      } else {
        setOtpError("Wrong OTP");
      }
    } catch (err) {
      setOtpError("Network error verifying OTP.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');

    if (requiresOtp && !isOtpVerified) {
      return setGlobalError("Please enter and verify the OTP.");
    }

    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password, role, otp });

      if (response.success) {
        onLogin(role);
      } else {
        setGlobalError(response.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      setGlobalError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // When OTP is sent and we are waiting, lock the role and email
  const isFieldLocked = otpSent;

  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h2>
        <p className="text-slate-500">Please enter your details to access your portal.</p>
      </div>

      {globalError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl text-center">
          {globalError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 block">Login as</label>
          <select
            value={role}
            disabled={isFieldLocked}
            onChange={(e) => { 
              setRole(e.target.value as Role); 
              setOtp(''); 
              setOtpSent(false); 
              setIsOtpVerified(false);
              setGlobalError('');
              setOtpSuccessMsg('');
            }}
            className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm bg-slate-50 focus:bg-white appearance-none cursor-pointer disabled:opacity-60"
          >
            <option value="PATIENT">Patient</option>
            <option value="DOCTOR">Doctor</option>
            <option value="ADMIN">System Admin</option>
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
                disabled={isFieldLocked}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm bg-slate-50 focus:bg-white disabled:opacity-60"
                placeholder="name@example.com"
              />
            </div>
            {requiresOtp && (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={countdown > 0 || isOtpVerified || !email || isLoading}
                className="px-4 py-3 bg-blue-50 text-blue-600 text-sm font-semibold rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isOtpVerified ? 'Verified' : countdown > 0 ? `Resend in ${countdown}s` : otpSent ? 'Resend OTP' : 'Send OTP'}
              </button>
            )}
          </div>
          {/* OTP Sent Success Message below email */}
          {otpSuccessMsg && !isOtpVerified && (
            <p className="text-xs font-semibold text-green-600 mt-1 pl-1">{otpSuccessMsg}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-slate-700 block">Password</label>
            <button 
              type="button" 
              onClick={() => navigate('/forgot-password')}
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

        {requiresOtp && otpSent && (
          <div className="space-y-1.5 pt-2">
            <label className="text-sm font-semibold text-slate-700 block flex justify-between items-center">
              Verification Code (OTP)
              {isOtpVerified && <span className="text-xs font-bold text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5"/> Verified</span>}
            </label>
            <input
              type="text"
              required
              maxLength={6}
              disabled={isOtpVerified} // Disable if correct
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className={`block w-full px-4 py-3 border ${otpError ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50' : isOtpVerified ? 'border-green-300 bg-green-50 text-green-700' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500 bg-slate-50'} rounded-xl focus:ring-2 transition-colors text-center tracking-[0.5em] font-mono text-lg disabled:opacity-60`}
              placeholder="000000"
            />
            {otpError && <p className="text-xs font-semibold text-red-500 mt-1 pl-1 text-center">{otpError}</p>}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || (requiresOtp && !isOtpVerified)}
          className={`w-full flex items-center justify-center gap-2 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 mt-4 ${isLoading || (requiresOtp && !isOtpVerified) ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 hover:shadow-blue-300 active:scale-[0.98]'}`}
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
          {!isLoading && <ArrowRight className="w-5 h-5" />}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-slate-600">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/register')}
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