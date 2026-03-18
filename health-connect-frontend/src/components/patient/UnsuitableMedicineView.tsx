import React from 'react';
import { Ban, CheckCircle2 } from 'lucide-react';
import { mockUnsuitableMedicines } from '../../data/mockPatientData';

const UnsuitableMedicineView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Unsuitable Medicine</h2>
          <p className="text-slate-500">Medicines flagged as unsuitable or allergic for your profile.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
        {mockUnsuitableMedicines.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
            No unsuitable medicines have been flagged for you.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-700">Medicine Name</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Flag</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Flagged By</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Reason</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Date Flagged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockUnsuitableMedicines.map((med) => (
                  <tr key={med.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">
                      {med.medicineName}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-100">
                        <Ban className="w-3.5 h-3.5" />
                        Unsuitable
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-medium text-slate-900">{med.flaggedBy}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{med.department}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600 max-w-[250px] truncate" title={med.reason}>
                      {med.reason}
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {med.dateFlagged}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnsuitableMedicineView;