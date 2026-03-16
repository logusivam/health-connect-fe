import React, { useState, useEffect } from 'react';
import { AlertTriangle, Save, Ban, CheckCircle2, Edit } from 'lucide-react';
import type { MedicationFlag } from '../../types/doctor.types';
import { initialFlags, mockPatientsDb, mockDoctor } from '../../data/mockDoctorData';

const MedicationFlagView: React.FC = () => {
  const [flags, setFlags] = useState<MedicationFlag[]>(initialFlags);
  const [isEditing, setIsEditing] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<MedicationFlag, 'id' | 'flaggedBy'>>({
    medicineName: '',
    flag: 'Unsuit',
    flaggedFor: '',
    patientId: '',
    reason: '',
    date: new Date().toISOString().split('T')[0],
    severity: 'Moderate'
  });

  // Auto-fetch patient name effect
  useEffect(() => {
    // Only auto-fetch if we are creating a new record OR editing but the ID changed manually
    if (formData.patientId && mockPatientsDb[formData.patientId.toUpperCase()]) {
      setFormData(prev => ({
        ...prev,
        flaggedFor: mockPatientsDb[formData.patientId.toUpperCase()]
      }));
    } else if (!isEditing) {
      setFormData(prev => ({ ...prev, flaggedFor: '' }));
    }
  }, [formData.patientId, isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.flaggedFor) {
      alert("Invalid Patient ID. Cannot find patient name.");
      return;
    }

    if (isEditing) {
      setFlags(flags.map(f => f.id === isEditing ? { 
        ...formData, 
        id: isEditing,
        patientId: formData.patientId.toUpperCase(),
        flaggedBy: `${mockDoctor.name} (${mockDoctor.id})`
      } : f));
      setIsEditing(null);
    } else {
      const newFlag: MedicationFlag = {
        ...formData,
        id: `FLG-${Math.floor(Math.random() * 1000)}`,
        patientId: formData.patientId.toUpperCase(),
        flaggedBy: `${mockDoctor.name} (${mockDoctor.id})`
      };
      setFlags([newFlag, ...flags]);
    }
    
    setFormData({ medicineName: '', flag: 'Unsuit', flaggedFor: '', patientId: '', reason: '', date: new Date().toISOString().split('T')[0], severity: 'Moderate' });
    alert(isEditing ? "Flag updated successfully!" : "Medicine flagged successfully!");
  };

  const handleEditClick = (flag: MedicationFlag) => {
    setIsEditing(flag.id);
    setFormData({
      medicineName: flag.medicineName, flag: flag.flag, flaggedFor: flag.flaggedFor, patientId: flag.patientId, reason: flag.reason, date: flag.date, severity: flag.severity
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setFormData({ medicineName: '', flag: 'Unsuit', flaggedFor: '', patientId: '', reason: '', date: new Date().toISOString().split('T')[0], severity: 'Moderate' });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* FORM SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className={`px-6 py-4 border-b flex justify-between items-center ${isEditing ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-100'}`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${isEditing ? 'text-amber-600' : 'text-red-600'}`} />
            <h2 className={`text-lg font-bold ${isEditing ? 'text-amber-800' : 'text-red-800'}`}>
              {isEditing ? 'Edit Medication Flag' : 'Flag Unsuitable Medicine'}
            </h2>
          </div>
          {isEditing && <span className="text-xs font-bold uppercase tracking-wider bg-amber-200 text-amber-800 px-3 py-1 rounded-full">Editing</span>}
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 lg:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                 <label className="text-sm font-semibold text-slate-700">Patient ID</label>
                 <span className="text-xs text-slate-400">Try PT-8842-91</span>
              </div>
              <input required type="text" name="patientId" value={formData.patientId} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-mono uppercase" placeholder="e.g. PT-1234" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Patient Name (Auto-fetched)</label>
              <input 
                required 
                type="text" 
                name="flaggedFor" 
                value={formData.flaggedFor} 
                disabled // Made non-editable
                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm cursor-not-allowed font-medium" 
                placeholder="Awaiting valid Patient ID..." 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Medicine Name</label>
              <input required type="text" name="medicineName" value={formData.medicineName} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm" placeholder="Exact medicine name..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Flag Type</label>
              <select name="flag" value={formData.flag} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm appearance-none cursor-pointer">
                <option value="Unsuit">Unsuitable / Allergic</option>
                <option value="Suit">Suitable (Override previous flag)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Date Recorded</label>
              <input required type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Severity Level</label>
              <select name="severity" value={formData.severity} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm appearance-none cursor-pointer">
                <option value="Mild">Mild (e.g., slight nausea)</option>
                <option value="Moderate">Moderate (e.g., rash, dizziness)</option>
                <option value="Severe">Severe (e.g., anaphylaxis, extreme interaction)</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Reason / Clinical Notes</label>
              <textarea required name="reason" rows={3} value={formData.reason} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm resize-none" placeholder="Detailed clinical reason for this flag..."></textarea>
            </div>

            {/* Read-only Doctor Context */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-400">Flagged By (Auto-filled)</label>
              <input type="text" disabled value={`${mockDoctor.name} (${mockDoctor.id})`} className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm cursor-not-allowed" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            {isEditing && (
              <button type="button" onClick={cancelEdit} className="px-6 py-3 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                Cancel
              </button>
            )}
            <button type="submit" disabled={!formData.flaggedFor} className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-white transition-all shadow-lg ${!formData.flaggedFor ? 'bg-slate-400 cursor-not-allowed' : isEditing ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}`}>
              <Save className="w-5 h-5" />
              {isEditing ? 'Update Flag' : 'Save Flag'}
            </button>
          </div>
        </form>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Active Flags Registry</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold text-slate-700">Medicine & Flag</th>
                <th className="px-6 py-3 font-semibold text-slate-700">Patient</th>
                <th className="px-6 py-3 font-semibold text-slate-700">Reason & Severity</th>
                <th className="px-6 py-3 font-semibold text-slate-700">Date</th>
                <th className="px-6 py-3 font-semibold text-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {flags.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">No active flags.</td>
                </tr>
              ) : flags.map((flag) => (
                <tr key={flag.id} className={`hover:bg-slate-50/80 transition-colors ${isEditing === flag.id ? 'bg-amber-50/50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-bold text-slate-900">{flag.medicineName}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {flag.flag === 'Unsuit' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700"><Ban className="w-3 h-3"/> Unsuitable</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3"/> Suitable</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-medium text-slate-800">{flag.flaggedFor}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{flag.patientId}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-600 line-clamp-2" title={flag.reason}>{flag.reason}</p>
                    <p className={`text-xs font-semibold mt-1 ${flag.severity === 'Severe' ? 'text-red-600' : flag.severity === 'Moderate' ? 'text-orange-500' : 'text-amber-500'}`}>
                      Severity: {flag.severity}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">{flag.date}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleEditClick(flag)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:border-amber-400 hover:text-amber-600 transition-colors shadow-sm"
                    >
                      <Edit className="w-4 h-4" /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default MedicationFlagView;