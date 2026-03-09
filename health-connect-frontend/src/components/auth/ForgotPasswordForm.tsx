import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import type { Role, AuthView } from '../../types/auth.types';
import { usePasswordStrength } from '../../hooks/usePasswordStrength';

interface ForgotPasswordFormProps {
  onNavigate: (view: AuthView) => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onNavigate }) => {
  const [role, setRole] = useState<Role>('PATIENT');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { strength, strengthColors, strengthLabels } = usePasswordStrength(password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    if (otp.length < 6) {
      alert("Please enter a valid 6-digit OTP.");
      return;
    }
    console.log('Reset Password Submitted:', { role, email, otp, password });
    alert('Password reset successfully!');
    onNavigate('login');
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
            onChange={(e) => setRole(e.target.value as Role)}
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
            <button
              type="button"
              onClick={() => setOtpSent(true)}
              className="px-4 py-3 bg-blue-50 text-blue-600 text-sm font-semibold rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors whitespace-nowrap"
            >
              {otpSent ? 'Resend OTP' : 'Send OTP'}
            </button>
          </div>
        </div>

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

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 block">New Password</label>
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
          
          {password && (
            <div className="pt-1">
              <div className="flex gap-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                {[1, 2, 3, 4].map((level) => (
                  <div 
                    key={level} 
                    className={`flex-1 transition-all duration-300 ${strength >= level ? strengthColors[strength] : 'bg-transparent'}`}
                  ></div>
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
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`block w-full pl-11 pr-12 py-3 border ${confirmPassword && password !== confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500'} rounded-xl focus:ring-2 transition-colors text-sm bg-slate-50 focus:bg-white`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
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
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-200 hover:shadow-blue-300 mt-4 active:scale-[0.98]"
        >
          Reset Password
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-slate-600">
          Remembered your password?{' '}
          <button
            onClick={() => onNavigate('login')}
            className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-all"
          >
            Back to login
          </button>
        </p>
      </div>
    </>
  );
};

export default ForgotPasswordForm;