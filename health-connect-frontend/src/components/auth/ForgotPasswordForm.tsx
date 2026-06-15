import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { Role } from '../../types/auth.types';
import { usePasswordStrength } from '../../hooks/usePasswordStrength';
import { authApi } from '../../services/api';

const ForgotPasswordForm: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>('PATIENT');
  const [email, setEmail] = useState('');
  
  // OTP States
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');
  
  // Password States
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { strength, strengthColors, strengthLabels } = usePasswordStrength(password);

  // 90-Second Countdown Timer
  useEffect(() => {
    // Let TypeScript automatically infer the correct environment type
    let timer: ReturnType<typeof setInterval>;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Auto-verify OTP when user enters 6 digits
  useEffect(() => {
    if (otp.length === 6 && !isOtpVerified) {
      verifyOtpAutomatically();
    }
  }, [otp]);

  const handleSendOtp = async () => {
    if (!email) return alert("Please enter your email address first.");
    
    setOtpSent(true);
    setCountdown(90);
    setOtpError('');
    
    try {
      const res = await authApi.sendResetOtp({ email, role });
      if (!res.success) {
        setOtpError(res.message);
        setCountdown(0); // Reset if failed
      }
    } catch (err) {
      setOtpError("Network error sending OTP.");
      setCountdown(0);
    }
  };

  const verifyOtpAutomatically = async () => {
    try {
      const res = await authApi.verifyResetOtp({ email, otp });
      if (res.success) {
        setIsOtpVerified(true);
        setOtpError('');
      } else {
        setOtpError("Invalid or expired OTP code.");
      }
    } catch (err) {
      setOtpError("Network error verifying OTP.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOtpVerified) return alert("Please enter and verify the OTP first.");
    if (password !== confirmPassword) return alert("Passwords do not match!");

    setIsLoading(true);
    try {
      const res = await authApi.resetPassword({ email, role, otp, newPassword: password });
      
      if (res.success) {
        setResetSuccessMessage("Password reset successfully! Redirecting...");
        setTimeout(() => navigate('/login'), 2500);
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert("Network error resetting password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Reset Password</h2>
        <p className="text-slate-500">Enter your details to reset your password.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 block">Account Role</label>
          <select
            value={role}
            disabled={otpSent || isOtpVerified}
            onChange={(e) => setRole(e.target.value as Role)}
            className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm bg-slate-50 focus:bg-white appearance-none cursor-pointer disabled:opacity-50"
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
                disabled={isOtpVerified}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm bg-slate-50 focus:bg-white disabled:opacity-50"
                placeholder="name@example.com"
              />
            </div>
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={countdown > 0 || isOtpVerified || !email}
              className="px-4 py-3 bg-blue-50 text-blue-600 text-sm font-semibold rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isOtpVerified ? 'Verified' : countdown > 0 ? `Resend in ${countdown}s` : otpSent ? 'Resend OTP' : 'Send OTP'}
            </button>
          </div>
        </div>

        {otpSent && (
          <div className="space-y-1.5 pt-2">
            <label className="text-sm font-semibold text-slate-700 block flex justify-between items-center">
              Verification Code (OTP)
              {isOtpVerified && <span className="text-xs font-bold text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5"/> OTP Verified</span>}
            </label>
            <input
              type="text"
              required
              maxLength={6}
              disabled={isOtpVerified}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className={`block w-full px-4 py-3 border ${otpError ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50' : isOtpVerified ? 'border-green-300 bg-green-50 text-green-700' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500 bg-slate-50'} rounded-xl focus:ring-2 transition-colors text-center tracking-[0.5em] font-mono text-lg disabled:opacity-60`}
              placeholder="000000"
            />
            {otpError && <p className="text-xs font-semibold text-red-500 mt-1 text-center">{otpError}</p>}
            {!otpError && !isOtpVerified && <p className="text-xs text-slate-500 mt-1 text-center">Enter the 6-digit code sent to your email.</p>}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 block">New Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              disabled={!isOtpVerified}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-11 pr-12 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm bg-slate-50 focus:bg-white disabled:opacity-50"
              placeholder="••••••••"
            />
            <button
              type="button"
              disabled={!isOtpVerified}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          
          {password && (
            <div className="pt-1">
              <div className="flex gap-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                {[1, 2, 3, 4].map((level) => (
                  <div key={level} className={`flex-1 transition-all duration-300 ${strength >= level ? strengthColors[strength] : 'bg-transparent'}`}></div>
                ))}
              </div>
              <p className={`text-xs mt-1.5 font-medium ${strength < 2 ? 'text-red-500' : strength < 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                Strength: {strengthLabels[strength]}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 block">Confirm Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              required
              disabled={!isOtpVerified}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`block w-full pl-11 pr-12 py-3 border ${confirmPassword && password !== confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500'} rounded-xl focus:ring-2 transition-colors text-sm bg-slate-50 focus:bg-white disabled:opacity-50`}
              placeholder="••••••••"
            />
            <button
              type="button"
              disabled={!isOtpVerified}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {confirmPassword && (
            <p className={`text-xs mt-1.5 font-medium ${password === confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
              {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!isOtpVerified || isLoading}
          className={`w-full flex items-center justify-center gap-2 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 mt-4 ${!isOtpVerified || isLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 hover:shadow-blue-300 active:scale-[0.98]'}`}
        >
          {isLoading ? 'Resetting...' : 'Reset Password'}
          {!isLoading && <ArrowRight className="w-5 h-5" />}
        </button>

        {/* Success Message Banner */}
        {resetSuccessMessage && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm font-semibold rounded-xl text-center flex items-center justify-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5" />
            {resetSuccessMessage}
          </div>
        )}
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-slate-600">
          Remembered your password?{' '}
          <button onClick={() => navigate('/login')} className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-all">
            Back to login
          </button>
        </p>
      </div>
    </>
  );
};

export default ForgotPasswordForm;