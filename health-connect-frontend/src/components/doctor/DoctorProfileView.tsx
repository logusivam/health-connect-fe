import React, { useState, useEffect } from 'react';
import { Camera, Clock, LogOut, Edit2, Save, X, AlertCircle } from 'lucide-react';
import { doctorApi, authApi, metadataApi } from '../../services/api';

interface DoctorProfileViewProps {
  avatar?: string;
  onAvatarChange: (url: string) => void;
  onProfileUpdate?: (name: string, specialization: string) => void; 
}

const DoctorProfileView: React.FC<DoctorProfileViewProps> = ({ avatar, onAvatarChange, onProfileUpdate }) => {
  const [profile, setProfile] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]); // Store DB Departments
  const [totalTreated, setTotalTreated] = useState<number>(0); // NEW: Real-time patient count
  const [isLoading, setIsLoading] = useState(true);

  const [editField, setEditField] = useState<'name' | 'specialization' | 'department' | 'education' | 'contactEmail' | 'contactPhone' | 'address' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editValueLast, setEditValueLast] = useState('');
  const [avatarError, setAvatarError] = useState<string>(''); 

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch profile, departments, and treatment records concurrently
      const [profileRes, deptRes, recordsRes] = await Promise.all([
        doctorApi.getProfile(),
        metadataApi.getDepartments(),
        doctorApi.getTreatmentRecords() // Fetch records to calculate unique patients
      ]);

      if (profileRes.success) {
        setProfile(profileRes.data);
        if (profileRes.data.avatar) onAvatarChange(profileRes.data.avatar);
        if (onProfileUpdate) onProfileUpdate(`${profileRes.data.firstName} ${profileRes.data.lastName}`, profileRes.data.specialization);
      }
      
      if (deptRes.success) {
        setDepartments(deptRes.data);
      }

      if (recordsRes.success) {
        // STRICT FILTER: Must have diagnosis and outcome status
        const validRecords = recordsRes.data.filter((r: any) => r.diagnosis && r.outcomeStatus);
        
        // UNIQUE PATIENTS ONLY: Map the patient IDs and put them in a Set to remove duplicates
        const uniquePatientIds = new Set(validRecords.map((r: any) => r.patient_id?._id || r.patient_id));
        
        setTotalTreated(uniquePatientIds.size);
      }
    } catch (error) {
      console.error("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(''); 
    const MAX_SIZE = 4 * 1024 * 1024; 
    if (file.size > MAX_SIZE) {
      setAvatarError('Image is too large. Must be less than 4MB.');
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
        await doctorApi.updateProfile({ avatarBase64: webpBase64 });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const startEdit = (field: string) => {
    setEditField(field as any);
    if (field === 'name') {
      setEditValue(profile.firstName);
      setEditValueLast(profile.lastName);
    } else {
      setEditValue(profile[field] || '');
    }
  };

  const handleSaveEdit = async () => {
    if (!editField) return;

    let updatePayload: any = {};
    
    if (editField === 'name') {
      updatePayload = { firstName: editValue, lastName: editValueLast };
      setProfile((prev: any) => ({ ...prev, firstName: editValue, lastName: editValueLast }));
    } else if (editField === 'department') {
      // If department changes, automatically reset the specialization
      updatePayload = { department: editValue, specialization: '' };
      setProfile((prev: any) => ({ ...prev, department: editValue, specialization: '' }));
    } else {
      updatePayload = { [editField]: editValue };
      setProfile((prev: any) => ({ ...prev, [editField]: editValue }));
    }

    const res = await doctorApi.updateProfile(updatePayload);
    if (!res.success) {
      alert("Failed to update field.");
      fetchData(); // Rollback on failure
    } else {
      if (onProfileUpdate) {
        const updatedName = editField === 'name' ? `${editValue} ${editValueLast}` : `${profile.firstName} ${profile.lastName}`;
        const updatedSpec = editField === 'specialization' ? editValue : (editField === 'department' ? '' : profile.specialization);
        onProfileUpdate(updatedName, updatedSpec);
      }
    }
    setEditField(null);
  };

  const currentDeptObj = departments.find(d => d.name === profile?.department);
  const availableSpecializations = currentDeptObj ? currentDeptObj.specializations : [];

  if (isLoading) return <div className="text-center py-20 text-slate-500">Loading profile data...</div>;
  if (!profile) return <div className="text-center py-20 text-red-500">Failed to load profile data.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Doctor Profile</h2>
        <p className="text-slate-500">Your professional details and credentials.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-teal-500 relative"></div>
        
        <div className="px-8 pb-8 flex flex-col items-center -mt-16 relative z-10">
          <div className="flex flex-col items-center">
            <div className="relative group w-32 h-32 rounded-full bg-white p-1.5 shadow-xl mb-4">
              <div className="w-full h-full rounded-full overflow-hidden relative">
                 {profile.avatar || avatar ? (
                    <img src={profile.avatar || avatar} alt="Doctor" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-4xl transition-transform duration-300 group-hover:scale-105">
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
                <button onClick={() => setEditField(null)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <>
                <h3 className="text-3xl font-bold text-slate-900">Dr. {profile.firstName} {profile.lastName}</h3>
                <button onClick={() => startEdit('name')} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-700">
                  <Edit2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          <p className="text-blue-600 font-bold tracking-widest font-mono text-sm mb-3 bg-blue-50 px-3 py-1 rounded-full">{profile._id}</p>
        </div>

        <div className="border-t border-slate-100 p-8 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Department (Select) */}
            <div className="group">
              <div className="flex items-center gap-2 mb-1">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-blue-500 transition-colors">Department</p>
                 {editField !== 'department' && (
                   <button onClick={() => startEdit('department')} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-700"><Edit2 className="w-3.5 h-3.5" /></button>
                 )}
              </div>
              {editField === 'department' ? (
                <div className="flex gap-2">
                  <select value={editValue} onChange={(e) => setEditValue(e.target.value)} className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="" disabled>Select Department</option>
                    {departments.map((dept: any) => (
                      <option key={dept._id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                  <button onClick={handleSaveEdit} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Save className="w-4 h-4" /></button>
                  <button onClick={() => setEditField(null)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <p className="font-medium text-slate-900 text-lg">{profile.department || 'Not specified'}</p>
              )}
            </div>

            {/* Specialization (Cascading Select) */}
            <div className="group">
              <div className="flex items-center gap-2 mb-1">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-blue-500 transition-colors">Specialization</p>
                 {editField !== 'specialization' && (
                   <button onClick={() => startEdit('specialization')} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-700"><Edit2 className="w-3.5 h-3.5" /></button>
                 )}
              </div>
              {editField === 'specialization' ? (
                <div className="flex gap-2">
                  {profile.department ? (
                    <select value={editValue} onChange={(e) => setEditValue(e.target.value)} className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                      <option value="" disabled>Select Specialization</option>
                      {availableSpecializations.map((spec: string) => (
                        <option key={spec} value={spec}>{spec}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex-1 px-3 py-1.5 border border-red-200 bg-red-50 rounded-lg text-sm text-red-600 flex items-center">
                      Please select a Department first
                    </div>
                  )}
                  {profile.department && <button onClick={handleSaveEdit} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Save className="w-4 h-4" /></button>}
                  <button onClick={() => setEditField(null)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <p className="font-medium text-slate-900 text-lg">{profile.specialization || 'Not specified'}</p>
              )}
            </div>

            {/* Email */}
            <div className="group">
              <div className="flex items-center gap-2 mb-1">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-teal-500 transition-colors">Contact Email</p>
                 {editField !== 'contactEmail' && (
                   <button onClick={() => startEdit('contactEmail')} className="text-teal-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-teal-700"><Edit2 className="w-3.5 h-3.5" /></button>
                 )}
              </div>
              {editField === 'contactEmail' ? (
                <div className="flex gap-2">
                  <input type="email" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
                  <button onClick={handleSaveEdit} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Save className="w-4 h-4" /></button>
                  <button onClick={() => setEditField(null)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <p className="font-medium text-slate-900 text-lg">{profile.contactEmail || 'Not specified'}</p>
              )}
            </div>

            {/* Phone */}
            <div className="group">
              <div className="flex items-center gap-2 mb-1">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-teal-500 transition-colors">Contact Phone</p>
                 {editField !== 'contactPhone' && (
                   <button onClick={() => startEdit('contactPhone')} className="text-teal-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-teal-700"><Edit2 className="w-3.5 h-3.5" /></button>
                 )}
              </div>
              {editField === 'contactPhone' ? (
                <div className="flex gap-2">
                  <input type="tel" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
                  <button onClick={handleSaveEdit} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Save className="w-4 h-4" /></button>
                  <button onClick={() => setEditField(null)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <p className="font-medium text-slate-900 text-lg">{profile.contactPhone || 'Not specified'}</p>
              )}
            </div>

            {/* Education */}
            <div className="group">
              <div className="flex items-center gap-2 mb-1">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-blue-500 transition-colors">Education & Qualifications</p>
                 {editField !== 'education' && (
                   <button onClick={() => startEdit('education')} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-700"><Edit2 className="w-3.5 h-3.5" /></button>
                 )}
              </div>
              {editField === 'education' ? (
                <div className="flex gap-2">
                  <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. MBBS, MD" />
                  <button onClick={handleSaveEdit} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Save className="w-4 h-4" /></button>
                  <button onClick={() => setEditField(null)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <p className="font-medium text-slate-900 text-lg">{profile.education || 'Not specified'}</p>
              )}
            </div>

            {/* Address */}
            <div className="group">
              <div className="flex items-center gap-2 mb-1">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-indigo-500 transition-colors">Office / Clinic Address</p>
                 {editField !== 'address' && (
                   <button onClick={() => startEdit('address')} className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-indigo-700"><Edit2 className="w-3.5 h-3.5" /></button>
                 )}
              </div>
              {editField === 'address' ? (
                <div className="flex gap-2">
                  <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                  <button onClick={handleSaveEdit} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Save className="w-4 h-4" /></button>
                  <button onClick={() => setEditField(null)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <p className="font-medium text-slate-900 text-lg">{profile.address || 'Address not added yet'}</p>
              )}
            </div>

            {/* Stats Footer */}
            <div className="md:col-span-2 bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-center justify-between mt-4">
               <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Last Login Session</p>
                  <p className="font-semibold text-slate-800 flex items-center gap-2">
                     <Clock className="w-4 h-4 text-blue-500" />
                     {profile.last_login_at ? new Date(profile.last_login_at).toLocaleString() : 'First Login'}
                  </p>
               </div>
               <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Total Patients Treated</p>
                  <p className="font-bold text-slate-800 text-xl">{totalTreated.toLocaleString()}</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Centered Logout Button */}
      <div className="flex justify-center pt-8 pb-12">
        <button 
          onClick={async () => { 
            await authApi.logout();
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