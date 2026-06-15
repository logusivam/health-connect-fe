import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Save, Ban, CheckCircle2, Edit, Search } from 'lucide-react';
import { doctorApi } from '../../services/api';

const MedicationFlagView: React.FC = () => {
  // Global States
  const [flags, setFlags] = useState<any[]>([]);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [departmentMedicines, setDepartmentMedicines] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);

  // In-Viewport Notification State
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    medicineName: '',
    flag: '',
    reason: '',
    date: new Date().toISOString().split('T')[0],
    severity: ''
  });

  // Autocomplete UI States & Refs for Click-Outside
  const patientDropdownRef = useRef<HTMLDivElement>(null);
  const medicineDropdownRef = useRef<HTMLDivElement>(null);

  const [patientQuery, setPatientQuery] = useState('');
  const [patientSuggestions, setPatientSuggestions] = useState<any[]>([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  
  const [medicineQuery, setMedicineQuery] = useState('');
  const [medicineSuggestions, setMedicineSuggestions] = useState<string[]>([]);
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);

  // Custom Toast Function
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Load Initial Data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [profileRes, medsRes, flagsRes] = await Promise.all([
        doctorApi.getProfile(),
        doctorApi.getDepartmentMedicines(),
        doctorApi.getFlags()
      ]);

      if (profileRes.success) setDoctorProfile(profileRes.data);
      if (medsRes.success) setDepartmentMedicines(medsRes.data);
      if (flagsRes.success) setFlags(flagsRes.data);
    } catch (err) {
      showToast('Error loading data from server.', 'error');
    }
  };

  // --- Click Outside to Close Dropdowns ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(event.target as Node)) {
        setShowPatientDropdown(false);
      }
      if (medicineDropdownRef.current && !medicineDropdownRef.current.contains(event.target as Node)) {
        setShowMedicineDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Patient Autocomplete Logic ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (patientQuery.length > 1 && showPatientDropdown) {
        const res = await doctorApi.searchPatients(patientQuery);
        if (res.success) {
          setPatientSuggestions(res.data);
        }
      } else {
        setPatientSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [patientQuery, showPatientDropdown]);

  const selectPatient = (patient: any) => {
    setFormData(prev => ({
      ...prev,
      patientId: patient._id,
      patientName: `${patient.firstName} ${patient.lastName}`
    }));
    setPatientQuery(`${patient._id} - ${patient.firstName} ${patient.lastName}`);
    setShowPatientDropdown(false);
  };

  // --- Medicine Autocomplete Logic ---
  useEffect(() => {
    const filtered = departmentMedicines.filter(m => m.toLowerCase().includes(medicineQuery.toLowerCase()));
    setMedicineSuggestions(filtered);
  }, [medicineQuery, departmentMedicines]);

  const selectMedicine = (medicine: string) => {
    setFormData(prev => ({ ...prev, medicineName: medicine }));
    setMedicineQuery(medicine);
    setShowMedicineDropdown(false);
  };

  // --- Form Handling ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId) return showToast("Please select a valid patient from the search suggestions.", "error");
    if (!formData.medicineName) return showToast("Please select a medicine.", "error");

    const payload = {
      patient_id: formData.patientId,
      medicine_name: formData.medicineName,
      reason: formData.reason,
      severity: formData.severity,
      flagged_at: formData.date,
      flag_type: formData.flag
    };

    try {
      let res;
      if (isEditing) {
        res = await doctorApi.updateFlag(isEditing, payload);
      } else {
        res = await doctorApi.createFlag(payload);
      }

      if (res.success) {
        showToast(isEditing ? "Flag updated successfully!" : "Medicine flagged successfully!", "success");
        loadInitialData(); // Refresh table
        cancelEdit();
      } else {
        showToast(res.message || "Failed to save flag", "error");
      }
    } catch (err) {
      showToast("Network error saving flag", "error");
    }
  };

  const handleEditClick = (flag: any) => {
    setIsEditing(flag._id);
    setFormData({
      patientId: flag.patient_id._id,
      patientName: `${flag.patient_id.firstName} ${flag.patient_id.lastName}`,
      medicineName: flag.medicine_name,
      flag: flag.flag_type,
      reason: flag.reason,
      date: new Date(flag.flagged_at).toISOString().split('T')[0],
      severity: flag.severity
    });
    setPatientQuery(`${flag.patient_id._id} - ${flag.patient_id.firstName} ${flag.patient_id.lastName}`);
    setMedicineQuery(flag.medicine_name);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setFormData({ patientId: '', patientName: '', medicineName: '', flag: 'Unsuit', reason: '', date: new Date().toISOString().split('T')[0], severity: 'Moderate' });
    setPatientQuery('');
    setMedicineQuery('');
  };

  const activeFlags = flags.filter(f => f.is_active);
  const resolvedFlags = flags.filter(f => !f.is_active);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      {/* IN-VIEWPORT TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-top-4 ${
          toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          <span className="font-semibold">{toast.message}</span>
        </div>
      )}

      {/* FORM SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative z-20">
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
            
            {/* Autocomplete Patient Search */}
            <div className="space-y-2 relative md:col-span-2 lg:col-span-1" ref={patientDropdownRef}>
              <label className="text-sm font-semibold text-slate-700">Patient Search (ID or Name)</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  value={patientQuery}
                  onChange={(e) => {
                    setPatientQuery(e.target.value);
                    setShowPatientDropdown(true);
                    if (e.target.value === '') {
                      setFormData(prev => ({ ...prev, patientId: '', patientName: '' }));
                    }
                  }}
                  onFocus={() => { if(patientSuggestions.length > 0) setShowPatientDropdown(true) }}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm" 
                  placeholder="Type ID or Name to search..." 
                />
              </div>
              {/* Dropdown Results */}
              {showPatientDropdown && patientSuggestions.length > 0 && (
                <ul className="absolute z-30 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto mt-1">
                  {patientSuggestions.map((p) => (
                    <li 
                      key={p._id} 
                      onClick={() => selectPatient(p)}
                      className="px-4 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center"
                    >
                      <span className="font-semibold text-slate-800">{p.firstName} {p.lastName}</span>
                      <span className="text-xs text-slate-500 font-mono">{p._id}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            {/* Autocomplete Medicine Search */}
            <div className="space-y-2 relative md:col-span-2 lg:col-span-1" ref={medicineDropdownRef}>
              <label className="text-sm font-semibold text-slate-700">Medicine Name</label>
              <input 
                type="text" 
                value={medicineQuery}
                onChange={(e) => {
                  setMedicineQuery(e.target.value);
                  setFormData(prev => ({ ...prev, medicineName: e.target.value }));
                  setShowMedicineDropdown(true);
                }}
                onFocus={() => setShowMedicineDropdown(true)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm" 
                placeholder="Type to filter medicines..." 
              />
              {/* Dropdown Results */}
              {showMedicineDropdown && medicineSuggestions.length > 0 && (
                <ul className="absolute z-30 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto mt-1">
                  {medicineSuggestions.map((m) => (
                    <li 
                      key={m} 
                      onClick={() => selectMedicine(m)}
                      className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm font-medium text-slate-800 border-b border-slate-50 last:border-0"
                    >
                      {m}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Flag Type</label>
              <select name="flag" value={formData.flag} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm appearance-none cursor-pointer">
                <option value="" disabled> Select Flag Type </option>
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
                <option value="" disabled> Select Severity Level </option>
                <option value="Mild">Mild (e.g., slight nausea)</option>
                <option value="Moderate">Moderate (e.g., rash, dizziness)</option>
                <option value="Severe">Severe (e.g., anaphylaxis, extreme interaction)</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-700">Reason / Clinical Notes</label>
                <span className={`text-xs font-medium ${formData.reason.length >= 1000 ? 'text-red-500' : 'text-slate-400'}`}>
                  {formData.reason.length} / 1000
                </span>
              </div>
              <textarea 
                required 
                name="reason" 
                rows={3} 
                maxLength={1000}
                value={formData.reason} 
                onChange={handleInputChange} 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm resize-none" 
                placeholder="Detailed clinical reason for this flag..."
              />
            </div>

            {/* Read-only Doctor Context */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-400">Flagged By (Auto-filled)</label>
              <input 
                type="text" 
                disabled 
                value={doctorProfile ? `Dr. ${doctorProfile.firstName} ${doctorProfile.lastName} (${doctorProfile._id})` : 'Loading...'} 
                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm cursor-not-allowed" 
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            {isEditing && (
              <button type="button" onClick={cancelEdit} className="px-6 py-3 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                Cancel
              </button>
            )}
            <button type="submit" disabled={!formData.patientId} className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-white transition-all shadow-lg ${!formData.patientId ? 'bg-slate-400 cursor-not-allowed' : isEditing ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}`}>
              <Save className="w-5 h-5" />
              {isEditing ? 'Update Flag' : 'Save Flag'}
            </button>
          </div>
        </form>
      </div>

      {/* ACTIVE FLAGS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative z-10">
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
              {activeFlags.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No active flags.</td></tr>
              ) : activeFlags.map((flag) => (
                <tr key={flag._id} className={`hover:bg-slate-50/80 transition-colors ${isEditing === flag._id ? 'bg-amber-50/50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-bold text-slate-900">{flag.medicine_name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700"><Ban className="w-3 h-3"/> Unsuitable</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-medium text-slate-800">{flag.patient_id?.firstName} {flag.patient_id?.lastName}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{flag.patient_id?._id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-600 line-clamp-2" title={flag.reason}>{flag.reason}</p>
                    <p className={`text-xs font-semibold mt-1 ${flag.severity === 'Severe' ? 'text-red-600' : flag.severity === 'Moderate' ? 'text-orange-500' : 'text-amber-500'}`}>
                      Severity: {flag.severity}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">{new Date(flag.flagged_at).toLocaleDateString()}</td>
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

      {/* RESOLVED FLAGS TABLE */}
      {resolvedFlags.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative z-10">
          <div className="px-6 py-5 border-b border-slate-100 bg-green-50/50 flex justify-between items-center">
            <h3 className="font-bold text-green-800">Resolved Flags (Suitable)</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-semibold text-slate-700">Medicine & Flag</th>
                  <th className="px-6 py-3 font-semibold text-slate-700">Patient</th>
                  <th className="px-6 py-3 font-semibold text-slate-700">Reason & Severity</th>
                  <th className="px-6 py-3 font-semibold text-slate-700">Date Cleared</th>
                  <th className="px-6 py-3 font-semibold text-slate-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resolvedFlags.map((flag) => (
                  <tr key={flag._id} className={`hover:bg-slate-50/80 transition-colors ${isEditing === flag._id ? 'bg-amber-50/50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-bold text-slate-900 line-through decoration-slate-300">{flag.medicine_name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3"/> Suitable</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-medium text-slate-800">{flag.patient_id?.firstName} {flag.patient_id?.lastName}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{flag.patient_id?._id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-600 line-clamp-2" title={flag.reason}>{flag.reason}</p>
                      <p className={`text-xs font-semibold mt-1 ${flag.severity === 'Severe' ? 'text-red-600' : flag.severity === 'Moderate' ? 'text-orange-500' : 'text-amber-500'}`}>
                        Severity: {flag.severity}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {flag.removed_at ? new Date(flag.removed_at).toLocaleDateString() : 'Unknown'}
                    </td>
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
      )}

    </div>
  );
};

export default MedicationFlagView;