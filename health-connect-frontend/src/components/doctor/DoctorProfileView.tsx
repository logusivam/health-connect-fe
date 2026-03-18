import React from 'react';
import { Camera, Clock, LogOut } from 'lucide-react';
import { mockDoctor } from '../../data/mockDoctorData';

interface DoctorProfileViewProps {
  avatar?: string;
  onAvatarChange: (url: string) => void;
}

const DoctorProfileView: React.FC<DoctorProfileViewProps> = ({ avatar, onAvatarChange }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      onAvatarChange(imageUrl);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Doctor Profile</h2>
        <p className="text-slate-500">Your professional details and credentials.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Top Graphic Area */}
        <div className="h-32 bg-gradient-to-r from-blue-600 to-teal-500 relative"></div>
        
        {/* Profile Header */}
        <div className="px-8 pb-8 flex flex-col items-center -mt-16 relative z-10">
          
          {/* Avatar Upload Container */}
          <div className="relative group w-32 h-32 rounded-full bg-white p-1.5 shadow-xl mb-4">
            <div className="w-full h-full rounded-full overflow-hidden relative">
               {avatar ? (
                  <img src={avatar} alt="Doctor" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-4xl transition-transform duration-300 group-hover:scale-105">
                    {mockDoctor.name.replace('Dr. ', '').charAt(0)}
                  </div>
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300">
                  <Camera className="w-8 h-8" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
            </div>
          </div>
          
          <h3 className="text-3xl font-bold text-slate-900 mb-1">{mockDoctor.name}</h3>
          <p className="text-blue-600 font-bold tracking-widest font-mono text-sm mb-3 bg-blue-50 px-3 py-1 rounded-full">{mockDoctor.id}</p>
          
        </div>

        {/* Details Grid */}
        <div className="border-t border-slate-100 p-8 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <div className="group">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-blue-500 transition-colors">Specialization</p>
               <p className="font-medium text-slate-900 text-lg">{mockDoctor.specialization}</p>
            </div>
            
            <div className="group">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-blue-500 transition-colors">Department</p>
               <p className="font-medium text-slate-900 text-lg">{mockDoctor.department}</p>
            </div>

            <div className="group">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-teal-500 transition-colors">Email Address</p>
               <p className="font-medium text-slate-900 text-lg">{mockDoctor.email}</p>
            </div>

            <div className="group">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-teal-500 transition-colors">Phone Number</p>
               <p className="font-medium text-slate-900 text-lg">{mockDoctor.phone}</p>
            </div>

            <div className="md:col-span-2 group">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-indigo-500 transition-colors">Office / Clinic Address</p>
               <p className="font-medium text-slate-900 text-lg">{mockDoctor.address}</p>
            </div>

            <div className="md:col-span-2 bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-center justify-between mt-4">
               <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Last Login Session</p>
                  <p className="font-semibold text-slate-800 flex items-center gap-2">
                     <Clock className="w-4 h-4 text-blue-500" />
                     {mockDoctor.lastLogin}
                  </p>
               </div>
               <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Total Patients Treated</p>
                  <p className="font-bold text-slate-800 text-xl">{mockDoctor.totalPatientsTreated.toLocaleString()}</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Centered Logout Button */}
      <div className="flex justify-center pt-8 pb-12">
        <button 
          onClick={() => { 
            localStorage.removeItem('userRole');
            window.location.href = '/login';
          }} 
          className="flex items-center gap-2 px-8 py-3.5 text-white bg-slate-900 hover:bg-slate-800 rounded-full font-semibold transition-all hover:shadow-lg active:scale-95"
        >
          <LogOut className="w-5 h-5" />
          Log Out Securely
        </button>
      </div>
    </div>
  );
};

export default DoctorProfileView;