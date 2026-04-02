import React, { useState, useEffect, useRef } from 'react';
import { Edit, Save, Search, Download, X, FileText, AlertTriangle, CheckCircle2, Plus, Pill } from 'lucide-react';
import { doctorApi } from '../../services/api';

interface TreatmentRecordsViewProps {
  highlightedRecordId?: string | null; // NEW: Optional prop to highlight a specific record
}


// Interface for the local medication state
interface MedicationEntry {
  name: string;
  frequency: string;
  duration: string;
}

const TreatmentRecordsView: React.FC<TreatmentRecordsViewProps> = ({ highlightedRecordId }) => {
  const [records, setRecords] = useState<any[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [departmentMedicines, setDepartmentMedicines] = useState<string[]>([]);
  
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // In-Viewport Notification State
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'warning' } | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportTimeframe, setExportTimeframe] = useState('this_month');
  
  // Custom Date States for Export
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Base Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    complaint: '',
    diagnosis: '',
    treatmentPrescribed: '',
    followUpDate: '',
    followUpInstruction: '',
    outcomeStatus: '',
    additionalNotes: '',
    medNotes: ''
  });

  // Medication Array State
  const [medicationsList, setMedicationsList] = useState<MedicationEntry[]>([]);

  // Current Medication Input State (before adding to list)
  const [currentMed, setCurrentMed] = useState({
    name: '',
    frequency: '',
    durationDays: ''
  });

  const patientDropdownRef = useRef<HTMLDivElement>(null);
  const medicineDropdownRef = useRef<HTMLDivElement>(null);

  const [patientQuery, setPatientQuery] = useState('');
  const [patientSuggestions, setPatientSuggestions] = useState<any[]>([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  
  const [medicineQuery, setMedicineQuery] = useState('');
  const [medicineSuggestions, setMedicineSuggestions] = useState<string[]>([]);
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [todayRes, recordsRes, medsRes] = await Promise.all([
        doctorApi.getTodayAppointments(),
        doctorApi.getTreatmentRecords(),
        doctorApi.getDepartmentMedicines()
      ]);
      if (todayRes.success) setTodayAppointments(todayRes.data);
      if (recordsRes.success) setRecords(recordsRes.data);
      if (medsRes.success) setDepartmentMedicines(medsRes.data);
    } catch (err) {
      showToast('Error loading data', 'error');
    }
  };

  useEffect(() => {
    if (highlightedRecordId && todayAppointments.length > 0) {
      // Find the record in the pending list
      const pendingRecord = todayAppointments.find(r => r._id === highlightedRecordId);
      
      if (pendingRecord) {
        handleEditClick(pendingRecord);
      }
    }
  }, [highlightedRecordId, todayAppointments]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(event.target as Node)) setShowPatientDropdown(false);
      if (medicineDropdownRef.current && !medicineDropdownRef.current.contains(event.target as Node)) setShowMedicineDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePatientSearch = (query: string) => {
    setPatientQuery(query);
    if (query.length > 0) {
      const filtered = todayAppointments.filter(appt => 
        appt.patient_id.firstName.toLowerCase().includes(query.toLowerCase()) ||
        appt.patient_id.lastName.toLowerCase().includes(query.toLowerCase()) ||
        appt.patient_id._id.toLowerCase().includes(query.toLowerCase())
      );
      setPatientSuggestions(filtered);
      setShowPatientDropdown(true);

      if (filtered.length === 0 && query.length > 2) {
        showToast("No appointment found for this patient today.", "warning");
      }
    } else {
      setPatientSuggestions([]);
      setShowPatientDropdown(false);
    }
  };

  const selectPatient = (appt: any) => {
    setSelectedRecordId(appt._id);
    setPatientQuery(`${appt.patient_id.firstName} ${appt.patient_id.lastName} (${appt.patient_id._id})`);
    setFormData(prev => ({ ...prev, complaint: appt.chiefComplaint }));
    setShowPatientDropdown(false);
  };

  const handleMedicineSearch = (query: string) => {
    setCurrentMed(prev => ({ ...prev, name: query }));
    const filtered = departmentMedicines.filter(m => m.toLowerCase().includes(query.toLowerCase()));
    setMedicineSuggestions(filtered);
    setShowMedicineDropdown(true);
  };

  const selectMedicine = (medicine: string) => {
    setCurrentMed(prev => ({ ...prev, name: medicine }));
    setShowMedicineDropdown(false);
  };

  // UPDATED: Dynamically reset outcomeStatus if a followUpDate is chosen and conflicts
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updatedData = { ...prev, [name]: value };
      
      // Auto-correct outcomeStatus if followUpDate is filled
      if (name === 'followUpDate') {
        if (value && (updatedData.outcomeStatus === 'Ongoing' || updatedData.outcomeStatus === 'Resolved')) {
          updatedData.outcomeStatus = ''; // Reset conflicting status
        }
      }
      
      return updatedData;
    });
  };

  const handleMedInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentMed(prev => ({ ...prev, [name]: value }));
  };

  const handleAddMedicine = () => {
    if (!currentMed.name.trim() || !currentMed.frequency.trim() || !currentMed.durationDays.trim()) {
      showToast("Please fill all medicine fields before adding.", "error");
      return;
    }

    const formattedDuration = currentMed.durationDays.replace(/\D/g, ''); 
    const finalDuration = formattedDuration ? `${formattedDuration} days` : '';

    const newMed: MedicationEntry = {
      name: currentMed.name,
      frequency: currentMed.frequency,
      duration: finalDuration
    };

    setMedicationsList([...medicationsList, newMed]);
    setCurrentMed({ name: '', frequency: '', durationDays: '' }); 
  };

  const handleRemoveMedicine = (index: number) => {
    const newList = [...medicationsList];
    newList.splice(index, 1);
    setMedicationsList(newList);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordId) {
      return showToast("Please select a valid patient appointment from the dropdown.", "error");
    }

    if (currentMed.name.trim() && !isEditing) {
       return showToast("You have un-added medicine data. Click 'Add Medicine' first.", "warning");
    }

    const payload = {
      ...formData,
      medications: medicationsList 
    };

    try {
      const res = await doctorApi.updateTreatmentRecord(selectedRecordId, payload);
      if (res.success) {
        showToast(isEditing ? "Record updated successfully!" : "Record saved successfully!", "success");
        loadInitialData(); 
        cancelEdit();
      } else {
        showToast(res.message || "Failed to save record", "error");
      }
    } catch (err) {
      showToast("Network error while saving record", "error");
    }
  };

  const handleEditClick = (record: any) => {
    setIsEditing(record._id);
    setSelectedRecordId(record._id);
    
    setFormData({
      date: new Date(record.visitDate).toISOString().split('T')[0],
      complaint: record.chiefComplaint || '',
      diagnosis: record.diagnosis || '',
      treatmentPrescribed: record.treatmentPrescribed || '',
      followUpDate: record.followUpDate ? new Date(record.followUpDate).toISOString().split('T')[0] : '',
      followUpInstruction: record.followUpInstruction || '',
      outcomeStatus: record.outcomeStatus || '',
      additionalNotes: record.additionalNotes || '',
      medNotes: record.medNotes || ''
    });

    setMedicationsList(record.medications || []);
    setCurrentMed({ name: '', frequency: '', durationDays: '' });

    setPatientQuery(`${record.patient_id.firstName} ${record.patient_id.lastName} (${record.patient_id._id})`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setSelectedRecordId(null);
    setPatientQuery('');
    setMedicationsList([]);
    setCurrentMed({ name: '', frequency: '', durationDays: '' });
    setFormData({
      date: new Date().toISOString().split('T')[0], complaint: '', diagnosis: '', treatmentPrescribed: '', followUpDate: '', followUpInstruction: '', outcomeStatus: '', additionalNotes: '', medNotes: ''
    });
  };

  // --- Core Export Logic ---
  const getExportData = () => {
    const now = new Date();
    let start: Date;
    let end: Date = new Date();

    if (exportTimeframe === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (exportTimeframe === 'last_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (exportTimeframe === '3_months') {
      start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    } else if (exportTimeframe === 'custom') {
      if (!customStartDate || !customEndDate) {
        showToast("Please select both start and end dates.", "warning");
        return null;
      }
      start = new Date(customStartDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);
    }

    const filteredExport = records.filter(record => {
      if (!record.diagnosis || !record.outcomeStatus) return false;

      const updated = new Date(record.updatedAt);
      return updated >= start && updated <= end;
    });

    if (filteredExport.length === 0) {
      showToast("No valid records found in this timeframe.", "warning");
      return null;
    }

    return filteredExport;
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    const exportData = getExportData();
    if (!exportData) return;

    if (format === 'excel') {
      const headers = [
        'Record ID', 'Updated At', 'Visit Date', 'Patient Name', 'Patient ID', 
        'Chief Complaint', 'Diagnosis', 'Treatment Prescribed', 'Medications', 
        'Medication Notes', 'Outcome Status', 'Follow Up Date', 'Follow Up Instructions', 'Additional Notes'
      ];
      
      const csvRows = exportData.map(r => {
        const medsString = r.medications && r.medications.length > 0 
          ? r.medications.map((m: any) => `${m.name} (${m.frequency}, ${m.duration})`).join(' | ') 
          : 'None';

        return [
          r._id,
          new Date(r.updatedAt).toLocaleDateString(),
          new Date(r.visitDate).toLocaleDateString(),
          `${r.patient_id?.firstName} ${r.patient_id?.lastName}`,
          r.patient_id?._id,
          `"${(r.chiefComplaint || '').replace(/"/g, '""')}"`,
          `"${(r.diagnosis || '').replace(/"/g, '""')}"`,
          `"${(r.treatmentPrescribed || '').replace(/"/g, '""')}"`,
          `"${medsString.replace(/"/g, '""')}"`,
          `"${(r.medNotes || '').replace(/"/g, '""')}"`,
          r.outcomeStatus,
          r.followUpDate ? new Date(r.followUpDate).toLocaleDateString() : 'N/A',
          `"${(r.followUpInstruction || '').replace(/"/g, '""')}"`,
          `"${(r.additionalNotes || '').replace(/"/g, '""')}"`
        ];
      });

      const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Treatment_Records_${exportTimeframe}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast("Excel (CSV) file downloaded successfully.", "success");
      setIsExportModalOpen(false);

    } else if (format === 'pdf') {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        showToast("Pop-up blocked. Please allow pop-ups to generate PDF.", "error");
        return;
      }

      const html = `
        <html>
          <head>
            <title>health-connect treatment-record</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; color: #334155; }
              h2 { color: #0f172a; margin-bottom: 5px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
              h3 { color: #475569; margin-top: 0; margin-bottom: 20px; font-size: 14px; font-weight: normal; }
              table { width: 100%; border-collapse: collapse; font-size: 11px; }
              th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; vertical-align: top; }
              th { background-color: #f8fafc; font-weight: bold; color: #475569; }
              .text-xs { font-size: 10px; color: #64748b; }
              .mt { margin-top: 6px; display: block; }
            </style>
          </head>
          <body>
            <h2>Health Connect</h2>
            <h3>Treatment Records Extract (${exportTimeframe.replace('_', ' ').toUpperCase()})</h3>
            <table>
              <thead>
                <tr>
                  <th width="20%">Patient Details & Dates</th>
                  <th width="25%">Clinical Assessment</th>
                  <th width="30%">Treatment & Medications</th>
                  <th width="25%">Outcome & Follow-up</th>
                </tr>
              </thead>
              <tbody>
                ${exportData.map(r => {
                  const medsString = r.medications && r.medications.length > 0 
                    ? r.medications.map((m: any) => `<li>${m.name} (${m.frequency}, ${m.duration})</li>`).join('') 
                    : '<li>None</li>';

                  return `
                  <tr>
                    <td>
                      <strong>${r.patient_id?.firstName} ${r.patient_id?.lastName}</strong><br/>
                      <span class="text-xs">${r.patient_id?._id}</span>
                      <span class="text-xs mt"><strong>Visit:</strong> ${new Date(r.visitDate).toLocaleDateString()}</span>
                      <span class="text-xs"><strong>Updated:</strong> ${new Date(r.updatedAt).toLocaleString()}</span>
                    </td>
                    <td>
                      <strong>Complaint:</strong> ${r.chiefComplaint}<br/>
                      <span class="mt"><strong>Diagnosis:</strong> ${r.diagnosis}</span>
                      <span class="mt"><strong>Addl Notes:</strong> ${r.additionalNotes || 'N/A'}</span>
                    </td>
                    <td>
                      <strong>Plan:</strong> ${r.treatmentPrescribed}
                      <span class="mt"><strong>Meds:</strong></span>
                      <ul style="margin: 2px 0 2px 15px; padding: 0;">${medsString}</ul>
                      <span class="mt"><strong>Med Notes:</strong> ${r.medNotes || 'N/A'}</span>
                    </td>
                    <td>
                      <strong>Status:</strong> ${r.outcomeStatus}<br/>
                      <span class="mt"><strong>Follow-up:</strong> ${r.followUpDate ? new Date(r.followUpDate).toLocaleDateString() : 'None'}</span>
                      <span class="mt"><strong>Instructions:</strong> ${r.followUpInstruction || 'N/A'}</span>
                    </td>
                  </tr>
                `}).join('')}
              </tbody>
            </table>
            <script>
              window.onload = () => {
                window.print();
                setTimeout(() => window.close(), 500); 
              }
            </script>
          </body>
        </html>
      `;
      
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      setIsExportModalOpen(false);
    }
  };

  const filteredRecords = records.filter(record => {
    const pName = `${record.patient_id?.firstName} ${record.patient_id?.lastName}`.toLowerCase();
    const diag = (record.diagnosis || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return pName.includes(query) || diag.includes(query);
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-top-4 ${
          toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 
          toast.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
          'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          <span className="font-semibold">{toast.message}</span>
        </div>
      )}

      {/* FORM SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative z-20">
        <div className={`px-6 py-4 border-b flex justify-between items-center ${isEditing ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
          <h2 className={`text-lg font-bold ${isEditing ? 'text-amber-800' : 'text-slate-800'}`}>
            {isEditing ? 'Edit Treatment Record' : 'Complete Treatment Record'}
          </h2>
          {isEditing && (
            <span className="text-xs font-bold uppercase tracking-wider bg-amber-200 text-amber-800 px-3 py-1 rounded-full">Editing Mode</span>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 lg:p-8 space-y-8">
          
          {/* Section 1: Clinical Assessment */}
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Clinical Assessment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Date</label>
                <input required type="date" name="date" value={formData.date} disabled className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm cursor-not-allowed" />
              </div>
              
              <div className="space-y-2 relative" ref={patientDropdownRef}>
                <label className="text-sm font-semibold text-slate-700">Patient Name</label>
                <input 
                  required 
                  type="text" 
                  value={patientQuery}
                  onChange={(e) => handlePatientSearch(e.target.value)}
                  onFocus={() => { if(patientSuggestions.length > 0) setShowPatientDropdown(true) }}
                  disabled={isEditing !== null}
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${isEditing ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200'}`} 
                  placeholder="Search today's appointments..." 
                />
                {showPatientDropdown && patientSuggestions.length > 0 && (
                  <ul className="absolute z-30 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto mt-1">
                    {patientSuggestions.map((appt) => (
                      <li 
                        key={appt._id} 
                        onClick={() => selectPatient(appt)}
                        className="px-4 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center"
                      >
                        <span className="font-semibold text-slate-800">{appt.patient_id.firstName} {appt.patient_id.lastName}</span>
                        <span className="text-xs text-slate-500 font-mono">{appt.patient_id._id}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Patient Complaint (Auto-fetched)</label>
                <textarea required name="complaint" rows={2} value={formData.complaint} onChange={handleInputChange} disabled className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm resize-none cursor-not-allowed" placeholder="Select a patient to load their complaint..."></textarea>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Diagnosis</label>
                <input required type="text" name="diagnosis" value={formData.diagnosis} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Primary diagnosis..." />
              </div>
            </div>
          </div>

          {/* Section 2: Treatment & Medication */}
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Treatment & Medication Prescribed</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="space-y-2 md:col-span-12 mb-2">
                <label className="text-sm font-semibold text-slate-700">General Treatment Plan</label>
                <textarea required name="treatmentPrescribed" rows={2} value={formData.treatmentPrescribed} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none" placeholder="Dietary restrictions, physical therapy, etc..."></textarea>
              </div>
              
              {/* Dynamic Medication Input Block */}
              <div className="space-y-2 relative md:col-span-4" ref={medicineDropdownRef}>
                <label className="text-sm font-semibold text-slate-700">Medicine Name</label>
                <input 
                  type="text" 
                  name="name"
                  value={currentMed.name}
                  onChange={(e) => handleMedicineSearch(e.target.value)}
                  onFocus={() => { 
                    setMedicineSuggestions(departmentMedicines);
                    setShowMedicineDropdown(true);
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" 
                  placeholder="e.g. Amoxicillin 500mg" 
                />
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

              <div className="space-y-2 md:col-span-4">
                <label className="text-sm font-semibold text-slate-700">Frequency</label>
                <input type="text" name="frequency" value={currentMed.frequency} onChange={handleMedInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="e.g. Twice a day" />
              </div>
              
              <div className="space-y-2 md:col-span-3">
                <label className="text-sm font-semibold text-slate-700">Duration</label>
                <div className="relative">
                  <input type="number" min="1" name="durationDays" value={currentMed.durationDays} onChange={handleMedInputChange} className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="e.g. 5" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">Days</span>
                </div>
              </div>

              <div className="md:col-span-1 flex items-end pb-0.5">
                <button 
                  type="button" 
                  onClick={handleAddMedicine}
                  className="w-full h-[42px] flex items-center justify-center bg-teal-50 text-teal-700 hover:bg-teal-100 hover:text-teal-800 border border-teal-200 rounded-xl transition-colors"
                  title="Add Medicine"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Display Added Medications */}
              {medicationsList.length > 0 && (
                <div className="md:col-span-12 mt-4 mb-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Prescribed Medications</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {medicationsList.map((med, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white border border-blue-100 shadow-sm rounded-xl">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                            <Pill className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{med.name}</p>
                            <p className="text-xs font-medium text-slate-500">{med.frequency} • {med.duration}</p>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveMedicine(index)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2 md:col-span-12">
                <label className="text-sm font-semibold text-slate-700">Medication Notes</label>
                <input type="text" name="medNotes" value={formData.medNotes} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Optional warnings or instructions..." />
              </div>
            </div>
          </div>

          {/* Section 3: Follow-up & Outcomes */}
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Follow-up & Resolution</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Follow-up Date</label>
                <input type="date" name="followUpDate" value={formData.followUpDate} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Outcome Status</label>
                <select required name="outcomeStatus" value={formData.outcomeStatus} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none cursor-pointer">
                  <option value="" disabled>Select Outcome Status</option>
                  {!formData.followUpDate && <option value="Ongoing">Ongoing</option>}
                  {!formData.followUpDate && <option value="Resolved">Resolved</option>}
                  <option value="Referred">Referred</option>
                  <option value="Follow up required">Follow up required</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Follow-up Instructions</label>
                <input type="text" name="followUpInstruction" value={formData.followUpInstruction} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="What to test or check next visit..." />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Additional Clinic Notes (Optional)</label>
                <textarea name="additionalNotes" rows={2} value={formData.additionalNotes} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none" placeholder="Private internal notes..."></textarea>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            {isEditing && (
              <button type="button" onClick={cancelEdit} className="px-6 py-3 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                Cancel
              </button>
            )}
            <button type="submit" className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-white transition-all shadow-lg ${isEditing ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}>
              <Save className="w-5 h-5" />
              {isEditing ? 'Update Record' : 'Save Record'}
            </button>
          </div>

        </form>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative z-10">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <h3 className="font-bold text-slate-800">Recent Treatment Records</h3>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search patient or diagnosis..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" 
              />
            </div>
            <button 
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-blue-700 rounded-lg font-semibold shadow-sm transition-all text-sm shrink-0"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-semibold text-slate-700">Date</th>
                <th className="px-6 py-3 font-semibold text-slate-700">Patient</th>
                <th className="px-6 py-3 font-semibold text-slate-700">Diagnosis</th>
                <th className="px-6 py-3 font-semibold text-slate-700">Status</th>
                <th className="px-6 py-3 font-semibold text-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    {searchQuery ? "No records match your search." : "No records found. Complete one above."}
                  </td>
                </tr>
              ) : filteredRecords.map((record) => (
                <tr key={record._id} className={`hover:bg-slate-50/80 transition-colors ${isEditing === record._id ? 'bg-amber-50/50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-900">
                    {new Date(record.visitDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-800">{record.patient_id?.firstName} {record.patient_id?.lastName}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate" title={record.diagnosis}>{record.diagnosis}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold border ${
                      record.outcomeStatus === 'Resolved' ? 'bg-green-50 text-green-700 border-green-200' :
                      record.outcomeStatus === 'Ongoing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      record.outcomeStatus === 'Referred' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      'bg-orange-50 text-orange-700 border-orange-200'
                    }`}>
                      {record.outcomeStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleEditClick(record)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors shadow-sm"
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

      {/* Export Popover Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsExportModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Download className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Export Records</h3>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-sm font-semibold text-slate-700">Select Timeframe</p>
              <div className="space-y-2">
                {[
                  { id: 'this_month', label: 'This Month' },
                  { id: 'last_month', label: 'Last Month' },
                  { id: '3_months', label: 'Last 3 Months' },
                  { id: 'custom', label: 'Custom Range...' }
                ].map((option) => (
                  <label key={option.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input 
                      type="radio" 
                      name="exportTimeframe" 
                      value={option.id}
                      checked={exportTimeframe === option.id}
                      onChange={(e) => setExportTimeframe(e.target.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-800 font-medium">{option.label}</span>
                  </label>
                ))}
              </div>
              
              {exportTimeframe === 'custom' && (
                <div className="flex gap-2 pt-2 animate-in fade-in">
                  <input 
                    type="date" 
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500" 
                  />
                  <input 
                    type="date" 
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 mt-4">
              <button 
                onClick={() => handleExport('excel')}
                className="flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 font-semibold py-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 text-sm"
              >
                <FileText className="w-4 h-4" />
                Excel
              </button>
              <button 
                onClick={() => handleExport('pdf')}
                className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-semibold py-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 text-sm"
              >
                <FileText className="w-4 h-4" />
                PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreatmentRecordsView;