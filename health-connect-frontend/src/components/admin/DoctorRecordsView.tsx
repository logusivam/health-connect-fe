import React, { useState } from 'react';
import { Search, Edit, Trash2, X, Camera, Save } from 'lucide-react';
import type { DoctorRecord } from '../../types/admin.types';
import { mockDoctors } from '../../data/mockAdminData';
import PageHeader from './PageHeader';

const DoctorRecordsView: React.FC = () => {
  const [doctors, setDoctors] = useState(mockDoctors);
  const [search, setSearch] = useState('');
  
  // Popover State
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorRecord | null>(null);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<DoctorRecord>>({});

  const filtered = doctors.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.doctorId.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if(window.confirm("Are you sure you want to delete this doctor profile?")) {
      setDoctors(prev => prev.filter(d => d.id !== id));
    }
  };

  const handleRowClick = (doctor: DoctorRecord) => {
    setSelectedDoctor(doctor);
    setIsEditingMode(false);
  };

  const startEdit = (doctor: DoctorRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedDoctor(doctor);
    setEditForm(doctor);
    setIsEditingMode(true);
  };

  const cancelEdit = () => {
    setSelectedDoctor(null);
    setIsEditingMode(false);
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setDoctors(prev => prev.map(d => d.id === selectedDoctor?.id ? { ...d, ...editForm } as DoctorRecord : d));
    setSelectedDoctor(null);
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
              {filtered.map(d => (
                <tr key={d.id} onClick={() => handleRowClick(d)} className="hover:bg-slate-50 cursor-pointer group transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {d.avatar ? <img src={d.avatar} alt="doc" className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold">{d.name.replace('Dr. ','').charAt(0)}</div>}
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{d.name}</p>
                        <p className="text-xs text-slate-500 font-mono">{d.doctorId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600"><p className="font-medium">{d.specialization}</p><p className="text-xs text-slate-400">{d.department}</p></td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${d.status === 'Online' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${d.status === 'Online' ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></span>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">{d.totalPatientsTreated.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={(e) => startEdit(d, e)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={(e) => handleDelete(d.id, e)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail & Edit Popover */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 my-8">
            <button onClick={cancelEdit} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
            
            {isEditingMode ? (
              <form onSubmit={saveEdit}>
                <h3 className="text-xl font-bold text-slate-900 mb-6 border-b pb-4">Edit Doctor Profile</h3>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    {editForm.avatar || selectedDoctor.avatar ? (
                      <img src={editForm.avatar || selectedDoctor.avatar} alt="doctor" className="w-16 h-16 rounded-full object-cover border" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-2xl">{editForm.name?.replace('Dr. ','').charAt(0) || selectedDoctor.name.replace('Dr. ','').charAt(0)}</div>
                    )}
                    <label className="absolute -bottom-1 -right-1 bg-teal-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-teal-700 shadow-sm">
                      <Camera className="w-4 h-4" />
                      <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                    </label>
                  </div>
                  <div className="flex-1 space-y-3">
                    <input required type="text" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="Doctor Name" />
                    <input required type="text" value={editForm.doctorId || ''} onChange={e => setEditForm({...editForm, doctorId: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 font-mono" placeholder="Doctor ID" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Specialization</label>
                    <input required type="text" value={editForm.specialization || ''} onChange={e => setEditForm({...editForm, specialization: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Department</label>
                    <input required type="text" value={editForm.department || ''} onChange={e => setEditForm({...editForm, department: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Email Address</label>
                    <input required type="email" value={editForm.email || ''} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Phone Number</label>
                    <input required type="text" value={editForm.phone || ''} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Office / Clinic Address</label>
                    <input required type="text" value={editForm.address || ''} onChange={e => setEditForm({...editForm, address: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Total Patients Treated</label>
                    <input required type="number" value={editForm.totalPatientsTreated ?? 0} onChange={e => setEditForm({...editForm, totalPatientsTreated: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Current Status</label>
                    <select value={editForm.status || ''} onChange={e => setEditForm({...editForm, status: e.target.value as 'Online'|'Offline'})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500">
                      <option value="Online">Online</option>
                      <option value="Offline">Offline</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={cancelEdit} className="px-5 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors flex items-center gap-2"><Save className="w-4 h-4"/> Save Changes</button>
                </div>
              </form>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6 border-b pb-4">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                    Doctor Details
                  </h3>
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold flex items-center gap-1.5 ${selectedDoctor.status === 'Online' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedDoctor.status === 'Online' ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></span>
                    {selectedDoctor.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 mb-6">
                   {selectedDoctor.avatar ? (
                      <img src={selectedDoctor.avatar} alt="doc" className="w-16 h-16 rounded-full object-cover shadow-sm border border-slate-100" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-2xl shadow-sm">{selectedDoctor.name.replace('Dr. ','').charAt(0)}</div>
                    )}
                   <div>
                      <h3 className="text-2xl font-bold text-slate-900">{selectedDoctor.name}</h3>
                      <p className="text-sm text-slate-500 font-mono">Doctor ID: {selectedDoctor.doctorId}</p>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-y-5 gap-x-8 text-sm">
                   <div><span className="text-slate-500 block text-xs uppercase mb-1">Department</span><span className="font-medium block text-slate-900">{selectedDoctor.department}</span></div>
                   <div><span className="text-slate-500 block text-xs uppercase mb-1">Specialization</span><span className="font-medium block text-slate-900">{selectedDoctor.specialization}</span></div>
                   <div><span className="text-slate-500 block text-xs uppercase mb-1">Email Address</span><span className="font-medium block text-slate-900">{selectedDoctor.email}</span></div>
                   <div><span className="text-slate-500 block text-xs uppercase mb-1">Phone Number</span><span className="font-medium text-slate-900">{selectedDoctor.phone}</span></div>
                   <div className="col-span-2"><span className="text-slate-500 block text-xs uppercase mb-1">Office / Clinic Address</span><span className="font-medium text-slate-900">{selectedDoctor.address}</span></div>
                   
                   <div className="col-span-2 border-t border-slate-100 pt-4 mt-2 grid grid-cols-3 gap-4">
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl"><span className="block text-xs text-slate-500 uppercase mb-1">Total Treated</span><span className="text-xl font-bold text-blue-600">{selectedDoctor.totalPatientsTreated.toLocaleString()}</span></div>
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl"><span className="block text-xs text-slate-500 uppercase mb-1">Flags Raised</span><span className="text-xl font-bold text-orange-500">{selectedDoctor.flaggedMedicineCount}</span></div>
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl"><span className="block text-xs text-slate-500 uppercase mb-1">Last Login</span><span className="text-sm font-medium text-slate-700 mt-1 block">{selectedDoctor.lastLoginTime}</span></div>
                   </div>
                </div>

                <div className="flex justify-end pt-6 mt-4 border-t border-slate-100">
                  <button onClick={(e) => startEdit(selectedDoctor, e)} className="px-5 py-2.5 bg-teal-50 text-teal-700 font-semibold rounded-xl hover:bg-teal-100 transition-colors flex items-center gap-2"><Edit className="w-4 h-4"/> Edit Profile</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorRecordsView;