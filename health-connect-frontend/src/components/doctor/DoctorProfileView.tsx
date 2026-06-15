import React, { useState, useEffect } from 'react';
import { Camera, Clock, LogOut, Edit2, Save, X, AlertCircle, CalendarCheck, ChevronLeft, ChevronRight, Edit3, Trash2 } from 'lucide-react';
import { doctorApi, authApi, metadataApi } from '../../services/api';

interface DoctorProfileViewProps {
  avatar?: string;
  onAvatarChange: (url: string) => void;
  onProfileUpdate?: (name: string, specialization: string) => void; 
}

const COUNTRY_CODES = [
  { code: '+91', label: 'IN (+91)', minLength: 10, maxLength: 10 },
  { code: '+1', label: 'US/CA (+1)', minLength: 10, maxLength: 10 },
  { code: '+44', label: 'UK (+44)', minLength: 10, maxLength: 11 },
  { code: '+61', label: 'AU (+61)', minLength: 9, maxLength: 9 },
];

const ITEMS_PER_PAGE = 5;

const DoctorProfileView: React.FC<DoctorProfileViewProps> = ({ avatar, onAvatarChange, onProfileUpdate }) => {
  const [profile, setProfile] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]); 
  const [totalTreated, setTotalTreated] = useState<number>(0); 
  const [isLoading, setIsLoading] = useState(true);

  const [editField, setEditField] = useState<'name' | 'specialization' | 'department' | 'education' | 'contactEmail' | 'contactPhone' | 'address' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editValueLast, setEditValueLast] = useState('');
  const [editCountryCode, setEditCountryCode] = useState('+91'); 
  const [validationError, setValidationError] = useState<string>(''); 
  const [avatarError, setAvatarError] = useState<string>(''); 

  // LEAVE/PERMISSION STATES
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [editingLeaveId, setEditingLeaveId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null); // NEW: Custom delete modal state
  const [leaveData, setLeaveData] = useState({ fromDate: '', toDate: '', fromTime: '09:00', toTime: '17:00' });
  const [leaveError, setLeaveError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, deptRes, recordsRes] = await Promise.all([
        doctorApi.getProfile(),
        metadataApi.getDepartments(),
        doctorApi.getTreatmentRecords() 
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
        const validRecords = recordsRes.data.filter((r: any) => r.diagnosis && r.outcomeStatus);
        const uniquePatientIds = new Set(validRecords.map((r: any) => r.patient_id?._id || r.patient_id));
        setTotalTreated(uniquePatientIds.size);
      }
    } catch (error) {
      console.error("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
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
    setValidationError('');
    if (field === 'name') {
      setEditValue(profile.firstName);
      setEditValueLast(profile.lastName);
    } else if (field === 'contactPhone') {
      const existingPhone = profile.contactPhone || '';
      const foundCode = COUNTRY_CODES.find(c => existingPhone.startsWith(c.code));
      if (foundCode) {
        setEditCountryCode(foundCode.code);
        setEditValue(existingPhone.slice(foundCode.code.length).trim());
      } else {
        setEditCountryCode('+91');
        setEditValue(existingPhone.replace(/\D/g, ''));
      }
    } else {
      setEditValue(profile[field] || '');
    }
  };

  const cancelEdit = () => {
    setEditField(null);
    setValidationError('');
  };

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numbersOnly = e.target.value.replace(/\D/g, '');
    const rule = COUNTRY_CODES.find(c => c.code === editCountryCode);
    if (rule && numbersOnly.length > rule.maxLength) {
      setEditValue(numbersOnly.slice(0, rule.maxLength));
    } else {
      setEditValue(numbersOnly);
    }
    setValidationError('');
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
    if (editField === 'contactPhone') {
      const rule = COUNTRY_CODES.find(c => c.code === editCountryCode);
      if (rule && (editValue.length < rule.minLength || editValue.length > rule.maxLength)) {
        setValidationError(`Phone number must be ${rule.minLength === rule.maxLength ? rule.maxLength : `${rule.minLength}-${rule.maxLength}`} digits.`);
        return;
      }
    }
    if (editField === 'address' && editValue.trim().length > 200) {
      setValidationError('Address cannot exceed 200 characters.');
      return;
    }
    if (editField === 'education' && editValue.trim().length > 150) {
      setValidationError('Education details cannot exceed 150 characters.');
      return;
    }

    let updatePayload: any = {};
    let finalValue = editValue;

    if (editField === 'contactPhone') finalValue = `${editCountryCode} ${editValue}`;
    
    if (editField === 'name') {
      updatePayload = { firstName: editValue, lastName: editValueLast };
      setProfile((prev: any) => ({ ...prev, firstName: editValue, lastName: editValueLast }));
    } else if (editField === 'department') {
      updatePayload = { department: editValue, specialization: '' };
      setProfile((prev: any) => ({ ...prev, department: editValue, specialization: '' }));
    } else {
      updatePayload = { [editField]: finalValue };
      setProfile((prev: any) => ({ ...prev, [editField]: finalValue }));
    }

    const res = await doctorApi.updateProfile(updatePayload);
    if (!res.success) {
      alert("Failed to update field.");
      fetchData(); 
    } else {
      if (onProfileUpdate) {
        const updatedName = editField === 'name' ? `${editValue} ${editValueLast}` : `${profile.firstName} ${profile.lastName}`;
        const updatedSpec = editField === 'specialization' ? editValue : (editField === 'department' ? '' : profile.specialization);
        onProfileUpdate(updatedName, updatedSpec);
      }
    }
    setEditField(null);
    setValidationError('');
  };

  // --- ABSENCE MANAGEMENT LOGIC ---

  const getCalculatedHours = () => {
    if (!leaveData.fromDate || !leaveData.toDate || !leaveData.fromTime || !leaveData.toTime) return 0;
    const f = new Date(`${leaveData.fromDate}T${leaveData.fromTime}`);
    const t = new Date(`${leaveData.toDate}T${leaveData.toTime}`);
    const diff = (t.getTime() - f.getTime()) / (1000 * 60 * 60);
    return diff > 0 ? Number(diff.toFixed(1)) : 0;
  };

  const pad = (n: number) => n.toString().padStart(2, '0');

  const checkOverlap = (nextData: typeof leaveData) => {
    if (!nextData.fromDate || !nextData.toDate) return false;
    const newStart = new Date(`${nextData.fromDate}T${nextData.fromTime || '00:00'}`).getTime();
    const newEnd = new Date(`${nextData.toDate}T${nextData.toTime || '23:59'}`).getTime();

    return profile.leave_requests.some((req: any) => {
      if (editingLeaveId && req._id === editingLeaveId) return false;
      const existingStart = new Date(req.fromDate).getTime();
      const existingEnd = new Date(req.toDate).getTime();
      // Overlap occurs if New Start is before Existing End AND New End is after Existing Start
      return (newStart < existingEnd) && (newEnd > existingStart);
    });
  };

  const handleLeaveDataChange = (field: keyof typeof leaveData, val: string) => {
    const nextData = { ...leaveData, [field]: val };
    
    // Validate overlap instantly to mimic disabled dates
    if (checkOverlap(nextData)) {
      showToast('The selected date/time overlaps with an existing absence request.');
      return; 
    }

    setLeaveData(nextData);
    setLeaveError('');
  };

  const isFutureRecord = (req: any) => {
    const now = new Date();
    const reqFrom = new Date(req.fromDate);
    
    if (req.type === 'LEAVE') {
      const today = new Date();
      today.setHours(0,0,0,0);
      const reqDate = new Date(reqFrom);
      reqDate.setHours(0,0,0,0);
      return reqDate > today; // Strictly future date
    } else {
      return reqFrom > now; // Strictly future time for Permission
    }
  };

  const openEditModal = (req: any) => {
    if (req.editCount >= 2) {
      showToast('Edit Limit Exceeded: This request has already been modified the maximum of 2 times.');
      return;
    }

    const fDate = new Date(req.fromDate);
    const tDate = new Date(req.toDate);

    setEditingLeaveId(req._id);
    setLeaveData({
      fromDate: `${fDate.getFullYear()}-${pad(fDate.getMonth()+1)}-${pad(fDate.getDate())}`,
      toDate: `${tDate.getFullYear()}-${pad(tDate.getMonth()+1)}-${pad(tDate.getDate())}`,
      fromTime: `${pad(fDate.getHours())}:${pad(fDate.getMinutes())}`,
      toTime: `${pad(tDate.getHours())}:${pad(tDate.getMinutes())}`
    });
    setLeaveError('');
    setIsLeaveModalOpen(true);
  };

  // Triggered when user confirms delete in custom modal
  const executeDeleteLeave = async (id: string) => {
    const res = await doctorApi.updateProfile({ deleteLeaveRequestId: id });
    if (res.success) {
      setProfile(res.data);
      showToast('Absence record deleted securely.');
    } else {
      showToast('Failed to delete absence record.');
    }
    setDeleteConfirmId(null);
  };

  const handleLeaveSubmit = async () => {
    setLeaveError('');
    if (!leaveData.fromDate || !leaveData.toDate) {
      setLeaveError('Both dates are required.');
      return;
    }

    const f = new Date(`${leaveData.fromDate}T${leaveData.fromTime}`);
    const t = new Date(`${leaveData.toDate}T${leaveData.toTime}`);

    if (f > t) {
      setLeaveError('To Date/Time cannot be before From Date/Time.');
      return;
    }

    const hrs = getCalculatedHours();
    if (hrs === 0) {
      setLeaveError('Duration must be greater than 0 hours.');
      return;
    }

    const calculatedType = (hrs <= 2) ? 'PERMISSION' : 'LEAVE';

    let payload = {};
    if (editingLeaveId) {
      payload = {
        updateLeaveRequest: { _id: editingLeaveId, fromDate: f.toISOString(), toDate: t.toISOString(), hours: hrs, type: calculatedType }
      };
    } else {
      payload = {
        newLeaveRequest: { fromDate: f.toISOString(), toDate: t.toISOString(), hours: hrs, type: calculatedType }
      };
    }

    const res = await doctorApi.updateProfile(payload);
    if (res.success) {
      setProfile(res.data);
      setIsLeaveModalOpen(false);
      setEditingLeaveId(null);
      setLeaveData({ fromDate: '', toDate: '', fromTime: '09:00', toTime: '17:00' });
      showToast(editingLeaveId ? 'Absence updated successfully.' : 'Absence recorded successfully.');
    } else {
      setLeaveError('Failed to submit request.');
    }
  };

  const currentDeptObj = departments.find(d => d.name === profile?.department);
  const availableSpecializations = currentDeptObj ? currentDeptObj.specializations : [];

  // Pagination derived data
  const leaveRequests = profile?.leave_requests ? [...profile.leave_requests].reverse() : [];
  const totalPages = Math.ceil(leaveRequests.length / ITEMS_PER_PAGE);
  const paginatedLeaves = leaveRequests.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (isLoading) return <div className="text-center py-20 text-slate-500">Loading profile data...</div>;
  if (!profile) return <div className="text-center py-20 text-red-500">Failed to load profile data.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Global Toast Alert - Z-index fixed to 100 to float above modals */}
      {toastMsg && (
        <div className="fixed top-24 right-8 z-[100] bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-10 fade-in duration-300">
          <AlertCircle className="w-5 h-5 text-orange-400" />
          <p className="text-sm font-medium">{toastMsg}</p>
        </div>
      )}

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
                <button onClick={cancelEdit} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X className="w-4 h-4" /></button>
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
                  <select value={editValue} onChange={(e) => setEditValue(e.target.value)} className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="" disabled>Select Department</option>
                    {departments.map((dept: any) => (
                      <option key={dept._id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                  <button onClick={handleSaveEdit} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Save className="w-4 h-4" /></button>
                  <button onClick={cancelEdit} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <p className="font-medium text-slate-900 text-lg">{profile.department || 'Not specified'}</p>
              )}
            </div>

            {/* Specialization */}
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
                  <button onClick={cancelEdit} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X className="w-4 h-4" /></button>
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
                <div>
                  <div className="flex gap-2">
                    <input 
                      type="email" 
                      value={editValue} 
                      onChange={(e) => {
                        setEditValue(e.target.value);
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        setValidationError(emailRegex.test(e.target.value) ? '' : 'Please enter a valid email address.');
                      }} 
                      className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" 
                    />
                    <button onClick={handleSaveEdit} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Save className="w-4 h-4" /></button>
                    <button onClick={cancelEdit} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X className="w-4 h-4" /></button>
                  </div>
                  {validationError && <p className="text-red-500 text-xs mt-1">{validationError}</p>}
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
                <div>
                  <div className="flex gap-2">
                    <select 
                      value={editCountryCode} 
                      onChange={(e) => {
                        setEditCountryCode(e.target.value);
                        setEditValue(''); 
                        setValidationError('');
                      }} 
                      className="px-2 py-1.5 border rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-teal-500 outline-none"
                    >
                      {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                    </select>
                    <input 
                      type="text" 
                      placeholder="Phone Number"
                      value={editValue} 
                      onChange={handlePhoneInputChange} 
                      className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" 
                    />
                    <button onClick={handleSaveEdit} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 shrink-0"><Save className="w-4 h-4" /></button>
                    <button onClick={cancelEdit} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 shrink-0"><X className="w-4 h-4" /></button>
                  </div>
                  {validationError && <p className="text-red-500 text-xs mt-1">{validationError}</p>}
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
                <div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      maxLength={150}
                      value={editValue} 
                      onChange={(e) => { setEditValue(e.target.value); setValidationError(''); }} 
                      className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                      placeholder="e.g. MBBS, MD" 
                    />
                    <button onClick={handleSaveEdit} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"><Save className="w-4 h-4" /></button>
                    <button onClick={cancelEdit} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X className="w-4 h-4" /></button>
                  </div>
                  {validationError && <p className="text-red-500 text-xs mt-1">{validationError}</p>}
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
                <div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      maxLength={200}
                      value={editValue} 
                      onChange={(e) => { setEditValue(e.target.value); setValidationError(''); }} 
                      className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                    />
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

            {/* Absence Management */}
            <div className="md:col-span-2 border-t border-slate-100 pt-6 mt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Absence Management</p>
                  <p className="text-sm text-slate-500 mt-0.5">Record upcoming leaves or short permissions.</p>
                </div>
                
                <label className="flex items-center gap-2 cursor-pointer bg-white border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors w-fit shrink-0">
                  <input 
                    type="radio" 
                    name="absenceToggle" 
                    checked={isLeaveModalOpen && !editingLeaveId} 
                    onChange={() => {
                      setEditingLeaveId(null);
                      setLeaveData({fromDate: '', toDate: '', fromTime: '09:00', toTime: '17:00'});
                      setLeaveError('');
                      setIsLeaveModalOpen(true);
                    }} 
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-sm font-semibold text-slate-700">Request Leave/Permission</span>
                </label>
              </div>

              {leaveRequests.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mt-3 shadow-sm">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Type</th>
                        <th className="px-4 py-3 font-semibold">From</th>
                        <th className="px-4 py-3 font-semibold">To</th>
                        <th className="px-4 py-3 font-semibold">Hours</th>
                        <th className="px-4 py-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedLeaves.map((req: any, idx: number) => {
                        const canEditDelete = isFutureRecord(req);
                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors group/row">
                            <td className="px-4 py-3">
                              <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${req.type === 'LEAVE' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                                {req.type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600 font-medium">
                              {new Date(req.fromDate).toLocaleDateString()} <span className="text-xs text-slate-400 font-normal ml-1">{new Date(req.fromDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-600 font-medium">
                              {new Date(req.toDate).toLocaleDateString()} <span className="text-xs text-slate-400 font-normal ml-1">{new Date(req.toDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-600 font-bold">{req.hours}</td>
                            <td className="px-4 py-3 text-right">
                              {canEditDelete ? (
                                <div className="flex justify-end gap-1">
                                  <button 
                                    onClick={() => openEditModal(req)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                                    title={`Edits remaining: ${2 - (req.editCount || 0)}`}
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => setDeleteConfirmId(req._id)}
                                    className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                                    title="Delete Request"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs font-semibold text-slate-400">Locked</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                              currentPage === page 
                                ? 'bg-blue-600 text-white shadow-sm' 
                                : 'text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stats Footer */}
            <div className="md:col-span-2 bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-center justify-between mt-2">
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

      {/* LEAVE/PERMISSION MODAL */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-blue-600" />
                {editingLeaveId ? 'Edit Absence Request' : 'Schedule Absence'}
              </h3>
              <button 
                onClick={() => { setIsLeaveModalOpen(false); setEditingLeaveId(null); setLeaveError(''); }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800 leading-relaxed">
                <strong>Note:</strong> A duration of <strong>2 hours or less</strong> registers automatically as a <span className="font-bold">Permission</span>. Anything exceeding that is registered as a full <span className="font-bold">Leave</span>.
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">From Date</label>
                    <input 
                      type="date" 
                      min={new Date().toISOString().split('T')[0]} 
                      value={leaveData.fromDate}
                      onChange={(e) => handleLeaveDataChange('fromDate', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">From Time</label>
                    <input 
                      type="time" 
                      value={leaveData.fromTime}
                      onChange={(e) => handleLeaveDataChange('fromTime', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">To Date</label>
                    <input 
                      type="date" 
                      min={leaveData.fromDate || new Date().toISOString().split('T')[0]} 
                      value={leaveData.toDate}
                      onChange={(e) => handleLeaveDataChange('toDate', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">To Time</label>
                    <input 
                      type="time" 
                      value={leaveData.toTime}
                      onChange={(e) => handleLeaveDataChange('toTime', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Calculated Duration</label>
                <input 
                  type="text" 
                  readOnly
                  value={getCalculatedHours() > 0 ? `${getCalculatedHours()} Hours (${getCalculatedHours() <= 2 ? 'Permission' : 'Leave'})` : '-'}
                  className="w-full px-3 py-2 border border-slate-100 rounded-lg bg-slate-50 text-slate-600 font-semibold outline-none text-sm select-none"
                />
              </div>

              {leaveError && (
                <p className="text-red-500 text-sm font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> {leaveError}
                </p>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => { setIsLeaveModalOpen(false); setEditingLeaveId(null); setLeaveError(''); }}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleLeaveSubmit}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
              >
                {editingLeaveId ? 'Save Changes' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center mt-2">
              <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
                <Trash2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Absence Record?</h3>
              <p className="text-sm text-slate-500 leading-relaxed px-2">
                Are you sure you want to delete this scheduled absence? This action cannot be undone and will free up your calendar.
              </p>
            </div>
            <div className="p-4 bg-slate-50 flex justify-center gap-3 border-t border-slate-100">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => executeDeleteLeave(deleteConfirmId)}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DoctorProfileView;