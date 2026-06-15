import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import PageHeader from './PageHeader';

// Upgraded to handle real Mongoose Mixed Type JSON objects natively
const formatJSONText = (data: any) => {
  if (!data) return 'None';
  try {
    const obj = typeof data === 'string' ? JSON.parse(data) : data;
    if (typeof obj !== 'object' || obj === null) return String(data);
    if (Object.keys(obj).length === 0) return 'None';
    
    return Object.entries(obj).map(([key, val]) => {
      const cleanKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      const cleanVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
      return `${cleanKey}: ${cleanVal}`;
    }).join(', ');
  } catch (e) {
    return String(data);
  }
};

const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    const res = await adminApi.getAuditLogs();
    if (res.success) {
      setLogs(res.data);
    }
    setIsLoading(false);
  };

  if (isLoading) return <div className="text-center py-20 text-slate-500">Loading audit logs...</div>;

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
              {logs.length === 0 ? (
                 <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500 text-base">No audit logs found.</td>
                </tr>
              ) : logs.map(log => (
                <tr key={log.log_id} className="hover:bg-slate-50 transition-colors align-top">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-slate-900 font-bold mb-1">{new Date(log.occurred_at).toLocaleString()}</p>
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded font-semibold text-[10px] uppercase tracking-wider">
                      {log.actor_role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className={`font-bold mb-1 ${log.action_type === 'DELETE' ? 'text-red-600' : log.action_type === 'UPDATE' ? 'text-amber-600' : 'text-blue-600'}`}>
                      {log.action_type}
                    </p>
                    <p className="text-slate-500 font-medium uppercase tracking-wider text-[10px]">
                      {log.entity_type.replace('_', ' ')}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-slate-700 leading-relaxed">
                        <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1 border-b border-slate-200 pb-1">Old Values</span>
                        <p className="mt-1.5">{formatJSONText(log.old_values)}</p>
                      </div>
                      <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-lg text-blue-900 leading-relaxed">
                        <span className="block text-[10px] uppercase font-bold text-blue-500 mb-1 border-b border-blue-100 pb-1">New Values</span>
                        <p className="mt-1.5">{formatJSONText(log.new_values)}</p>
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