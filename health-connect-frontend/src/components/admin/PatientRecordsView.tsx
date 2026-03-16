import React, { useState } from 'react';
import { Search, Edit, Trash2, X, Camera, Save } from 'lucide-react';
import type { PatientRecord } from '../../types/admin.types';
import { mockPatients } from '../../data/mockAdminData';
import PageHeader from './PageHeader';

const PatientRecordsView: React.FC = () => {
  const [patients, setPatients] = useState(mockPatients);
  const [search, setSearch] = useState('');
  
  // Popover State
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<PatientRecord>>({});

  const filtered = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.patientId.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if(window.confirm("Are you sure you want to delete this patient record?")) {
      setPatients(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleRowClick = (patient: PatientRecord) => {
    setSelectedPatient(patient);
    setIsEditingMode(false);
  };

  const startEdit = (patient: PatientRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedPatient(patient);
    setEditForm(patient);
    setIsEditingMode(true);
  };

  const cancelEdit = () => {
    setSelectedPatient(null);
    setIsEditingMode(false);
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setPatients(prev => prev.map(p => p.id === selectedPatient?.id ? { ...p, ...editForm } as PatientRecord : p));
    setSelectedPatient(null);
    setIsEditingMode(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditForm({ ...editForm, avatar: URL.createObjectURL(file) });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
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
                <tr key={p.id} onClick={() => handleRowClick(p)} className="hover:bg-slate-50 cursor-pointer group transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {p.avatar ? (
                        <img src={p.avatar} alt="patient" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">{p.name.charAt(0)}</div>
                      )}
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{p.name}</p>
                        <p className="text-xs text-slate-500 font-mono">{p.patientId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600"><p>{p.phone}</p><p className="text-xs text-slate-400">{p.email}</p></td>
                  <td className="px-6 py-4 text-slate-600"><span className="bg-slate-100 px-2 py-1 rounded text-xs mr-2">{p.gender}</span><span className="bg-red-50 text-red-600 px-2 py-1 rounded text-xs font-bold">{p.bloodGroup}</span></td>
                  <td className="px-6 py-4"><p className="text-xs text-slate-500 max-w-[150px] truncate">{p.activeDepartments.join(', ')}</p></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={(e) => startEdit(p, e)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={(e) => handleDelete(p.id, e)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail & Edit Popover */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 my-8">
            <button onClick={cancelEdit} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
            
            {isEditingMode ? (
              <form onSubmit={saveEdit}>
                <h3 className="text-xl font-bold text-slate-900 mb-6 border-b pb-4">Edit Patient Record</h3>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    {editForm.avatar || selectedPatient.avatar ? (
                      <img src={editForm.avatar || selectedPatient.avatar} alt="patient" className="w-16 h-16 rounded-full object-cover border" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-2xl">{editForm.name?.charAt(0) || selectedPatient.name.charAt(0)}</div>
                    )}
                    <label className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-700 shadow-sm">
                      <Camera className="w-4 h-4" />
                      <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                    </label>
                  </div>
                  <div className="flex-1 space-y-3">
                    <input required type="text" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Full Name" />
                    <input required type="text" value={editForm.patientId || ''} onChange={e => setEditForm({...editForm, patientId: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono" placeholder="Patient ID" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Email Address</label>
                    <input required type="email" value={editForm.email || ''} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Phone Number</label>
                    <input required type="text" value={editForm.phone || ''} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Date of Birth</label>
                    <input required type="date" value={editForm.dob || ''} onChange={e => setEditForm({...editForm, dob: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="space-y-1 grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-500">Gender</label>
                      <select value={editForm.gender || ''} onChange={e => setEditForm({...editForm, gender: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500">Blood</label>
                      <input required type="text" value={editForm.bloodGroup || ''} onChange={e => setEditForm({...editForm, bloodGroup: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Address</label>
                    <input required type="text" value={editForm.address || ''} onChange={e => setEditForm({...editForm, address: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Emergency Contact</label>
                    <input required type="text" value={editForm.emergencyContact || ''} onChange={e => setEditForm({...editForm, emergencyContact: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Name (Relation) - Phone" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Active Departments (Comma separated)</label>
                    <input type="text" value={editForm.activeDepartments?.join(', ') || ''} onChange={e => setEditForm({...editForm, activeDepartments: e.target.value.split(',').map(s=>s.trim())})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Known Problems / Allergies (Comma separated)</label>
                    <input type="text" value={editForm.knownProblems?.join(', ') || ''} onChange={e => setEditForm({...editForm, knownProblems: e.target.value.split(',').map(s=>s.trim())})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={cancelEdit} className="px-5 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"><Save className="w-4 h-4"/> Save Changes</button>
                </div>
              </form>
            ) : (
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-6 border-b pb-4">Patient Details</h3>
                <div className="flex items-center gap-4 mb-6">
                   {selectedPatient.avatar ? (
                      <img src={selectedPatient.avatar} alt="patient" className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-2xl">{selectedPatient.name.charAt(0)}</div>
                    )}
                   <div>
                      <h3 className="text-2xl font-bold text-slate-900">{selectedPatient.name}</h3>
                      <p className="text-sm text-slate-500 font-mono">Patient ID: {selectedPatient.patientId}</p>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-y-5 gap-x-8 text-sm">
                   <div><span className="text-slate-500 block text-xs uppercase mb-1">Email Address</span><span className="font-medium block text-slate-900">{selectedPatient.email}</span></div>
                   <div><span className="text-slate-500 block text-xs uppercase mb-1">Phone Number</span><span className="font-medium block text-slate-900">{selectedPatient.phone}</span></div>
                   <div><span className="text-slate-500 block text-xs uppercase mb-1">Date of Birth</span><span className="font-medium text-slate-900">{selectedPatient.dob}</span></div>
                   <div><span className="text-slate-500 block text-xs uppercase mb-1">Blood Group & Gender</span><span className="font-medium text-slate-900">{selectedPatient.bloodGroup} • {selectedPatient.gender}</span></div>
                   <div className="col-span-2"><span className="text-slate-500 block text-xs uppercase mb-1">Emergency Contact</span><span className="font-medium text-slate-900">{selectedPatient.emergencyContact}</span></div>
                   <div className="col-span-2"><span className="text-slate-500 block text-xs uppercase mb-1">Address</span><span className="font-medium text-slate-900">{selectedPatient.address}</span></div>
                   <div className="col-span-2">
                     <span className="text-slate-500 block text-xs uppercase mb-2">Active Departments</span>
                     <div className="flex gap-2 flex-wrap">{selectedPatient.activeDepartments.map(dep => <span key={dep} className="bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md text-xs font-semibold">{dep}</span>)}</div>
                   </div>
                   <div className="col-span-2">
                     <span className="text-slate-500 block text-xs uppercase mb-2">Known Problems / Allergies</span>
                     <div className="flex gap-2 flex-wrap">
                       {selectedPatient.knownProblems.length > 0 ? selectedPatient.knownProblems.map(kp => <span key={kp} className="bg-red-50 border border-red-100 text-red-700 px-2.5 py-1 rounded-md text-xs font-semibold">{kp}</span>) : <span className="text-slate-400 italic">None recorded</span>}
                     </div>
                   </div>
                </div>

                <div className="flex justify-end pt-6 mt-4 border-t border-slate-100">
                  <button onClick={(e) => startEdit(selectedPatient, e)} className="px-5 py-2.5 bg-blue-50 text-blue-700 font-semibold rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-2"><Edit className="w-4 h-4"/> Edit Record</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientRecordsView;