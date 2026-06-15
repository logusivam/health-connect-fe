import React, { useState, useEffect } from 'react';
import { Edit, Trash2, X, Ban, CheckCircle2, Save, AlertTriangle, AlertCircle } from 'lucide-react';
import { adminApi } from '../../services/api';
import PageHeader from './PageHeader';

const UnsuitableMedicineAdminView: React.FC = () => {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Toast and Modal State
  const [toastMsg, setToastMsg] = useState<{msg: string, type: 'success'|'error'|'warning'} | null>(null);
  const [selectedMed, setSelectedMed] = useState<any | null>(null);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [deleteState, setDeleteState] = useState<{ id: string, step: number } | null>(null);

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    setIsLoading(true);
    const res = await adminApi.getAllFlags();
    if (res.success) {
      setMedicines(res.data);
    }
    setIsLoading(false);
  };

  const showToast = (msg: string, type: 'success'|'error'|'warning' = 'success') => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleRowClick = (med: any) => {
    setSelectedMed(med);
    setIsEditingMode(false);
  };

  const startEdit = (med: any, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedMed(med);
    // Only flag_type and severity are editable
    setEditForm({
      flag_type: med.flag_type,
      severity: med.severity
    });
    setIsEditingMode(true);
  };

  const cancelEdit = () => {
    setSelectedMed(null);
    setIsEditingMode(false);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const res = await adminApi.updateFlag(selectedMed._id, editForm);
    
    if (res.success) {
      if (res.data.flag_type === 'Suit') {
        // If changed to suitable, remove it from this "Unsuitable" list view
        setMedicines(prev => prev.filter(m => m._id !== selectedMed._id));
        cancelEdit();
        showToast('Flag status updated. Removed from unsuitable registry.');
      } else {
        // Update local state directly
        setMedicines(prev => prev.map(m => m._id === selectedMed._id ? res.data : m));
        setSelectedMed(res.data);
        setIsEditingMode(false);
        showToast('Medication flag updated successfully.');
      }
    } else {
      showToast(res.message || 'Failed to update flag.', 'error');
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
    const res = await adminApi.deleteFlag(deleteState.id);
    
    if (res.success) {
      setMedicines(prev => prev.filter(m => m._id !== deleteState.id));
      showToast('Medication flag securely deleted.');
      if (selectedMed?._id === deleteState.id) cancelEdit();
    } else {
      showToast('Failed to delete flag.', 'error');
    }
    setDeleteState(null);
  };

  if (isLoading) return <div className="text-center py-20 text-slate-500">Loading registry...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 relative">
      
      {/* Global Toast */}
      {toastMsg && (
        <div className={`fixed top-24 right-8 z-[100] px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-10 fade-in duration-300 text-white ${toastMsg.type === 'error' ? 'bg-red-600' : toastMsg.type === 'warning' ? 'bg-amber-600' : 'bg-slate-900'}`}>
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">{toastMsg.msg}</p>
        </div>
      )}

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
              {medicines.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">No active unsuitable medicine flags.</td>
                </tr>
              ) : medicines.map(m => (
                <tr key={m._id} onClick={() => handleRowClick(m)} className="hover:bg-slate-50 cursor-pointer transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{m.medicine_name}</p>
                    {m.flag_type === 'Unsuit' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-100"><Ban className="w-3 h-3" /> Unsuitable</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100"><CheckCircle2 className="w-3 h-3" /> Suitable</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-800">{m.patient_id?.firstName} {m.patient_id?.lastName}</p>
                    <p className="text-xs text-slate-500 font-mono">{m.patient_id?._id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-600 truncate max-w-[200px]" title={m.reason}>{m.reason}</p>
                    <p className={`text-xs font-bold mt-1 ${m.severity === 'Severe' ? 'text-red-500' : m.severity === 'Moderate' ? 'text-orange-500' : 'text-amber-500'}`}>{m.severity}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <p className="font-medium">Dr. {m.flagged_by_doctor_id?.firstName} {m.flagged_by_doctor_id?.lastName}</p>
                    <p className="text-xs text-slate-400">{new Date(m.flagged_at).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={(e) => startEdit(m, e)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={(e) => initiateDelete(m._id, e)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[80] p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 my-8">
            <button onClick={cancelEdit} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
            
            {isEditingMode ? (
              <form onSubmit={saveEdit}>
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Edit className="w-5 h-5" /></div>
                  <h3 className="text-xl font-bold text-slate-900">Edit Medication Flag</h3>
                </div>

                <div className="space-y-4 text-sm mb-6">
                  {/* Non-Editable Info Displayed for Context */}
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-slate-500 uppercase">Medicine</span>
                      <span className="font-bold text-slate-900">{selectedMed.medicine_name}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-slate-500 uppercase">Patient</span>
                      <span className="font-medium text-slate-700">{selectedMed.patient_id?.firstName} {selectedMed.patient_id?.lastName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500 uppercase">Reason</span>
                      <span className="font-medium text-slate-700 truncate max-w-[250px]">{selectedMed.reason}</span>
                    </div>
                  </div>

                  {/* Editable Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Flag Status</label>
                      <select required value={editForm.flag_type} onChange={e => setEditForm({...editForm, flag_type: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                        <option value="Unsuit">Unsuitable</option>
                        <option value="Suit">Suitable</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">Severity</label>
                      <select required value={editForm.severity} onChange={e => setEditForm({...editForm, severity: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                        <option value="Mild">Mild</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Severe">Severe</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={cancelEdit} className="px-5 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"><Save className="w-4 h-4"/> Save Changes</button>
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
                     <span className="text-slate-500 text-xs font-bold uppercase block mb-1">Medicine Name & Status</span>
                     <div className="flex items-center gap-3">
                       <span className="font-bold text-xl text-slate-900">{selectedMed.medicine_name}</span>
                       {selectedMed.flag_type === 'Unsuit' ? (
                          <span className="inline-flex items-center gap-1 text-xs uppercase tracking-wider font-bold bg-red-50 text-red-700 px-2.5 py-1 rounded-md border border-red-100"><Ban className="w-3 h-3" /> Unsuitable</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs uppercase tracking-wider font-bold bg-green-50 text-green-700 px-2.5 py-1 rounded-md border border-green-100"><CheckCircle2 className="w-3 h-3" /> Suitable</span>
                        )}
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl"><span className="text-slate-500 text-xs font-bold uppercase block mb-1">Patient</span><span className="font-bold block text-slate-800 text-base">{selectedMed.patient_id?.firstName} {selectedMed.patient_id?.lastName}</span><span className="text-xs font-mono text-slate-500">{selectedMed.patient_id?._id}</span></div>
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl"><span className="text-slate-500 text-xs font-bold uppercase block mb-1">Flagged By</span><span className="font-bold block text-slate-800 text-base">Dr. {selectedMed.flagged_by_doctor_id?.firstName} {selectedMed.flagged_by_doctor_id?.lastName}</span><span className="text-xs font-mono text-slate-500">{selectedMed.flagged_by_doctor_id?._id}</span></div>
                   </div>
                   <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                     <div>
                       <span className="text-slate-500 text-xs font-bold uppercase block mb-1">Severity Indicator</span>
                       <span className={`font-bold text-lg ${selectedMed.severity === 'Severe' ? 'text-red-600' : selectedMed.severity === 'Moderate' ? 'text-orange-500' : 'text-amber-500'}`}>{selectedMed.severity}</span>
                     </div>
                     <div className="text-right">
                       <span className="text-slate-500 text-xs font-bold uppercase block mb-1">Date Flagged</span>
                       <span className="font-semibold text-slate-800">{new Date(selectedMed.flagged_at).toLocaleDateString()}</span>
                     </div>
                   </div>
                   <div><span className="text-slate-500 text-xs font-bold uppercase block mb-2">Clinical Reason</span><p className="p-4 bg-red-50/30 border border-red-100 text-slate-800 rounded-xl leading-relaxed">{selectedMed.reason}</p></div>
                </div>

                <div className="flex justify-end pt-6 mt-4 border-t border-slate-100">
                  <button onClick={(e) => startEdit(selectedMed, e)} className="px-5 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2 border border-slate-200"><Edit className="w-4 h-4"/> Edit Flag</button>
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
                {deleteState.step === 1 ? 'Delete Medical Flag?' : 'Final Confirmation'}
              </h3>
              <p className="text-slate-500 leading-relaxed px-2">
                {deleteState.step === 1 
                  ? "This will permanently remove the medication restriction warning from the patient's file. Are you absolutely sure?" 
                  : "This action cannot be undone. Confirm deletion?"}
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

export default UnsuitableMedicineAdminView;