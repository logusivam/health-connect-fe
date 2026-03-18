import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Activity, Stethoscope, Shield, Mail, Lock, Eye, EyeOff, ArrowRight, Calendar, Phone, Droplet } from 'lucide-react';
import type { Role } from '../../types/auth.types';
import { usePasswordStrength } from '../../hooks/usePasswordStrength';
import { authApi } from '../../services/api'; // ADDED: Import the API service

const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  
  // Base User State
  const [role, setRole] = useState<Role>('PATIENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Profile State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  
  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { strength, strengthColors, strengthLabels } = usePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setIsLoading(true);

    try {
      // UPDATED: Using the centralized authApi service
      const data = await authApi.register({
        email,
        password,
        role,
        firstName,
        lastName,
        dob,
        gender,
        phone,
        bloodGroup
      });

      if (data.success) {
        alert(`Registered successfully as ${role}! Please log in.`);
        navigate('/login');
      } else {
        alert(data.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration Error:', error);
      alert('Network error. Please ensure the backend server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Create an account</h2>
        <p className="text-slate-500">Join our secure healthcare network today.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Role Selection */}
        <div className="space-y-2 pb-2">
          <label className="text-sm font-semibold text-slate-700 block">I am a...</label>
          <div className="grid grid-cols-3 gap-3">
            <button type="button" onClick={() => setRole('PATIENT')} className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${role === 'PATIENT' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50'}`}>
              <Activity className={`w-6 h-6 mb-1.5 ${role === 'PATIENT' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className="text-xs font-semibold">Patient</span>
            </button>
            <button type="button" onClick={() => setRole('DOCTOR')} className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${role === 'DOCTOR' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50'}`}>
              <Stethoscope className={`w-6 h-6 mb-1.5 ${role === 'DOCTOR' ? 'text-teal-500' : 'text-slate-400'}`} />
              <span className="text-xs font-semibold">Doctor</span>
            </button>
            <button type="button" onClick={() => setRole('ADMIN')} className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${role === 'ADMIN' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50'}`}>
              <Shield className={`w-6 h-6 mb-1.5 ${role === 'ADMIN' ? 'text-indigo-500' : 'text-slate-400'}`} />
              <span className="text-xs font-semibold">Admin</span>
            </button>
          </div>
        </div>

        {/* Personal Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 block">First Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><User className="h-5 w-5 text-slate-400" /></div>
              <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm bg-slate-50 focus:bg-white" placeholder="Jane" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 block">Last Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><User className="h-5 w-5 text-slate-400" /></div>
              <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm bg-slate-50 focus:bg-white" placeholder="Doe" />
            </div>
          </div>
        </div>

        {/* Extended Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 block">Date of Birth</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Calendar className="h-5 w-5 text-slate-400" /></div>
              <input type="date" required value={dob} onChange={(e) => setDob(e.target.value)} className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm bg-slate-50 focus:bg-white" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 block">Gender</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm bg-slate-50 focus:bg-white appearance-none">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 block">Phone Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Phone className="h-5 w-5 text-slate-400" /></div>
              <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm bg-slate-50 focus:bg-white" placeholder="+1 (555) 000-0000" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 block flex justify-between">
              <span>Blood Group</span>
              <span className="text-xs text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Droplet className="h-5 w-5 text-slate-400" /></div>
              <input type="text" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm bg-slate-50 focus:bg-white" placeholder="e.g. O+" />
            </div>
          </div>
        </div>

        {/* Account Credentials */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <label className="text-sm font-semibold text-slate-700 block">Email Address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-slate-400" /></div>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm bg-slate-50 focus:bg-white" placeholder="name@example.com" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 block">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-slate-400" /></div>
            <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full pl-11 pr-12 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm bg-slate-50 focus:bg-white" placeholder="••••••••" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors">
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
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Lock className="h-5 w-5 text-slate-400" /></div>
            <input type={showConfirmPassword ? 'text' : 'password'} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`block w-full pl-11 pr-12 py-3 border ${confirmPassword && password !== confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-500'} rounded-xl focus:ring-2 transition-colors text-sm bg-slate-50 focus:bg-white`} placeholder="••••••••" />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors">
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
          disabled={isLoading}
          className={`w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-200 mt-4 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-blue-300 active:scale-[0.98]'}`}
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
          {!isLoading && <ArrowRight className="w-5 h-5" />}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-slate-600">
          Already have an account?{' '}
          <button onClick={() => navigate('/login')} className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-all">
            Sign in
          </button>
        </p>
      </div>
    </>
  );
};

export default RegisterForm;