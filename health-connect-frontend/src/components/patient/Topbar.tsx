import React from 'react';
import { HeartPulse } from 'lucide-react';

interface TopbarProps {
  avatar?: string;
  name?: string;
  patientId?: string;
}

const Topbar: React.FC<TopbarProps> = ({ avatar, name, patientId }) => (
  <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-10 transition-all duration-300">
    <div className="flex items-center gap-4 lg:hidden">
      <div className="bg-blue-600 p-1.5 rounded-lg">
        <HeartPulse className="w-5 h-5 text-white" strokeWidth={2.5} />
      </div>
      <h1 className="text-xl font-bold text-slate-900">Health<span className="text-blue-600">Connect</span></h1>
    </div>
    <div className="hidden lg:block text-slate-500 font-medium">
      Patient Portal
    </div>
    <div className="flex items-center gap-4">
      <div className="text-right hidden sm:block">
        <p className="text-sm font-semibold text-slate-900">{name || 'Loading...'}</p>
        <p className="text-xs text-slate-500">{patientId ? `Patient ID: ${patientId}` : '...'}</p>
      </div>
      {avatar ? (
        <img src={avatar} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-blue-200 shadow-sm transition-transform hover:scale-105" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-200 text-blue-700 font-bold transition-transform hover:scale-105">
          {name ? name.charAt(0) : 'U'}
        </div>
      )}
    </div>
  </header>
);

export default Topbar;