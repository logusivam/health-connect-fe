import React from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate 
import favIcon from '../../assets/logo-v1.png';

interface TopbarProps {
  avatar?: string;
  name?: string;
  patientId?: string;
}

const Topbar: React.FC<TopbarProps> = ({ avatar, name, patientId }) => {
  const navigate = useNavigate(); // 2. Initialize navigate

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-10 transition-all duration-300">
      <div className="flex items-center gap-4 lg:hidden">
        <div className="bg-transparent rounded-lg">
          <img src={favIcon} alt="Favicon" className="w-10 h-10" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Health<span className="text-blue-600">Connect</span></h1>
      </div>
      <div className="hidden lg:block text-slate-500 font-medium">
        Patient Portal
      </div>
      
      {/* 3. Added onClick, cursor-pointer, and group classes */}
      <div 
        className="flex items-center gap-4 cursor-pointer group"
        onClick={() => navigate('/patient/profile')}
      >
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
            {name || 'Loading...'}
          </p>
          <p className="text-xs text-slate-500">
            {patientId ? `Patient ID: ${patientId}` : '...'}
          </p>
        </div>
        {avatar ? (
          <img 
            src={avatar} 
            alt="Profile" 
            className="w-10 h-10 rounded-full object-cover border-2 border-blue-200 shadow-sm transition-transform group-hover:scale-105 group-hover:border-blue-400" 
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-200 text-blue-700 font-bold transition-transform group-hover:scale-105 group-hover:border-blue-400 group-hover:bg-blue-200">
            {name ? name.charAt(0) : 'U'}
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;