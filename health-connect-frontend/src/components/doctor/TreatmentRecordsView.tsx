import React, { useState } from 'react';
import { Edit, Save, Search, Download, X, FileText } from 'lucide-react';
import type { TreatmentRecord } from '../../types/doctor.types';
import { initialTreatmentRecords } from '../../data/mockDoctorData';

const TreatmentRecordsView: React.FC = () => {
  const [records, setRecords] = useState<TreatmentRecord[]>(initialTreatmentRecords);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  
  // Search & Export State
  const [searchQuery, setSearchQuery] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportTimeframe, setExportTimeframe] = useState('this_month');

  // Form State
  const [formData, setFormData] = useState<Omit<TreatmentRecord, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    patientName: '',
    complaint: '',
    diagnosis: '',
    treatmentPrescribed: '',
    followUpDate: '',
    followUpInstruction: '',
    outcomeStatus: 'Ongoing',
    additionalNotes: '',
    medicineName: '',
    frequency: '',
    durationDays: '',
    medNotes: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      setRecords(records.map(r => r.id === isEditing ? { ...formData, id: isEditing } : r));
      setIsEditing(null);
    } else {
      const newRecord: TreatmentRecord = {
        ...formData,
        id: `TR-${Math.floor(Math.random() * 10000)}`
      };
      setRecords([newRecord, ...records]);
    }
    
    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0], patientName: '', complaint: '', diagnosis: '', treatmentPrescribed: '', followUpDate: '', followUpInstruction: '', outcomeStatus: 'Ongoing', additionalNotes: '', medicineName: '', frequency: '', durationDays: '', medNotes: ''
    });
    alert(isEditing ? "Record updated successfully!" : "Record created successfully!");
  };

  const handleEditClick = (record: TreatmentRecord) => {
    setIsEditing(record.id);
    setFormData({
      date: record.date, patientName: record.patientName, complaint: record.complaint, diagnosis: record.diagnosis, treatmentPrescribed: record.treatmentPrescribed, followUpDate: record.followUpDate, followUpInstruction: record.followUpInstruction, outcomeStatus: record.outcomeStatus, additionalNotes: record.additionalNotes, medicineName: record.medicineName, frequency: record.frequency, durationDays: record.durationDays, medNotes: record.medNotes
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setFormData({
      date: new Date().toISOString().split('T')[0], patientName: '', complaint: '', diagnosis: '', treatmentPrescribed: '', followUpDate: '', followUpInstruction: '', outcomeStatus: 'Ongoing', additionalNotes: '', medicineName: '', frequency: '', durationDays: '', medNotes: ''
    });
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    alert(`Downloading Treatment Records as ${format.toUpperCase()} for timeframe: ${exportTimeframe}`);
    setIsExportModalOpen(false);
  };

  // Filter records based on search query
  const filteredRecords = records.filter(record => 
    record.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* FORM SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className={`px-6 py-4 border-b flex justify-between items-center ${isEditing ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
          <h2 className={`text-lg font-bold ${isEditing ? 'text-amber-800' : 'text-slate-800'}`}>
            {isEditing ? 'Edit Treatment Record' : 'Create Treatment Record'}
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
                <input required type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Patient Name</label>
                <input required type="text" name="patientName" placeholder="e.g. John Doe" value={formData.patientName} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Patient Complaint</label>
                <textarea required name="complaint" rows={2} value={formData.complaint} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none" placeholder="Describe patient symptoms..."></textarea>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2 md:col-span-3">
                <label className="text-sm font-semibold text-slate-700">General Treatment Plan</label>
                <textarea required name="treatmentPrescribed" rows={2} value={formData.treatmentPrescribed} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none" placeholder="Dietary restrictions, physical therapy, etc..."></textarea>
              </div>
              
              {/* Specific Medicine block */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Medicine Name</label>
                <input required type="text" name="medicineName" value={formData.medicineName} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="e.g. Amoxicillin 500mg" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Frequency</label>
                <input required type="text" name="frequency" value={formData.frequency} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="e.g. Twice a day after meals" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Duration (Days)</label>
                <input required type="number" min="1" name="durationDays" value={formData.durationDays} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="e.g. 5" />
              </div>
              <div className="space-y-2 md:col-span-3">
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
                <select name="outcomeStatus" value={formData.outcomeStatus} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none cursor-pointer">
                  <option value="Ongoing">Ongoing</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Referred">Referred</option>
                  <option value="Follow up required">Follow up required</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Follow-up Instructions</label>
                <input type="text" name="followUpInstruction" value={formData.followUpInstruction} onChange={handleInputChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="What to test or check next visit..." />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-slate-700">Additional Clinic Notes</label>
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
                <th className="px-6 py-3 font-semibold text-slate-700">Date & ID</th>
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
                    {searchQuery ? "No records match your search." : "No records found. Create one above."}
                  </td>
                </tr>
              ) : filteredRecords.map((record) => (
                <tr key={record.id} className={`hover:bg-slate-50/80 transition-colors ${isEditing === record.id ? 'bg-amber-50/50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-semibold text-slate-900">{record.date}</p>
                    <p className="text-xs text-slate-500 font-mono">{record.id}</p>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">{record.patientName}</td>
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
                  <input type="date" className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500" />
                  <input type="date" className="w-1/2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500" />
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