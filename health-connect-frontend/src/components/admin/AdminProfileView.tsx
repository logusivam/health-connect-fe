import React from 'react';
import { Camera, ShieldCheck, LogOut } from 'lucide-react';
import { mockAdmin } from '../../data/mockAdminData';
import PageHeader from './PageHeader';

interface AdminProfileViewProps {
  avatar?: string;
  onAvatarChange: (url: string) => void;
}

const AdminProfileView: React.FC<AdminProfileViewProps> = ({ avatar, onAvatarChange }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAvatarChange(URL.createObjectURL(file));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <PageHeader title="Admin Profile" description="Manage your system administrator credentials." />

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="h-32 bg-slate-800 relative"></div>
        
        <div className="px-8 pb-8 flex flex-col items-center -mt-16 relative z-10">
          <div className="relative group w-32 h-32 rounded-full bg-white p-1.5 shadow-xl mb-4">
            <div className="w-full h-full rounded-full overflow-hidden relative">
               {avatar ? (
                  <img src={avatar} alt="Admin" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-4xl transition-transform duration-300 group-hover:scale-105">
                    {mockAdmin.name.charAt(0)}
                  </div>
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300">
                  <Camera className="w-8 h-8" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
            </div>
          </div>
          
          <h3 className="text-3xl font-bold text-slate-900 mb-1">{mockAdmin.name}</h3>
          <p className="text-slate-600 font-bold tracking-widest font-mono text-sm mb-3 bg-slate-100 px-3 py-1 rounded-full">{mockAdmin.id}</p>
        </div>

        <div className="border-t border-slate-100 p-8 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div><p className="text-xs font-bold text-slate-400 uppercase mb-1">Department</p><p className="font-medium text-slate-900 text-lg">{mockAdmin.department}</p></div>
            <div><p className="text-xs font-bold text-slate-400 uppercase mb-1">Email Address</p><p className="font-medium text-slate-900 text-lg">{mockAdmin.email}</p></div>
            <div><p className="text-xs font-bold text-slate-400 uppercase mb-1">Phone Number</p><p className="font-medium text-slate-900 text-lg">{mockAdmin.phone}</p></div>
            <div><p className="text-xs font-bold text-slate-400 uppercase mb-1">Office Address</p><p className="font-medium text-slate-900 text-lg">{mockAdmin.address}</p></div>
            <div className="md:col-span-2 bg-slate-100 border border-slate-200 rounded-xl p-4 flex items-center gap-3">
               <ShieldCheck className="w-5 h-5 text-slate-500" />
               <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-0.5">Last Login Session</p>
                  <p className="font-semibold text-slate-800">{mockAdmin.lastLogin}</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-8 pb-12">
        <button onClick={() => alert('Logged out securely.')} className="flex items-center gap-2 px-8 py-3.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-full font-semibold transition-all active:scale-95 border border-red-100">
          <LogOut className="w-5 h-5" /> Log Out Securely
        </button>
      </div>
    </div>
  );
};

export default AdminProfileView;