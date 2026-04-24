import React, { useState, useEffect } from 'react';
import { Camera, ShieldCheck, LogOut, Edit2, Save, X, AlertCircle } from 'lucide-react';
import { adminApi, authApi } from '../../services/api';
import PageHeader from './PageHeader';

interface AdminProfileViewProps {
  avatar?: string;
  onAvatarChange: (url: string) => void;
}

const AdminProfileView: React.FC<AdminProfileViewProps> = ({ avatar, onAvatarChange }) => {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit States
  const [editField, setEditField] = useState<'name' | 'department' | 'contactEmail' | 'contactPhone' | 'address' | 'education' | 'registrationNumber' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editValueLast, setEditValueLast] = useState(''); // For Last Name
  const [validationError, setValidationError] = useState<string>('');
  const [avatarError, setAvatarError] = useState<string>(''); 

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await adminApi.getProfile();
      if (res.success) {
        setProfile(res.data);
        if (res.data.avatar) onAvatarChange(res.data.avatar);
      }
    } catch (error) {
      console.error("Failed to fetch admin profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(''); 
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB Limit
    if (file.size > MAX_SIZE) {
      setAvatarError('Image is too large. Must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.drawImage(img, 0, 0, img.width, img.height);
        const webpBase64 = canvas.toDataURL('image/webp', 0.8);

        onAvatarChange(webpBase64);
        setProfile((prev: any) => ({ ...prev, avatar: webpBase64 }));
        
        await adminApi.updateProfile({ avatarBase64: webpBase64 });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const startEdit = (field: string) => {
    setEditField(field as any);
    setValidationError('');
    if (field === 'name') {
      setEditValue(profile.firstName);
      setEditValueLast(profile.lastName);
    } else {
      setEditValue(profile[field] || '');
    }
  };

  const handleSaveEdit = async () => {
    if (!editField) return;

    if (editField === 'contactEmail') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editValue)) {
        setValidationError('Please enter a valid email address.');
        return;
      }
    }
    if (editField === 'address' && editValue.trim().length > 200) {
      setValidationError('Address cannot exceed 200 characters.');
      return;
    }

    let updatePayload: any = {};
    
    if (editField === 'name') {
      updatePayload = { firstName: editValue, lastName: editValueLast };
      setProfile((prev: any) => ({ ...prev, firstName: editValue, lastName: editValueLast }));
    } else {
      updatePayload = { [editField]: editValue };
      setProfile((prev: any) => ({ ...prev, [editField]: editValue }));
    }

    const res = await adminApi.updateProfile(updatePayload);
    if (!res.success) {
      alert("Failed to update field.");
      fetchProfile(); 
    }
    
    setEditField(null);
    setValidationError('');
  };

  const cancelEdit = () => {
    setEditField(null);
    setValidationError('');
  };

  if (isLoading) return <div className="text-center py-20 text-slate-500">Loading admin profile...</div>;
  if (!profile) return <div className="text-center py-20 text-red-500">Failed to load profile data.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <PageHeader title="Admin Profile" description="Manage your system administrator credentials." />

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="h-32 bg-slate-800 relative"></div>
        
        <div className="px-8 pb-8 flex flex-col items-center -mt-16 relative z-10">
          <div className="flex flex-col items-center">
            <div className="relative group w-32 h-32 rounded-full bg-white p-1.5 shadow-xl mb-4">
              <div className="w-full h-full rounded-full overflow-hidden relative">
                 {profile.avatar || avatar ? (
                    <img src={profile.avatar || avatar} alt="Admin" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-4xl transition-transform duration-300 group-hover:scale-105">
                      {profile.firstName.charAt(0)}
                    </div>
                  )}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300">
                    <Camera className="w-8 h-8" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
              </div>
            </div>
            {avatarError && (
              <p className="text-red-500 text-xs font-semibold mb-4 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {avatarError}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-3 mb-1 group">
            {editField === 'name' ? (
              <div className="flex items-center gap-2">
                <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="px-3 py-1 border rounded-lg text-lg font-bold w-32 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="First Name" />
                <input type="text" value={editValueLast} onChange={(e) => setEditValueLast(e.target.value)} className="px-3 py-1 border rounded-lg text-lg font-bold w-32 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Last Name" />
                <button onClick={handleSaveEdit} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Save className="w-4 h-4" /></button>
                <button onClick={cancelEdit} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <>
                <h3 className="text-3xl font-bold text-slate-900">{profile.firstName} {profile.lastName}</h3>
                <button onClick={() => startEdit('name')} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-700">
                  <Edit2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-3 mb-2">
            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs rounded-full font-medium">Blood: {profile.bloodGroup || 'N/A'}</span>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs rounded-full font-medium">{profile.gender || 'N/A'}</span>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs rounded-full font-medium">DOB: {profile.dob ? new Date(profile.dob).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>

        <div className="border-t border-slate-100 p-8 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Department */}
            <div className="group">
              <div className="flex items-center gap-2 mb-1">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-blue-500 transition-colors">Department</p>
                 {editField !== 'department' && (
                   <button onClick={() => startEdit('department')} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-700"><Edit2 className="w-3.5 h-3.5" /></button>
                 )}
              </div>
              {editField === 'department' ? (
                <div className="flex gap-2">
                  <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" placeholder="e.g. IT Department" />
                  <button onClick={handleSaveEdit} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Save className="w-4 h-4" /></button>
                  <button onClick={cancelEdit} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <p className="font-medium text-slate-900 text-lg">{profile.department || 'Not specified'}</p>
              )}
            </div>

            {/* Email Address */}
            <div className="group">
              <div className="flex items-center gap-2 mb-1">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-blue-500 transition-colors">Email Address</p>
                 {editField !== 'contactEmail' && (
                   <button onClick={() => startEdit('contactEmail')} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-700"><Edit2 className="w-3.5 h-3.5" /></button>
                 )}
              </div>
              {editField === 'contactEmail' ? (
                <div>
                  <div className="flex gap-2">
                    <input type="email" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
                    <button onClick={handleSaveEdit} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Save className="w-4 h-4" /></button>
                    <button onClick={cancelEdit} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X className="w-4 h-4" /></button>
                  </div>
                  {validationError && <p className="text-red-500 text-xs mt-1">{validationError}</p>}
                </div>
              ) : (
                <p className="font-medium text-slate-900 text-lg">{profile.contactEmail || 'Not specified'}</p>
              )}
            </div>

            {/* Phone Number */}
            <div className="group">
              <div className="flex items-center gap-2 mb-1">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-blue-500 transition-colors">Phone Number</p>
                 {editField !== 'contactPhone' && (
                   <button onClick={() => startEdit('contactPhone')} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-700"><Edit2 className="w-3.5 h-3.5" /></button>
                 )}
              </div>
              {editField === 'contactPhone' ? (
                <div className="flex gap-2">
                  <input type="tel" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
                  <button onClick={handleSaveEdit} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Save className="w-4 h-4" /></button>
                  <button onClick={cancelEdit} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <p className="font-medium text-slate-900 text-lg">{profile.contactPhone || 'Not specified'}</p>
              )}
            </div>

            {/* Registration Number */}
            <div className="group">
              <div className="flex items-center gap-2 mb-1">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-blue-500 transition-colors">Registration Number</p>
                 {editField !== 'registrationNumber' && (
                   <button onClick={() => startEdit('registrationNumber')} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-700"><Edit2 className="w-3.5 h-3.5" /></button>
                 )}
              </div>
              {editField === 'registrationNumber' ? (
                <div className="flex gap-2">
                  <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
                  <button onClick={handleSaveEdit} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Save className="w-4 h-4" /></button>
                  <button onClick={cancelEdit} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <p className="font-medium text-slate-900 text-lg">{profile.registrationNumber || 'Not specified'}</p>
              )}
            </div>

            {/* Office Address */}
            <div className="group">
              <div className="flex items-center gap-2 mb-1">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-blue-500 transition-colors">Office Address</p>
                 {editField !== 'address' && (
                   <button onClick={() => startEdit('address')} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-700"><Edit2 className="w-3.5 h-3.5" /></button>
                 )}
              </div>
              {editField === 'address' ? (
                <div>
                  <div className="flex gap-2">
                    <input type="text" maxLength={200} value={editValue} onChange={(e) => { setEditValue(e.target.value); setValidationError(''); }} className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
                    <button onClick={handleSaveEdit} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Save className="w-4 h-4" /></button>
                    <button onClick={cancelEdit} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X className="w-4 h-4" /></button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 text-right">{editValue.length}/200</p>
                  {validationError && <p className="text-red-500 text-xs mt-1">{validationError}</p>}
                </div>
              ) : (
                <p className="font-medium text-slate-900 text-lg">{profile.address || 'Address not added yet'}</p>
              )}
            </div>

            {/* Education */}
            <div className="group">
              <div className="flex items-center gap-2 mb-1">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-blue-500 transition-colors">Education</p>
                 {editField !== 'education' && (
                   <button onClick={() => startEdit('education')} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-700"><Edit2 className="w-3.5 h-3.5" /></button>
                 )}
              </div>
              {editField === 'education' ? (
                <div className="flex gap-2">
                  <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
                  <button onClick={handleSaveEdit} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Save className="w-4 h-4" /></button>
                  <button onClick={cancelEdit} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <p className="font-medium text-slate-900 text-lg">{profile.education || 'Not specified'}</p>
              )}
            </div>

            {/* Last Login Session */}
            <div className="md:col-span-2 bg-slate-100 border border-slate-200 rounded-xl p-4 flex items-center gap-3 mt-4">
               <ShieldCheck className="w-5 h-5 text-slate-500" />
               <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-0.5">Last Login Session</p>
                  <p className="font-semibold text-slate-800">
                    {profile.last_login_at ? new Date(profile.last_login_at).toLocaleString() : 'First time login'}
                  </p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-8 pb-12">
        <button 
          onClick={async () => { 
            await authApi.logout(); 
            window.location.href = '/login'; 
          }} 
          className="flex items-center gap-2 px-8 py-3.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-full font-semibold transition-all active:scale-95 border border-red-100"
        >
          <LogOut className="w-5 h-5" /> Log Out Securely
        </button>
      </div>
    </div>
  );
};

export default AdminProfileView;