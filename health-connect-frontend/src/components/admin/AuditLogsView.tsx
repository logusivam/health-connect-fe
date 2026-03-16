import React from 'react';
import { mockAuditLogs } from '../../data/mockAdminData';
import PageHeader from './PageHeader';

// Formats JSON strings into readable text
const formatJSONText = (jsonStr: string) => {
  if (jsonStr === 'null' || !jsonStr) return 'None';
  try {
    const obj = JSON.parse(jsonStr);
    return Object.entries(obj).map(([key, val]) => {
      const cleanKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      return `${cleanKey}: ${val}`;
    }).join(', ');
  } catch (e) {
    return jsonStr;
  }
};

const AuditLogsView: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <PageHeader title="System Audit Logs" description="Immutable ledger of system activities, access, and entity modifications." />
      
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-300">
              <tr>
                <th className="px-6 py-4 font-semibold">Timestamp & Actor</th>
                <th className="px-6 py-4 font-semibold">Action & Entity</th>
                <th className="px-6 py-4 font-semibold w-1/2">State Snapshot Before/After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {mockAuditLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors align-top">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-slate-900 font-bold mb-1">{log.timestamp}</p>
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-semibold text-[10px] uppercase tracking-wider">{log.actorRole}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className={`font-bold mb-1 ${log.actionType === 'DELETE' ? 'text-red-600' : log.actionType === 'UPDATE' ? 'text-amber-600' : 'text-blue-600'}`}>{log.actionType}</p>
                    <p className="text-slate-500 font-medium uppercase tracking-wider text-[10px]">{log.entityType.replace('_', ' ')}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-slate-700 leading-relaxed">
                        <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1 border-b border-slate-200 pb-1">Old Values</span>
                        <p className="mt-1.5">{formatJSONText(log.oldValues)}</p>
                      </div>
                      <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-lg text-blue-900 leading-relaxed">
                        <span className="block text-[10px] uppercase font-bold text-blue-500 mb-1 border-b border-blue-100 pb-1">New Values</span>
                        <p className="mt-1.5">{formatJSONText(log.newValues)}</p>
                      </div>
                    </div>
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

export default AuditLogsView;   