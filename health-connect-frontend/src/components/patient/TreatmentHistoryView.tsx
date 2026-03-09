import React, { useState, useEffect } from 'react';
import { Calendar, Pill, Download, X, FileText } from 'lucide-react';
import { mockHistory } from '../../data/mockPatientData';

interface TreatmentHistoryViewProps {
  highlightedRecordId?: string | null;
}

const TreatmentHistoryView: React.FC<TreatmentHistoryViewProps> = ({ highlightedRecordId }) => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportTimeframe, setExportTimeframe] = useState('all');

  // Auto-scroll to highlighted record if routed from Dashboard
  useEffect(() => {
    if (highlightedRecordId) {
      const el = document.getElementById(`record-${highlightedRecordId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedRecordId]);

  const handleExport = (format: 'pdf' | 'excel') => {
    alert(`Downloading Treatment History as ${format.toUpperCase()} for timeframe: ${exportTimeframe}`);
    setIsExportModalOpen(false);
  };

  return (
    <div className="space-y-6">
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
        {mockHistory.map((record) => (
          <div 
            key={record.id} 
            id={`record-${record.id}`}
            className={`bg-white rounded-2xl border shadow-sm p-6 lg:p-8 transition-all duration-500 hover:shadow-md ${
              highlightedRecordId === record.id 
                ? 'border-blue-400 ring-4 ring-blue-50 bg-blue-50/30 scale-[1.01]' 
                : 'border-slate-100'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              
              {/* Meta info */}
              <div className="md:w-1/4 shrink-0 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-6">
                <div className="inline-flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg font-semibold text-sm mb-4">
                  <Calendar className="w-4 h-4" />
                  {record.date}
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Attending Doctor</p>
                  <p className="font-medium text-slate-900">{record.doctorName}</p>
                  <p className="text-xs text-slate-500">{record.specialty}</p>
                </div>
              </div>

              {/* Clinical info */}
              <div className="md:w-3/4 space-y-5">
                <div>
                  <h4 className="text-sm text-slate-500 mb-1">Diagnosis</h4>
                  <p className="text-lg font-bold text-slate-900">{record.diagnosis}</p>
                </div>

                {record.prescription.length > 0 && record.prescription[0] !== "None" && (
                  <div>
                    <h4 className="text-sm text-slate-500 mb-2">Prescriptions</h4>
                    <div className="flex flex-wrap gap-2">
                      {record.prescription.map((med, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 border border-teal-100 px-3 py-1 rounded-full text-sm font-medium hover:bg-teal-100 transition-colors cursor-default">
                          <Pill className="w-3.5 h-3.5" />
                          {med}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Doctor's Notes</h4>
                  <p className="text-sm text-slate-700 leading-relaxed">{record.notes}</p>
                </div>
              </div>

            </div>
          </div>
        ))}
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