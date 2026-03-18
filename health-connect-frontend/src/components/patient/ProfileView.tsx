import React from 'react';
import { LogOut, Camera } from 'lucide-react';
import { mockProfile } from '../../data/mockPatientData';

interface ProfileViewProps {
  avatar?: string;
  onAvatarChange: (url: string) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ avatar, onAvatarChange }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      onAvatarChange(imageUrl);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Patient Profile</h2>
          <p className="text-slate-500">View your personal and medical details. (Read-only)</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
        {/* Profile Header */}
        <div className="px-8 py-8 border-b border-slate-100 flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-slate-50/50">
          
          {/* Avatar Upload Container */}
          <div className="relative group">
            {avatar ? (
              <img src={avatar} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md transition-transform duration-300 group-hover:scale-105" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center border-4 border-white shadow-md text-blue-700 font-bold text-3xl transition-transform duration-300 group-hover:scale-105">
                {mockProfile.name.charAt(0)}
              </div>
            )}
            
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300 scale-95 group-hover:scale-105">
              <Camera className="w-6 h-6" />
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          <div className="text-center sm:text-left pt-2">
            <h3 className="text-2xl font-bold text-slate-900">{mockProfile.name}</h3>
            <p className="text-blue-600 font-medium">{mockProfile.id}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
              <span className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-xs rounded-full font-medium">Blood: {mockProfile.bloodGroup}</span>
              <span className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-xs rounded-full font-medium">{mockProfile.gender}</span>
              <span className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-xs rounded-full font-medium">DOB: {mockProfile.dob}</span>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            
            {/* Contact Info */}
            <div className="group">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 group-hover:text-blue-500 transition-colors">Contact Information</h4>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-slate-500 mb-0.5">Email Address</p>
                  <p className="font-medium text-slate-900">{mockProfile.email}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-0.5">Phone Number</p>
                  <p className="font-medium text-slate-900">{mockProfile.contact}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-0.5">Residential Address</p>
                  <p className="font-medium text-slate-900">{mockProfile.address}</p>
                </div>
              </div>
            </div>

            {/* Medical Info */}
            <div className="group">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 group-hover:text-teal-500 transition-colors">Medical Profile</h4>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-slate-500 mb-1.5">Known Allergies</p>
                  <div className="flex flex-wrap gap-2">
                    {mockProfile.allergies.map((allergy, idx) => (
                      <span key={idx} className="bg-red-50 text-red-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-red-100 hover:bg-red-100 transition-colors cursor-default">
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-slate-500 mb-0.5">Emergency Contact</p>
                  <p className="font-medium text-slate-900">{mockProfile.emergencyContact.name} ({mockProfile.emergencyContact.relation})</p>
                  <p className="text-slate-600">{mockProfile.emergencyContact.phone}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Logout Button placed at bottom center */}
      <div className="flex justify-center pt-4 pb-8">
        <button 
          onClick={() => { 
            localStorage.removeItem('userRole');
            window.location.href = '/login';
          }} 
          className="flex items-center gap-2 px-6 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </div>
    </div>
  );
};

export default ProfileView;