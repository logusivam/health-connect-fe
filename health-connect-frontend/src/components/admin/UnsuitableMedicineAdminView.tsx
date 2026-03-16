import React, { useState } from 'react';
import { Edit, Trash2, X, Ban, CheckCircle2, Save, AlertTriangle } from 'lucide-react';
import type { UnsuitableMedicineRecord } from '../../types/admin.types';
import { mockMedicines } from '../../data/mockAdminData';
import PageHeader from './PageHeader';

const UnsuitableMedicineAdminView: React.FC = () => {
  const [medicines, setMedicines] = useState(mockMedicines);
  
  // Popover State
  const [selectedMed, setSelectedMed] = useState<UnsuitableMedicineRecord | null>(null);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UnsuitableMedicineRecord>>({});

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if(window.confirm("Are you sure you want to delete this medication flag?")) {
      setMedicines(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleRowClick = (med: UnsuitableMedicineRecord) => {
    setSelectedMed(med);
    setIsEditingMode(false);
  };

  const startEdit = (med: UnsuitableMedicineRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedMed(med);
    setEditForm(med);
    setIsEditingMode(true);
  };

  const cancelEdit = () => {
    setSelectedMed(null);
    setIsEditingMode(false);
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setMedicines(prev => prev.map(m => m.id === selectedMed?.id ? { ...m, ...editForm } as UnsuitableMedicineRecord : m));
    setSelectedMed(null);
    setIsEditingMode(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <PageHeader title="Unsuitable Medicine Registry" description="Global tracking of patient medication allergies and contraindications." />
      
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold w-1/4">Medicine & Flag</th>
                <th className="px-6 py-4 font-semibold w-1/5">Patient details</th>
                <th className="px-6 py-4 font-semibold flex-1">Reason</th>
                <th className="px-6 py-4 font-semibold w-1/6">Flagged By</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {medicines.map(m => (
                <tr key={m.id} onClick={() => handleRowClick(m)} className="hover:bg-slate-50 cursor-pointer transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{m.medicineName}</p>
                    {m.flag === 'Unsuit' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-100"><Ban className="w-3 h-3" /> Unsuitable</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100"><CheckCircle2 className="w-3 h-3" /> Suitable</span>
                    )}
                  </td>
                  <td className="px-6 py-4"><p className="font-medium text-slate-800">{m.patientName}</p><p className="text-xs text-slate-500 font-mono">{m.patientId}</p></td>
                  <td className="px-6 py-4"><p className="text-slate-600 truncate max-w-[200px]" title={m.reason}>{m.reason}</p><p className={`text-xs font-bold mt-1 ${m.severity === 'Severe' ? 'text-red-500' : m.severity === 'Moderate' ? 'text-orange-500' : 'text-amber-500'}`}>{m.severity}</p></td>
                  <td className="px-6 py-4 text-slate-600"><p className="font-medium">{m.flaggedBy}</p><p className="text-xs text-slate-400">{m.date}</p></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={(e) => startEdit(m, e)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={(e) => handleDelete(m.id, e)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail & Edit Popover */}
      {selectedMed && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 my-8">
            <button onClick={cancelEdit} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
            
            {isEditingMode ? (
              <form onSubmit={saveEdit}>
                <div className="flex items-center gap-3 mb-6 border-b pb-4">
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Edit className="w-5 h-5" /></div>
                  <h3 className="text-xl font-bold text-slate-900">Edit Medication Flag</h3>
                </div>

                <div className="space-y-4 text-sm mb-6">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Medicine Name</label>
                    <input required type="text" value={editForm.medicineName || ''} onChange={e => setEditForm({...editForm, medicineName: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Flag Status</label>
                      <select value={editForm.flag || ''} onChange={e => setEditForm({...editForm, flag: e.target.value as 'Unsuit'|'Suit'})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="Unsuit">Unsuitable</option><option value="Suit">Suitable</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Severity</label>
                      <select value={editForm.severity || ''} onChange={e => setEditForm({...editForm, severity: e.target.value as 'Mild'|'Moderate'|'Severe'})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="Mild">Mild</option><option value="Moderate">Moderate</option><option value="Severe">Severe</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Patient Name</label>
                      <input required type="text" value={editForm.patientName || ''} onChange={e => setEditForm({...editForm, patientName: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Patient ID</label>
                      <input required type="text" value={editForm.patientId || ''} onChange={e => setEditForm({...editForm, patientId: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Flagged By (Doctor)</label>
                      <input required type="text" value={editForm.flaggedBy || ''} onChange={e => setEditForm({...editForm, flaggedBy: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Date Flagged</label>
                      <input required type="date" value={editForm.date || ''} onChange={e => setEditForm({...editForm, date: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Clinical Reason</label>
                    <textarea required rows={3} value={editForm.reason || ''} onChange={e => setEditForm({...editForm, reason: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={cancelEdit} className="px-5 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"><Save className="w-4 h-4"/> Save Changes</button>
                </div>
              </form>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                   <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><AlertTriangle className="w-5 h-5" /></div>
                   <h3 className="text-xl font-bold text-slate-900">Medication Flag Details</h3>
                </div>
                <div className="space-y-5 text-sm">
                   <div>
                     <span className="text-slate-500 text-xs uppercase block mb-1">Medicine Name & Status</span>
                     <div className="flex items-center gap-3">
                       <span className="font-bold text-xl text-slate-900">{selectedMed.medicineName}</span>
                       {selectedMed.flag === 'Unsuit' ? (
                          <span className="inline-flex items-center gap-1 text-xs uppercase tracking-wider font-bold bg-red-50 text-red-700 px-2.5 py-1 rounded-md border border-red-100"><Ban className="w-3 h-3" /> Unsuitable</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs uppercase tracking-wider font-bold bg-green-50 text-green-700 px-2.5 py-1 rounded-md border border-green-100"><CheckCircle2 className="w-3 h-3" /> Suitable</span>
                        )}
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl"><span className="text-slate-500 text-xs uppercase block mb-1">Patient</span><span className="font-bold block text-slate-800 text-base">{selectedMed.patientName}</span><span className="text-xs font-mono text-slate-500">{selectedMed.patientId}</span></div>
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl"><span className="text-slate-500 text-xs uppercase block mb-1">Flagged By</span><span className="font-bold block text-slate-800 text-base">{selectedMed.flaggedBy}</span><span className="text-xs text-slate-500">{selectedMed.date}</span></div>
                   </div>
                   <div><span className="text-slate-500 text-xs uppercase block mb-1">Severity Indicator</span><span className={`font-bold text-lg ${selectedMed.severity === 'Severe' ? 'text-red-600' : selectedMed.severity === 'Moderate' ? 'text-orange-500' : 'text-amber-500'}`}>{selectedMed.severity}</span></div>
                   <div><span className="text-slate-500 text-xs uppercase block mb-1.5">Clinical Reason</span><p className="p-4 bg-red-50/30 border border-red-100 text-slate-800 rounded-xl leading-relaxed">{selectedMed.reason}</p></div>
                </div>

                <div className="flex justify-end pt-6 mt-2 border-t border-slate-100">
                  <button onClick={(e) => startEdit(selectedMed, e)} className="px-5 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2"><Edit className="w-4 h-4"/> Edit Flag</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UnsuitableMedicineAdminView;