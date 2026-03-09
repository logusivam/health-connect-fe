import React, { useEffect } from 'react';
import { Calendar, Pill } from 'lucide-react';
import { mockHistory } from '../../data/mockPatientData';

interface TreatmentHistoryViewProps {
  highlightedRecordId?: string | null;
}

const TreatmentHistoryView: React.FC<TreatmentHistoryViewProps> = ({ highlightedRecordId }) => {
  // Auto-scroll to highlighted record if routed from Dashboard
  useEffect(() => {
    if (highlightedRecordId) {
      const el = document.getElementById(`record-${highlightedRecordId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedRecordId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Treatment History</h2>
          <p className="text-slate-500">Review your past diagnoses, prescriptions, and doctor notes.</p>
        </div>
      </div>

      <div className="space-y-4">
        {mockHistory.map((record) => (
          <div 
            key={record.id} 
            id={`record-${record.id}`}
            className={`bg-white rounded-2xl border shadow-sm p-6 lg:p-8 hover:shadow-md transition-all duration-500 ${
              highlightedRecordId === record.id 
                ? 'border-blue-400 ring-4 ring-blue-50 bg-blue-50/30' 
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
                        <span key={idx} className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 border border-teal-100 px-3 py-1 rounded-full text-sm font-medium">
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
    </div>
  );
};

export default TreatmentHistoryView;