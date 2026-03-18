import React, { useState, useEffect } from 'react';
import { LogOut, Camera, Edit2, Save, X } from 'lucide-react';
import { patientApi } from '../../services/api';

interface ProfileViewProps {
  avatar?: string;
  onAvatarChange: (url: string) => void;
  onProfileLoaded?: (name: string, id: string) => void; 
}

const ProfileView: React.FC<ProfileViewProps> = ({ avatar, onAvatarChange, onProfileLoaded }) => {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit States for inline editing
  const [editField, setEditField] = useState<'address' | 'emergencyContactName' | 'emergencyContactPhone' | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await patientApi.getProfile();
      if (res.success) {
        setProfile(res.data);
        
        // Sync parent states
        if (res.data.avatar) onAvatarChange(res.data.avatar);
        if (onProfileLoaded) onProfileLoaded(`${res.data.firstName} ${res.data.lastName}`, res.data._id);
      }
    } catch (error) {
      console.error("Failed to fetch profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        // Optimistic UI update
        onAvatarChange(base64String);
        setProfile((prev: any) => ({ ...prev, avatar: base64String }));
        // Save to backend
        await patientApi.updateProfile({ avatarBase64: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEdit = async () => {
    if (!editField) return;
    
    // Optimistic update
    setProfile((prev: any) => ({ ...prev, [editField]: editValue }));
    
    // Save to backend
    await patientApi.updateProfile({ [editField]: editValue });
    setEditField(null);
  };

  const startEdit = (field: any, currentValue: string) => {
    setEditField(field);
    setEditValue(currentValue || '');
  };

  if (isLoading) return <div className="text-center py-20 text-slate-500">Loading profile data...</div>;
  if (!profile) return <div className="text-center py-20 text-red-500">Failed to load profile data.</div>;

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
            {profile.avatar || avatar ? (
              <img src={profile.avatar || avatar} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md transition-transform duration-300 group-hover:scale-105" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center border-4 border-white shadow-md text-blue-700 font-bold text-3xl transition-transform duration-300 group-hover:scale-105">
                {profile.firstName.charAt(0)}
              </div>
            )}
            
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300 scale-95 group-hover:scale-105">
              <Camera className="w-6 h-6" />
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          <div className="text-center sm:text-left pt-2">
            <h3 className="text-2xl font-bold text-slate-900">{profile.firstName} {profile.lastName}</h3>
            <p className="text-blue-600 font-medium">{profile._id}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
              <span className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-xs rounded-full font-medium">Blood: {profile.bloodGroup || 'N/A'}</span>
              <span className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-xs rounded-full font-medium">{profile.gender}</span>
              <span className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-xs rounded-full font-medium">DOB: {new Date(profile.dob).toLocaleDateString()}</span>
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
                  <p className="font-medium text-slate-900">{profile.email}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-0.5">Phone Number</p>
                  <p className="font-medium text-slate-900">{profile.phone}</p>
                </div>
                
                {/* Editable Address */}
                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <p className="text-slate-500">Residential Address</p>
                    {editField !== 'address' && (
                      <button onClick={() => startEdit('address', profile.address)} className="text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {editField === 'address' ? (
                    <div className="flex gap-2">
                      <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                      <button onClick={handleSaveEdit} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Save className="w-4 h-4" /></button>
                      <button onClick={() => setEditField(null)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <p className="font-medium text-slate-900">{profile.address || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Medical Info */}
            <div className="group">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 group-hover:text-teal-500 transition-colors">Medical Profile</h4>
              <div className="space-y-4 text-sm">
                
                {/* Editable Emergency Name */}
                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <p className="text-slate-500">Emergency Contact Name</p>
                    {editField !== 'emergencyContactName' && (
                      <button onClick={() => startEdit('emergencyContactName', profile.emergencyContactName)} className="text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {editField === 'emergencyContactName' ? (
                    <div className="flex gap-2">
                      <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                      <button onClick={handleSaveEdit} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Save className="w-4 h-4" /></button>
                      <button onClick={() => setEditField(null)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <p className="font-medium text-slate-900">{profile.emergencyContactName || 'Not provided'}</p>
                  )}
                </div>

                {/* Editable Emergency Phone */}
                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <p className="text-slate-500">Emergency Contact Number</p>
                    {editField !== 'emergencyContactPhone' && (
                      <button onClick={() => startEdit('emergencyContactPhone', profile.emergencyContactPhone)} className="text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {editField === 'emergencyContactPhone' ? (
                    <div className="flex gap-2">
                      <input type="tel" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                      <button onClick={handleSaveEdit} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Save className="w-4 h-4" /></button>
                      <button onClick={() => setEditField(null)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <p className="font-medium text-slate-900">{profile.emergencyContactPhone || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <p className="text-slate-500 mb-1.5">Known Allergies</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.knownAllergies && profile.knownAllergies.length > 0 ? (
                      profile.knownAllergies.map((allergy: string, idx: number) => (
                        <span key={idx} className="bg-red-50 text-red-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-red-100 hover:bg-red-100 transition-colors cursor-default">
                          {allergy}
                        </span>
                      ))
                    ) : (
                      <p className="text-slate-400 italic">Will update later</p>
                    )}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="flex justify-center pt-4 pb-8">
        <button 
          onClick={() => { 
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userRole');
            window.location.href = '/login';
          }} 
          className="flex items-center gap-2 px-6 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95"
        >
          <LogOut className="w-5 h-5" /> Log Out
        </button>
      </div>
    </div>
  );
};

export default ProfileView;