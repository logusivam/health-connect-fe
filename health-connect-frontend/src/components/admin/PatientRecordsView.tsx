import React, { useState, useEffect } from 'react';
import { Search, Edit, Trash2, X, Camera, Save, AlertCircle, AlertTriangle } from 'lucide-react';
import { adminApi } from '../../services/api';
import PageHeader from './PageHeader';

const PatientRecordsView: React.FC = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<{msg: string, type: 'success'|'error'|'warning'} | null>(null);

  // Detail/Edit Modal State
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  
  // Double Confirmation Delete Modal State
  const [deleteState, setDeleteState] = useState<{ id: string, step: number } | null>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setIsLoading(true);
    const res = await adminApi.getAllPatients();
    if (res.success) {
      setPatients(res.data);
    }
    setIsLoading(false);
  };

  const showToast = (msg: string, type: 'success'|'error'|'warning' = 'success') => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const filtered = patients.filter(p => {
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    const s = search.toLowerCase();
    return fullName.includes(s) || p._id.toLowerCase().includes(s);
  });

  const handleRowClick = (patient: any) => {
    setSelectedPatient(patient);
    setIsEditingMode(false);
  };

  const startEdit = (patient: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPatient(patient);
    // Load existing data into form
    setEditForm({
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.user_id?.email || '',
      phone: patient.phone || '',
      dob: patient.dob ? new Date(patient.dob).toISOString().split('T')[0] : '',
      gender: patient.gender || 'Other',
      bloodGroup: patient.bloodGroup || '',
      address: patient.address || '',
      emergencyContactName: patient.emergencyContactName || '',
      emergencyContactPhone: patient.emergencyContactPhone || '',
      knownAllergies: patient.knownAllergies?.join(', ') || '',
      department_involved: patient.department_involved?.join(', ') || '',
      avatar: patient.avatar || ''
    });
    setIsEditingMode(true);
  };

  const cancelEdit = () => {
    setSelectedPatient(null);
    setIsEditingMode(false);
    setEditForm({});
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 4 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      showToast('Image is too large. Must be less than 4MB.', 'error');
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

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare payload. Convert comma strings back to arrays.
    const payload = {
      ...editForm,
      knownAllergies: editForm.knownAllergies.split(',').map((s: string) => s.trim()).filter(Boolean),
      department_involved: editForm.department_involved.split(',').map((s: string) => s.trim()).filter(Boolean)
    };

    const res = await adminApi.updatePatient(selectedPatient._id, payload);
    if (res.success) {
      // Update local state array to avoid refetching
      setPatients(prev => prev.map(p => p._id === selectedPatient._id ? res.data : p));
      showToast('Patient record updated successfully.');
      setSelectedPatient(res.data); // Update open popover
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
    const res = await adminApi.deletePatient(deleteState.id);
    
    if (res.success) {
      setPatients(prev => prev.filter(p => p._id !== deleteState.id));
      showToast('Patient securely deleted.');
      if (selectedPatient?._id === deleteState.id) {
        cancelEdit(); // Close popover if open
      }
    } else {
      showToast('Failed to delete patient.', 'error');
    }
    setDeleteState(null);
  };

  if (isLoading) {
    return <div className="text-center py-20 text-slate-500">Loading patient records...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      
      {/* Global Toast */}
      {toastMsg && (
        <div className={`fixed top-24 right-8 z-[100] px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-10 fade-in duration-300 text-white ${toastMsg.type === 'error' ? 'bg-red-600' : toastMsg.type === 'warning' ? 'bg-amber-600' : 'bg-slate-900'}`}>
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">{toastMsg.msg}</p>
        </div>
      )}

      <PageHeader title="Patient Records" description="Complete registry of all registered patients in the system." />
      
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
           <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search patient name or ID..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold w-1/4">Patient Name & ID</th>
                <th className="px-6 py-4 font-semibold w-1/4">Contact Info</th>
                <th className="px-6 py-4 font-semibold w-1/4">Demographics</th>
                <th className="px-6 py-4 font-semibold">Active Depts</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(p => (
                <tr key={p._id} onClick={() => handleRowClick(p)} className="hover:bg-slate-50 cursor-pointer group transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {p.avatar ? (
                        <img src={p.avatar} alt="patient" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold border border-blue-200">{p.firstName.charAt(0)}</div>
                      )}
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{p.firstName} {p.lastName}</p>
                        <p className="text-xs text-slate-500 font-mono">{p._id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <p className="font-medium text-slate-800">{p.phone}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{p.user_id?.email || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <span className="bg-slate-100 px-2.5 py-1 rounded-md text-xs mr-2 font-medium">{p.gender}</span>
                    <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-md text-xs font-bold border border-red-100">{p.bloodGroup || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-500 max-w-[150px] truncate">
                      {p.department_involved && p.department_involved.length > 0 ? p.department_involved.join(', ') : 'None'}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={(e) => startEdit(p, e)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={(e) => initiateDelete(p._id, e)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">No patient records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Detail & Edit Popover Modal --- */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[80] p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 my-8">
            <button onClick={cancelEdit} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
            
            {isEditingMode ? (
              <form onSubmit={saveEdit}>
                <h3 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Edit Patient Record</h3>
                
                <div className="flex items-center gap-5 mb-6">
                  <div className="relative group">
                    {editForm.avatar ? (
                      <img src={editForm.avatar} alt="patient" className="w-16 h-16 rounded-full object-cover border border-slate-200" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-2xl border border-blue-200">{editForm.firstName?.charAt(0) || 'P'}</div>
                    )}
                    <label className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-700 shadow-md transition-transform hover:scale-110">
                      <Camera className="w-4 h-4" />
                      <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                    </label>
                  </div>
                  <div className="flex-1 flex gap-3">
                    <input required type="text" value={editForm.firstName || ''} onChange={e => setEditForm({...editForm, firstName: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="First Name" />
                    <input required type="text" value={editForm.lastName || ''} onChange={e => setEditForm({...editForm, lastName: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Last Name" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                    <input required type="email" value={editForm.email || ''} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                    <input required type="text" value={editForm.phone || ''} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Date of Birth</label>
                    <input required type="date" value={editForm.dob || ''} onChange={e => setEditForm({...editForm, dob: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1.5 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Gender</label>
                      <select value={editForm.gender || ''} onChange={e => setEditForm({...editForm, gender: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                        <option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Blood</label>
                      <input required type="text" value={editForm.bloodGroup || ''} onChange={e => setEditForm({...editForm, bloodGroup: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Residential Address</label>
                    <input required type="text" value={editForm.address || ''} onChange={e => setEditForm({...editForm, address: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Emg. Contact Name</label>
                    <input type="text" value={editForm.emergencyContactName || ''} onChange={e => setEditForm({...editForm, emergencyContactName: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Emg. Contact Phone</label>
                    <input type="text" value={editForm.emergencyContactPhone || ''} onChange={e => setEditForm({...editForm, emergencyContactPhone: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Active Departments (Comma separated)</label>
                    <input type="text" value={editForm.department_involved || ''} onChange={e => setEditForm({...editForm, department_involved: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase">Known Allergies (Comma separated)</label>
                    <input type="text" value={editForm.knownAllergies || ''} onChange={e => setEditForm({...editForm, knownAllergies: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={cancelEdit} className="px-5 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"><Save className="w-4 h-4"/> Save Changes</button>
                </div>
              </form>
            ) : (
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Patient Details</h3>
                <div className="flex items-center gap-5 mb-8">
                   {selectedPatient.avatar ? (
                      <img src={selectedPatient.avatar} alt="patient" className="w-16 h-16 rounded-full object-cover border border-slate-200" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-2xl border border-blue-200">{selectedPatient.firstName.charAt(0)}</div>
                    )}
                   <div>
                      <h3 className="text-2xl font-bold text-slate-900">{selectedPatient.firstName} {selectedPatient.lastName}</h3>
                      <p className="text-sm text-slate-500 font-mono mt-1 bg-slate-100 px-2 py-0.5 rounded w-fit">ID: {selectedPatient._id}</p>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-y-6 gap-x-8 text-sm">
                   <div><span className="text-slate-400 block text-xs font-bold uppercase mb-1">Email Address</span><span className="font-medium block text-slate-900 text-base">{selectedPatient.user_id?.email || 'N/A'}</span></div>
                   <div><span className="text-slate-400 block text-xs font-bold uppercase mb-1">Phone Number</span><span className="font-medium block text-slate-900 text-base">{selectedPatient.phone}</span></div>
                   <div><span className="text-slate-400 block text-xs font-bold uppercase mb-1">Date of Birth</span><span className="font-medium text-slate-900 text-base">{selectedPatient.dob ? new Date(selectedPatient.dob).toLocaleDateString() : 'N/A'}</span></div>
                   <div><span className="text-slate-400 block text-xs font-bold uppercase mb-1">Blood Group & Gender</span><span className="font-medium text-slate-900 text-base">{selectedPatient.bloodGroup || 'N/A'} • {selectedPatient.gender}</span></div>
                   <div className="col-span-2"><span className="text-slate-400 block text-xs font-bold uppercase mb-1">Emergency Contact</span><span className="font-medium text-slate-900 text-base">{selectedPatient.emergencyContactName} • {selectedPatient.emergencyContactPhone}</span></div>
                   <div className="col-span-2"><span className="text-slate-400 block text-xs font-bold uppercase mb-1">Residential Address</span><span className="font-medium text-slate-900 text-base leading-relaxed">{selectedPatient.address || 'N/A'}</span></div>
                   <div className="col-span-2">
                     <span className="text-slate-400 block text-xs font-bold uppercase mb-2">Active Departments</span>
                     <div className="flex gap-2 flex-wrap">
                       {selectedPatient.department_involved?.length > 0 
                         ? selectedPatient.department_involved.map((dep: string) => <span key={dep} className="bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold">{dep}</span>) 
                         : <span className="text-slate-400 italic">None</span>}
                     </div>
                   </div>
                   <div className="col-span-2">
                     <span className="text-slate-400 block text-xs font-bold uppercase mb-2">Known Problems / Allergies</span>
                     <div className="flex gap-2 flex-wrap">
                       {selectedPatient.knownAllergies?.length > 0 
                         ? selectedPatient.knownAllergies.map((kp: string) => <span key={kp} className="bg-red-50 border border-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-semibold">{kp}</span>) 
                         : <span className="text-slate-400 italic">None recorded</span>}
                     </div>
                   </div>
                </div>

                <div className="flex justify-end pt-6 mt-6 border-t border-slate-100">
                  <button onClick={(e) => startEdit(selectedPatient, e)} className="px-6 py-2.5 bg-blue-50 text-blue-700 font-semibold rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-2 border border-blue-100"><Edit className="w-4 h-4"/> Edit Record</button>
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
                {deleteState.step === 1 ? 'Delete Patient Record?' : 'Final Confirmation'}
              </h3>
              <p className="text-slate-500 leading-relaxed px-2">
                {deleteState.step === 1 
                  ? "This will remove the patient from the active directory. Are you absolutely sure you want to proceed?" 
                  : "This action is irreversible and the patient will lose access to their portal immediately. Confirm deletion?"}
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

export default PatientRecordsView;