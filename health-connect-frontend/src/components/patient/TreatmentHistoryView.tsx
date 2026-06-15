import React, { useState, useEffect } from 'react';
import { Calendar, Pill, Download, X, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { patientApi } from '../../services/api';

interface TreatmentHistoryViewProps {
  highlightedRecordId?: string | null;
}

const TreatmentHistoryView: React.FC<TreatmentHistoryViewProps> = ({ highlightedRecordId }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportTimeframe, setExportTimeframe] = useState('all');
  
  // In-Viewport Notification State
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await patientApi.getHistory();
        if (res.success) {
          setHistory(res.data);
        }
      } catch (error) {
        showToast("Failed to load treatment history.", "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Auto-scroll to highlighted record if routed from Dashboard
  useEffect(() => {
    if (highlightedRecordId && history.length > 0) {
      setTimeout(() => {
        const el = document.getElementById(`record-${highlightedRecordId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [highlightedRecordId, history]);

  // --- Core Export Logic ---
  const getExportData = () => {
    const now = new Date();
    let start: Date;
    let end: Date = new Date();

    if (exportTimeframe === '1_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    } else if (exportTimeframe === '3_months') {
      start = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    } else if (exportTimeframe === '6_months') {
      start = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    } else {
      // 'all' time
      start = new Date(2000, 0, 1); // Arbitrary far past date
    }

    const filteredExport = history.filter(record => {
      const updated = new Date(record.updatedAt);
      return updated >= start && updated <= end;
    });

    if (filteredExport.length === 0) {
      showToast("No records found in this timeframe.", "warning");
      return null;
    }

    return filteredExport;
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    const exportData = getExportData();
    if (!exportData) return;

    if (format === 'excel') {
      // Native CSV Export
      const headers = [
        'Record ID', 'Visit Date', 'Doctor Name', 'Doctor Specialty', 
        'Diagnosis', 'Treatment Plan', 'Medications', 'Medication Notes', 
        'Outcome Status', 'Follow Up Date', 'Follow Up Instructions', 'Additional Notes'
      ];
      
      const csvRows = exportData.map(r => {
        const medsString = r.medications && r.medications.length > 0 
          ? r.medications.map((m: any) => `${m.name} (${m.frequency}, ${m.duration})`).join(' | ') 
          : 'None';

        return [
          r._id,
          new Date(r.visitDate).toLocaleDateString(),
          `Dr. ${r.doctor_id?.firstName} ${r.doctor_id?.lastName}`,
          r.doctor_id?.specialization || 'General',
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
      link.setAttribute('download', `Medical_History_${exportTimeframe}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast("Excel (CSV) file downloaded successfully.", "success");
      setIsExportModalOpen(false);

    } else if (format === 'pdf') {
      // Native Print Window Export
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        showToast("Pop-up blocked. Please allow pop-ups to generate PDF.", "error");
        return;
      }

      const html = `
        <html>
          <head>
            <title>health-connect medical-history</title>
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
            <h3>Personal Medical History (${exportTimeframe.replace('_', ' ').toUpperCase()})</h3>
            <table>
              <thead>
                <tr>
                  <th width="20%">Doctor & Date</th>
                  <th width="25%">Diagnosis & Notes</th>
                  <th width="30%">Treatment & Prescriptions</th>
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
                      <strong>Dr. ${r.doctor_id?.firstName} ${r.doctor_id?.lastName}</strong><br/>
                      <span class="text-xs">${r.doctor_id?.specialization || 'General Practice'}</span>
                      <span class="text-xs mt"><strong>Visit Date:</strong> ${new Date(r.visitDate).toLocaleDateString()}</span>
                    </td>
                    <td>
                      <strong>${r.diagnosis}</strong>
                      <span class="mt"><strong>Addl Notes:</strong> ${r.additionalNotes || 'N/A'}</span>
                    </td>
                    <td>
                      <strong>Plan:</strong> ${r.treatmentPrescribed}
                      <span class="mt"><strong>Medications:</strong></span>
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

  if (isLoading) {
    return <div className="text-center py-20 text-slate-500">Loading your medical history...</div>;
  }

  return (
    <div className="space-y-6 relative">
      
      {/* IN-VIEWPORT TOAST NOTIFICATION */}
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

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Treatment History</h2>
          <p className="text-slate-500">Review your past diagnoses, prescriptions, and doctor notes.</p>
        </div>
        <button 
          onClick={() => setIsExportModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-blue-700 rounded-xl font-semibold shadow-sm transition-all hover:scale-105 active:scale-95 text-sm"
        >
          <Download className="w-4 h-4" />
          Export History
        </button>
      </div>

      <div className="space-y-4">
        {history.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
            <h3 className="text-lg font-bold text-slate-700 mb-2">No Medical History Found</h3>
            <p className="text-slate-500">You do not have any completed treatment records yet.</p>
          </div>
        ) : (
          history.map((record) => (
            <div 
              key={record._id} 
              id={`record-${record._id}`}
              className={`bg-white rounded-2xl border shadow-sm p-6 lg:p-8 transition-all duration-500 hover:shadow-md ${
                highlightedRecordId === record._id 
                  ? 'border-blue-400 ring-4 ring-blue-50 bg-blue-50/30 scale-[1.01]' 
                  : 'border-slate-100'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                
                {/* Meta info */}
                <div className="md:w-1/4 shrink-0 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-6">
                  <div className="inline-flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg font-semibold text-sm mb-4">
                    <Calendar className="w-4 h-4" />
                    {new Date(record.visitDate).toLocaleDateString()}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-slate-500">Attending Doctor</p>
                    <p className="font-medium text-slate-900">Dr. {record.doctor_id?.firstName} {record.doctor_id?.lastName}</p>
                    <p className="text-xs text-slate-500">{record.doctor_id?.specialization || 'General Practice'}</p>
                  </div>
                </div>

                {/* Clinical info */}
                <div className="md:w-3/4 space-y-5">
                  <div>
                    <h4 className="text-sm text-slate-500 mb-1">Diagnosis</h4>
                    <p className="text-lg font-bold text-slate-900">{record.diagnosis}</p>
                  </div>

                  {/* Dynamic Prescriptions */}
                  {record.medications && record.medications.length > 0 && (
                    <div>
                      <h4 className="text-sm text-slate-500 mb-2">Prescriptions</h4>
                      <div className="flex flex-wrap gap-2">
                        {record.medications.map((med: any, idx: number) => (
                          <span key={idx} className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 border border-teal-100 px-3 py-1 rounded-full text-sm font-medium hover:bg-teal-100 transition-colors cursor-default" title={`${med.frequency}, ${med.duration}`}>
                            <Pill className="w-3.5 h-3.5" />
                            {med.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Doctor's Treatment Plan</h4>
                    <p className="text-sm text-slate-700 leading-relaxed">{record.treatmentPrescribed}</p>
                  </div>
                </div>

              </div>
            </div>
          ))
        )}
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
              <h3 className="text-lg font-bold text-slate-900">Export History</h3>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-sm font-semibold text-slate-700">Select Timeframe</p>
              <div className="space-y-2">
                {[
                  { id: '1_month', label: 'Last Month' },
                  { id: '3_months', label: 'Last 3 Months' },
                  { id: '6_months', label: 'Last 6 Months' },
                  { id: 'all', label: 'All Time' }
                ].map((option) => (
                  <label key={option.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input 
                      type="radio" 
                      name="timeframe" 
                      value={option.id}
                      checked={exportTimeframe === option.id}
                      onChange={(e) => setExportTimeframe(e.target.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-800 font-medium">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
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

export default TreatmentHistoryView;