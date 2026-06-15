import React, { useState, useEffect } from 'react';
import { LogOut, Camera, Edit2, Save, X, AlertCircle } from 'lucide-react';
import { patientApi } from '../../services/api';
import { authApi } from '../../services/api';

interface ProfileViewProps {
  avatar?: string;
  onAvatarChange: (url: string) => void;
  onProfileLoaded?: (name: string, id: string) => void; 
}

const COUNTRY_CODES = [
  { code: '+91', country: 'IN', lengths: [10] },
  { code: '+1', country: 'US/CA', lengths: [10] },
  { code: '+44', country: 'UK', lengths: [10, 11] },
  { code: '+61', country: 'AU', lengths: [9] },
  { code: '+971', country: 'UAE', lengths: [9] },
];

const ProfileView: React.FC<ProfileViewProps> = ({ avatar, onAvatarChange, onProfileLoaded }) => {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit States for inline editing
  const [editField, setEditField] = useState<'address' | 'emergencyContactName' | 'emergencyContactPhone' | 'email' | 'phone' | 'name' | 'knownAllergies' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editValueLast, setEditValueLast] = useState(''); 
  const [editCountryCode, setEditCountryCode] = useState('+91');
  const [editError, setEditError] = useState<string>('');
  
  // Specific array state for editing allergies
  const [editAllergies, setEditAllergies] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState('');
  
  const [avatarError, setAvatarError] = useState<string>(''); 

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await patientApi.getProfile();
      if (res.success) {
        setProfile(res.data);
        
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
        
        await patientApi.updateProfile({ avatarBase64: webpBase64 });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const startEdit = (field: any) => {
    setEditField(field);
    setEditError('');
    
    if (field === 'name') {
      setEditValue(profile.firstName);
      setEditValueLast(profile.lastName);
    } else if (field === 'phone' || field === 'emergencyContactPhone') {
      const rawPhone = profile[field] || '';
      let foundCode = '+91';
      let num = rawPhone;
      
      for (const cc of COUNTRY_CODES) {
        if (rawPhone.startsWith(cc.code)) {
          foundCode = cc.code;
          num = rawPhone.substring(cc.code.length).trim();
          break;
        }
      }
      setEditCountryCode(foundCode);
      setEditValue(num.replace(/\D/g, '')); // Strip non-digits
    } else if (field === 'knownAllergies') {
      setEditAllergies([...(profile.knownAllergies || [])]);
      setNewAllergy('');
    } else {
      setEditValue(profile[field] || '');
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ''); // Enforce numbers only
    const ccDef = COUNTRY_CODES.find(c => c.code === editCountryCode);
    const maxLen = ccDef ? Math.max(...ccDef.lengths) : 15;
    
    if (val.length <= maxLen) {
      setEditValue(val);
      setEditError('');
    }
  };

  const handleAddAllergy = () => {
    if (newAllergy.trim() && !editAllergies.includes(newAllergy.trim())) {
      setEditAllergies([...editAllergies, newAllergy.trim()]);
      setNewAllergy('');
    }
  };

  const handleRemoveAllergy = (idx: number) => {
    setEditAllergies(editAllergies.filter((_, i) => i !== idx));
  };

  const handleSaveEdit = async () => {
    if (!editField) return;

    // Strict Validations
    if (editField === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editValue)) {
        setEditError('Please enter a valid email address.');
        return;
      }
    }

    if (editField === 'phone' || editField === 'emergencyContactPhone') {
      const ccDef = COUNTRY_CODES.find(c => c.code === editCountryCode);
      if (ccDef && !ccDef.lengths.includes(editValue.length)) {
        setEditError(`Number must be exactly ${ccDef.lengths.join(' or ')} digits for ${editCountryCode}.`);
        return;
      }
    }

    if (editField === 'address' && editValue.length > 200) {
      setEditError('Address cannot exceed 200 characters.');
      return;
    }

    if (editField === 'emergencyContactName' && editValue.length > 50) {
      setEditError('Name cannot exceed 50 characters.');
      return;
    }

    if (editField === 'name') {
      if (!editValue.trim() || !editValueLast.trim()) {
        setEditError('Both First and Last Name are required.');
        return;
      }
      const originalFirst = profile.firstName;
      const originalLast = profile.lastName;

      setProfile((prev: any) => ({ ...prev, firstName: editValue, lastName: editValueLast }));
      const res = await patientApi.updateProfile({ firstName: editValue, lastName: editValueLast });
      
      if (!res.success) {
        alert(res.message || "Failed to update name.");
        setProfile((prev: any) => ({ ...prev, firstName: originalFirst, lastName: originalLast }));
      } else {
        if (onProfileLoaded) onProfileLoaded(`${editValue} ${editValueLast}`, profile._id);
      }
    } else {
      const originalValue = profile[editField];
      let finalPayloadValue: any = editValue;
      
      if (editField === 'phone' || editField === 'emergencyContactPhone') {
        finalPayloadValue = `${editCountryCode} ${editValue}`;
      } else if (editField === 'knownAllergies') {
        finalPayloadValue = editAllergies;
      }

      setProfile((prev: any) => ({ ...prev, [editField]: finalPayloadValue }));
      const res = await patientApi.updateProfile({ [editField]: finalPayloadValue });
      
      if (!res.success) {
        alert(res.message || "Failed to update field.");
        setProfile((prev: any) => ({ ...prev, [editField]: originalValue }));
      }
    }
    
    setEditField(null);
    setEditError('');
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
          <div className="flex flex-col items-center">
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
            
            {avatarError && (
              <p className="text-red-500 text-xs font-semibold mt-3 flex items-center gap-1 max-w-[120px] text-center leading-tight">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {avatarError}
              </p>
            )}
          </div>

          <div className="text-center sm:text-left pt-2">
            {/* Editable Name Section */}
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-1 group">
              {editField === 'name' ? (
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex items-center gap-2">
                    <input type="text" maxLength={50} value={editValue} onChange={(e) => { setEditValue(e.target.value); setEditError(''); }} className="px-3 py-1 border rounded-lg text-lg font-bold w-32 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="First Name" />
                    <input type="text" maxLength={50} value={editValueLast} onChange={(e) => { setEditValueLast(e.target.value); setEditError(''); }} className="px-3 py-1 border rounded-lg text-lg font-bold w-32 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Last Name" />
                    <button onClick={handleSaveEdit} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Save className="w-4 h-4" /></button>
                    <button onClick={() => { setEditField(null); setEditError(''); }} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X className="w-4 h-4" /></button>
                  </div>
                  {editError && <p className="text-red-500 text-xs font-semibold">{editError}</p>}
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-slate-900">{profile.firstName} {profile.lastName}</h3>
                  <button onClick={() => startEdit('name')} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-700">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

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
                
                {/* Editable Email */}
                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <p className="text-slate-500">Email Address</p>
                    {editField !== 'email' && (
                      <button onClick={() => startEdit('email')} className="text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {editField === 'email' ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex gap-2">
                        <input type="email" value={editValue} onChange={(e) => { setEditValue(e.target.value); setEditError(''); }} className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        <button onClick={handleSaveEdit} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Save className="w-4 h-4" /></button>
                        <button onClick={() => { setEditField(null); setEditError(''); }} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X className="w-4 h-4" /></button>
                      </div>
                      {editError && <p className="text-red-500 text-xs font-semibold">{editError}</p>}
                    </div>
                  ) : (
                    <p className="font-medium text-slate-900">{profile.email}</p>
                  )}
                </div>

                {/* Editable Phone */}
                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <p className="text-slate-500">Phone Number</p>
                    {editField !== 'phone' && (
                      <button onClick={() => startEdit('phone')} className="text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {editField === 'phone' ? (
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex gap-2">
                        <select
                          value={editCountryCode}
                          onChange={(e) => {
                            setEditCountryCode(e.target.value);
                            setEditValue(''); 
                            setEditError('');
                          }}
                          className="w-24 px-2 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 cursor-pointer"
                        >
                          {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.country})</option>)}
                        </select>
                        <input 
                          type="tel" 
                          value={editValue} 
                          onChange={handlePhoneChange} 
                          className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                          placeholder="Numbers only"
                        />
                        <button onClick={handleSaveEdit} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Save className="w-4 h-4" /></button>
                        <button onClick={() => { setEditField(null); setEditError(''); }} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X className="w-4 h-4" /></button>
                      </div>
                      {editError && <p className="text-red-500 text-xs font-semibold">{editError}</p>}
                    </div>
                  ) : (
                    <p className="font-medium text-slate-900">{profile.phone}</p>
                  )}
                </div>
                
                {/* Editable Address */}
                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <p className="text-slate-500">Residential Address</p>
                    {editField !== 'address' && (
                      <button onClick={() => startEdit('address')} className="text-blue-500 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {editField === 'address' ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex gap-2">
                        <input type="text" maxLength={200} value={editValue} onChange={(e) => { setEditValue(e.target.value); setEditError(''); }} className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                        <button onClick={handleSaveEdit} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Save className="w-4 h-4" /></button>
                        <button onClick={() => { setEditField(null); setEditError(''); }} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X className="w-4 h-4" /></button>
                      </div>
                      {editError && <p className="text-red-500 text-xs font-semibold">{editError}</p>}
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
                      <button onClick={() => startEdit('emergencyContactName')} className="text-teal-500 hover:text-teal-700 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {editField === 'emergencyContactName' ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex gap-2">
                        <input type="text" maxLength={50} value={editValue} onChange={(e) => { setEditValue(e.target.value); setEditError(''); }} className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" />
                        <button onClick={handleSaveEdit} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Save className="w-4 h-4" /></button>
                        <button onClick={() => { setEditField(null); setEditError(''); }} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X className="w-4 h-4" /></button>
                      </div>
                      {editError && <p className="text-red-500 text-xs font-semibold">{editError}</p>}
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
                      <button onClick={() => startEdit('emergencyContactPhone')} className="text-teal-500 hover:text-teal-700 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {editField === 'emergencyContactPhone' ? (
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex gap-2">
                        <select
                          value={editCountryCode}
                          onChange={(e) => {
                            setEditCountryCode(e.target.value);
                            setEditValue(''); 
                            setEditError('');
                          }}
                          className="w-24 px-2 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-slate-50 cursor-pointer"
                        >
                          {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.country})</option>)}
                        </select>
                        <input 
                          type="tel" 
                          value={editValue} 
                          onChange={handlePhoneChange} 
                          className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" 
                          placeholder="Numbers only"
                        />
                        <button onClick={handleSaveEdit} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Save className="w-4 h-4" /></button>
                        <button onClick={() => { setEditField(null); setEditError(''); }} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X className="w-4 h-4" /></button>
                      </div>
                      {editError && <p className="text-red-500 text-xs font-semibold">{editError}</p>}
                    </div>
                  ) : (
                    <p className="font-medium text-slate-900">{profile.emergencyContactPhone || 'Not provided'}</p>
                  )}
                </div>

                {/* Editable Known Allergies */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-slate-500">Known Allergies</p>
                    {editField !== 'knownAllergies' && (
                      <button onClick={() => startEdit('knownAllergies')} className="text-teal-500 hover:text-teal-700 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {editField === 'knownAllergies' ? (
                    <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={newAllergy}
                          onChange={(e) => setNewAllergy(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddAllergy(); } }}
                          placeholder="Type allergy and press Add"
                          className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                        <button onClick={handleAddAllergy} className="px-3 py-1.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-100 text-sm font-semibold transition-colors shadow-sm">Add</button>
                      </div>
                      <div className="flex flex-wrap gap-2 min-h-[28px]">
                        {editAllergies.length > 0 ? editAllergies.map((allergy, idx) => (
                          <span key={idx} className="bg-red-50 text-red-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-red-100 flex items-center gap-1.5 shadow-sm">
                            {allergy}
                            <button onClick={() => handleRemoveAllergy(idx)} className="text-red-400 hover:text-red-800 hover:bg-red-100 rounded-full p-0.5 transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        )) : (
                          <span className="text-xs text-slate-400 italic flex items-center">No allergies added yet.</span>
                        )}
                      </div>
                      <div className="flex gap-2 justify-end pt-2 border-t border-slate-200">
                        <button onClick={() => { setEditField(null); setEditError(''); }} className="px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                        <button onClick={handleSaveEdit} className="px-4 py-1.5 text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 rounded-lg shadow-sm transition-colors flex items-center gap-1">
                          <Save className="w-4 h-4" /> Save Allergies
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile.knownAllergies && profile.knownAllergies.length > 0 ? (
                        profile.knownAllergies.map((allergy: string, idx: number) => (
                          <span key={idx} className="bg-red-50 text-red-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-red-100 cursor-default shadow-sm">
                            {allergy}
                          </span>
                        ))
                      ) : (
                        <p className="text-slate-400 italic">Will update later</p>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="flex justify-center pt-4 pb-8">
        <button 
          onClick={async () => { 
            await authApi.logout(); 
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