import React, { useState, useEffect } from 'react';
import { Search, Edit, Trash2, X, Camera, Save, AlertCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { adminApi, metadataApi } from '../../services/api';
import PageHeader from './PageHeader';

const COUNTRY_CODES = [
  { code: '+91', country: 'IN', lengths: [10] },
  { code: '+1', country: 'US/CA', lengths: [10] },
  { code: '+44', country: 'UK', lengths: [10, 11] },
  { code: '+61', country: 'AU', lengths: [9] },
  { code: '+971', country: 'UAE', lengths: [9] },
];

const DoctorRecordsView: React.FC = () => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]); // NEW: Metadata state
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<{msg: string, type: 'success'|'error'|'warning'} | null>(null);

  // Detail/Edit Modal State
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  
  // Custom Validation Error State for the form
  const [formError, setFormError] = useState<string>('');
  
  // Double Confirmation Delete Modal State
  const [deleteState, setDeleteState] = useState<{ id: string, step: number } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    // Fetch doctors and departments concurrently
    const [docsRes, deptsRes] = await Promise.all([
      adminApi.getAllDoctors(),
      metadataApi.getDepartments()
    ]);
    
    if (docsRes.success) setDoctors(docsRes.data);
    if (deptsRes.success) setDepartments(deptsRes.data);
    
    setIsLoading(false);
  };

  const showToast = (msg: string, type: 'success'|'error'|'warning' = 'success') => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const filtered = doctors.filter(d => {
    const fullName = `${d.firstName} ${d.lastName}`.toLowerCase();
    const s = search.toLowerCase();
    return fullName.includes(s) || d._id.toLowerCase().includes(s);
  });

  const handleRowClick = (doctor: any) => {
    setSelectedDoctor(doctor);
    setIsEditingMode(false);
    setFormError('');
  };

  // Helper to split raw phone into country code and local number
  const extractPhoneDetails = (rawPhone: string) => {
    if (!rawPhone) return { cc: '+91', num: '' };
    for (const c of COUNTRY_CODES) {
      if (rawPhone.startsWith(c.code)) {
        return { cc: c.code, num: rawPhone.substring(c.code.length).trim() };
      }
    }
    return { cc: '+91', num: rawPhone.replace(/\D/g, '') };
  };

  const startEdit = (doctor: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDoctor(doctor);
    setFormError('');

    const phoneDetails = extractPhoneDetails(doctor.contactPhone);

    setEditForm({
      firstName: doctor.firstName || '',
      lastName: doctor.lastName || '',
      contactEmail: doctor.contactEmail || '',
      phoneCC: phoneDetails.cc,
      phoneNum: phoneDetails.num,
      specialization: doctor.specialization || '',
      department: doctor.department || '',
      address: doctor.address || '',
      avatar: doctor.avatar || ''
    });
    setIsEditingMode(true);
  };

  const cancelEdit = () => {
    setSelectedDoctor(null);
    setIsEditingMode(false);
    setEditForm({});
    setFormError('');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB Limit
    if (file.size > MAX_SIZE) {
      showToast('Image is too large. Must be less than 5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const webpBase64 = canvas.toDataURL('image/webp', 0.8);
        setEditForm({ ...editForm, avatar: webpBase64 });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handlePhoneInput = (val: string) => {
    const numbersOnly = val.replace(/\D/g, '');
    const ccDef = COUNTRY_CODES.find(c => c.code === editForm.phoneCC);
    const maxLen = ccDef ? Math.max(...ccDef.lengths) : 15;
    
    if (numbersOnly.length <= maxLen) {
      setEditForm({ ...editForm, phoneNum: numbersOnly });
      setFormError('');
    }
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!editForm.firstName.trim() || !editForm.lastName.trim()) {
      setFormError('First and Last names are required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (editForm.contactEmail && !emailRegex.test(editForm.contactEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    const phoneDef = COUNTRY_CODES.find(c => c.code === editForm.phoneCC);
    if (editForm.phoneNum && phoneDef && !phoneDef.lengths.includes(editForm.phoneNum.length)) {
      setFormError(`Phone number must be ${phoneDef.lengths.join(' or ')} digits for ${editForm.phoneCC}.`);
      return;
    }

    if (editForm.address.length > 200) {
      setFormError('Address cannot exceed 200 characters.');
      return;
    }

    // Require both Department and Specialization
    if (!editForm.department || !editForm.specialization) {
      setFormError('Both Department and Specialization must be selected.');
      return;
    }
    
    const payload = {
      ...editForm,
      contactPhone: editForm.phoneNum ? `${editForm.phoneCC} ${editForm.phoneNum}` : ''
    };

    delete payload.phoneCC;
    delete payload.phoneNum;

    const res = await adminApi.updateDoctor(selectedDoctor._id, payload);
    if (res.success) {
      setDoctors(prev => prev.map(d => d._id === selectedDoctor._id ? res.data : d));
      showToast('Doctor record updated successfully.');
      setSelectedDoctor(res.data); 
      setIsEditingMode(false);
    } else {
      showToast(res.message || 'Failed to update record.', 'error');
    }
  };

  // --- Double Confirm Delete Logic ---
  const initiateDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteState({ id, step: 1 });
  };

  const confirmDeleteStep1 = () => {
    if (deleteState) setDeleteState({ ...deleteState, step: 2 });
  };

  const executeDelete = async () => {
    if (!deleteState) return;
    const res = await adminApi.deleteDoctor(deleteState.id);
    
    if (res.success) {
      setDoctors(prev => prev.filter(d => d._id !== deleteState.id));
      showToast('Doctor securely deleted.');
      if (selectedDoctor?._id === deleteState.id) cancelEdit(); 
    } else {
      showToast('Failed to delete doctor.', 'error');
    }
    setDeleteState(null);
  };

  // --- Helper Calculators ---
  const getDoctorStatus = (leave_requests: any[]) => {
    if (!leave_requests || leave_requests.length === 0) return { text: 'Online', style: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500 animate-pulse' };
    
    const now = new Date().getTime();
    for (const req of leave_requests) {
      const start = new Date(req.fromDate).getTime();
      const end = new Date(req.toDate).getTime();
      if (now >= start && now <= end) {
        if (req.type === 'PERMISSION') return { text: `Permission (${req.hours} hrs)`, style: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' };
        return { text: 'On Leave', style: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' };
      }
    }
    return { text: 'Online', style: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500 animate-pulse' };
  };

  const getLastLogin = (user_id: any) => {
    const history = user_id?.login_history || [];
    if (history.length === 0) return 'Never logged in';
    const loginDate = history.length > 1 ? history[history.length - 2].logged_in_at : history[0].logged_in_at;
    return new Date(loginDate).toLocaleString();
  };

  // Derive available specializations for the currently selected department
  const selectedDeptObj = departments.find(d => d.name === editForm.department);
  const availableSpecializations = selectedDeptObj ? selectedDeptObj.specializations : [];

  if (isLoading) return <div className="text-center py-20 text-slate-500">Loading doctor records...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      
      {/* Global Toast */}
      {toastMsg && (
        <div className={`fixed top-24 right-8 z-[100] px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-10 fade-in duration-300 text-white ${toastMsg.type === 'error' ? 'bg-red-600' : toastMsg.type === 'warning' ? 'bg-amber-600' : 'bg-slate-900'}`}>
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">{toastMsg.msg}</p>
        </div>
      )}

      <PageHeader title="Doctor Records" description="Directory of all medical professionals on the platform." />
      
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
           <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search doctor name or ID..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold w-1/4">Doctor Profile</th>
                <th className="px-6 py-4 font-semibold w-1/4">Specialization</th>
                <th className="px-6 py-4 font-semibold w-1/4">Status</th>
                <th className="px-6 py-4 font-semibold">Patients Treated</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(d => {
                const statusInfo = getDoctorStatus(d.leave_requests);
                return (
                  <tr key={d._id} onClick={() => handleRowClick(d)} className="hover:bg-slate-50 cursor-pointer group transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {d.avatar ? (
                          <img src={d.avatar} alt="doc" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold border border-teal-200">{d.firstName.charAt(0)}</div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Dr. {d.firstName} {d.lastName}</p>
                          <p className="text-xs text-slate-500 font-mono">{d._id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <p className="font-medium text-slate-800">{d.specialization || 'Not specified'}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{d.department || 'General'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo.style}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}></span>
                        {statusInfo.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">{d.total_treated.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={(e) => startEdit(d, e)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                        <button onClick={(e) => initiateDelete(d._id, e)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">No doctor records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Detail & Edit Popover Modal --- */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[80] p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 my-8">
            <button onClick={cancelEdit} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
            
            {isEditingMode ? (
              <form onSubmit={saveEdit}>
                <h3 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Edit Doctor Profile</h3>
                
                {formError && (
                  <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-700 text-sm font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {formError}
                  </div>
                )}

                <div className="flex items-center gap-5 mb-6">
                  <div className="relative group">
                    {editForm.avatar ? (
                      <img src={editForm.avatar} alt="doctor" className="w-16 h-16 rounded-full object-cover border border-slate-200" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-2xl border border-teal-200">{editForm.firstName?.charAt(0) || 'D'}</div>
                    )}
                    <label className="absolute -bottom-1 -right-1 bg-teal-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-teal-700 shadow-md transition-transform hover:scale-110">
                      <Camera className="w-4 h-4" />
                      <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                    </label>
                  </div>
                  <div className="flex-1 flex gap-3">
                    <input required type="text" maxLength={50} value={editForm.firstName} onChange={e => { setEditForm({...editForm, firstName: e.target.value}); setFormError(''); }} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="First Name" />
                    <input required type="text" maxLength={50} value={editForm.lastName} onChange={e => { setEditForm({...editForm, lastName: e.target.value}); setFormError(''); }} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Last Name" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                  {/* Department and Specialization using DB MetaData */}
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Department</label>
                    <select 
                      required 
                      value={editForm.department} 
                      onChange={e => setEditForm({...editForm, department: e.target.value, specialization: ''})} 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                    >
                      <option value="" disabled>Select Department</option>
                      {departments.map((dept: any) => (
                        <option key={dept._id} value={dept.name}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Specialization</label>
                    {editForm.department ? (
                      <select 
                        required 
                        value={editForm.specialization} 
                        onChange={e => setEditForm({...editForm, specialization: e.target.value})} 
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white"
                      >
                        <option value="" disabled>Select Specialization</option>
                        {availableSpecializations.map((spec: string) => (
                          <option key={spec} value={spec}>{spec}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="w-full px-3 py-2 border border-red-200 bg-red-50 rounded-lg text-red-600 flex items-center">
                        Select Department First
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                    <input type="email" value={editForm.contactEmail} onChange={e => { setEditForm({...editForm, contactEmail: e.target.value}); setFormError(''); }} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
                  </div>
                  
                  {/* Phone with Country Code */}
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                    <div className="flex gap-2">
                      <select
                        value={editForm.phoneCC}
                        onChange={(e) => {
                          setEditForm({...editForm, phoneCC: e.target.value, phoneNum: ''});
                          setFormError('');
                        }}
                        className="w-24 px-2 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-teal-500 outline-none"
                      >
                        {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                      </select>
                      <input 
                        type="tel" 
                        value={editForm.phoneNum} 
                        onChange={e => handlePhoneInput(e.target.value)} 
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" 
                        placeholder="Number"
                      />
                    </div>
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-500 uppercase">Office / Clinic Address</label>
                      <span className="text-[10px] text-slate-400">{editForm.address.length}/200</span>
                    </div>
                    <input type="text" maxLength={200} value={editForm.address} onChange={e => { setEditForm({...editForm, address: e.target.value}); setFormError(''); }} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={cancelEdit} className="px-5 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-sm"><Save className="w-4 h-4"/> Save Changes</button>
                </div>
              </form>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                  <h3 className="text-xl font-bold text-slate-900">Doctor Details</h3>
                  {(() => {
                    const s = getDoctorStatus(selectedDoctor.leave_requests);
                    return (
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold flex items-center gap-1.5 ${s.style}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span> {s.text}
                      </span>
                    );
                  })()}
                </div>

                <div className="flex items-center gap-5 mb-8">
                   {selectedDoctor.avatar ? (
                      <img src={selectedDoctor.avatar} alt="doc" className="w-16 h-16 rounded-full object-cover shadow-sm border border-slate-200" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-2xl border border-teal-200 shadow-sm">{selectedDoctor.firstName.charAt(0)}</div>
                    )}
                   <div>
                      <h3 className="text-2xl font-bold text-slate-900">Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}</h3>
                      <p className="text-sm text-slate-500 font-mono mt-1 bg-slate-100 px-2 py-0.5 rounded w-fit">ID: {selectedDoctor._id}</p>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-y-6 gap-x-8 text-sm">
                   <div><span className="text-slate-400 block text-xs font-bold uppercase mb-1">Department</span><span className="font-medium block text-slate-900 text-base">{selectedDoctor.department || 'N/A'}</span></div>
                   <div><span className="text-slate-400 block text-xs font-bold uppercase mb-1">Specialization</span><span className="font-medium block text-slate-900 text-base">{selectedDoctor.specialization || 'N/A'}</span></div>
                   <div><span className="text-slate-400 block text-xs font-bold uppercase mb-1">Email Address</span><span className="font-medium block text-slate-900 text-base">{selectedDoctor.contactEmail || 'N/A'}</span></div>
                   <div><span className="text-slate-400 block text-xs font-bold uppercase mb-1">Phone Number</span><span className="font-medium block text-slate-900 text-base">{selectedDoctor.contactPhone || 'N/A'}</span></div>
                   <div className="col-span-2"><span className="text-slate-400 block text-xs font-bold uppercase mb-1">Office / Clinic Address</span><span className="font-medium text-slate-900 text-base leading-relaxed">{selectedDoctor.address || 'N/A'}</span></div>
                   
                   <div className="col-span-2 border-t border-slate-100 pt-5 mt-2 grid grid-cols-3 gap-4">
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm">
                        <span className="block text-xs text-slate-500 font-bold uppercase mb-1">Total Treated</span>
                        <span className="text-2xl font-black text-blue-600">{selectedDoctor.total_treated.toLocaleString()}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm">
                        <span className="block text-xs text-slate-500 font-bold uppercase mb-1">Flags Raised</span>
                        <span className="text-2xl font-black text-orange-500">{selectedDoctor.total_flags.toLocaleString()}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col justify-between">
                        <span className="block text-xs text-slate-500 font-bold uppercase mb-1 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5"/> Last Login</span>
                        <span className="text-sm font-semibold text-slate-800 leading-tight">
                          {getLastLogin(selectedDoctor.user_id)}
                        </span>
                      </div>
                   </div>
                </div>

                <div className="flex justify-end pt-6 mt-6 border-t border-slate-100">
                  <button onClick={(e) => startEdit(selectedDoctor, e)} className="px-6 py-2.5 bg-teal-50 text-teal-700 font-semibold rounded-xl hover:bg-teal-100 transition-colors flex items-center gap-2 border border-teal-100"><Edit className="w-4 h-4"/> Edit Profile</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- Double Confirmation Delete Modal --- */}
      {deleteState && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-red-100">
            <div className="p-6 text-center mt-2">
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border-4 border-red-100">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                {deleteState.step === 1 ? 'Delete Doctor Profile?' : 'Final Confirmation'}
              </h3>
              <p className="text-slate-500 leading-relaxed px-2">
                {deleteState.step === 1 
                  ? "This will remove the doctor from the active directory. Are you absolutely sure you want to proceed?" 
                  : "This action is irreversible and the doctor will lose portal access immediately. Confirm deletion?"}
              </p>
            </div>
            
            <div className="p-4 bg-slate-50 flex justify-center gap-3 border-t border-slate-100">
              <button 
                onClick={() => setDeleteState(null)}
                className="px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              
              {deleteState.step === 1 ? (
                <button 
                  onClick={confirmDeleteStep1}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-sm"
                >
                  Yes, Proceed
                </button>
              ) : (
                <button 
                  onClick={executeDelete}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-red-700 hover:bg-red-800 rounded-xl transition-colors shadow-md animate-pulse"
                >
                  Confirm Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorRecordsView;