import React, { useState, useEffect } from 'react';
import { Search, Trash2, AlertCircle, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { adminApi } from '../../services/api';
import PageHeader from './PageHeader';

const ManageUsersView: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Toast and Modal States
  const [toastMsg, setToastMsg] = useState<{msg: string, type: 'success'|'error'|'warning'} | null>(null);
  const [deleteState, setDeleteState] = useState<{ id: string, step: number } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    const res = await adminApi.getAllUsers();
    if (res.success) {
      setUsers(res.data);
    }
    setIsLoading(false);
  };

  const showToast = (msg: string, type: 'success'|'error'|'warning' = 'success') => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Filter based on Role, Name, ID, or Email
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.id.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const res = await adminApi.updateUserStatus(id, newStatus);
    
    if (res.success) {
      setUsers(users.map(u => u.id === id ? { ...u, isActive: res.data.isActive } : u));
      showToast(res.message, 'success');
    } else {
      showToast(res.message || 'Failed to update status.', 'error');
    }
  };

  // Double Confirmation Delete Logic
  const initiateDelete = (id: string) => {
    setDeleteState({ id, step: 1 });
  };

  const confirmDeleteStep1 = () => {
    if (deleteState) setDeleteState({ ...deleteState, step: 2 });
  };

  const executeDelete = async () => {
    if (!deleteState) return;
    const res = await adminApi.deleteUser(deleteState.id);
    
    if (res.success) {
      setUsers(prev => prev.filter(u => u.id !== deleteState.id));
      showToast(res.message, 'success');
    } else {
      showToast(res.message || 'Failed to delete user.', 'error');
    }
    setDeleteState(null);
  };

  if (isLoading) {
    return <div className="text-center py-20 text-slate-500">Loading user accounts...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 relative">
      
      {/* Global Toast */}
      {toastMsg && (
        <div className={`fixed top-24 right-8 z-[100] px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-10 fade-in duration-300 text-white ${toastMsg.type === 'error' ? 'bg-red-600' : toastMsg.type === 'warning' ? 'bg-amber-600' : 'bg-slate-900'}`}>
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">{toastMsg.msg}</p>
        </div>
      )}

      <PageHeader title="User Account Management" description="Control platform access and authentication statuses for all roles." />
      
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
           <div className="relative w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search role, name, email or ID..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">User Details</th>
                <th className="px-6 py-4 font-semibold">Role & ID</th>
                <th className="px-6 py-4 font-semibold">Created On</th>
                <th className="px-6 py-4 font-semibold">Account Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                 <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">No users matched your search criteria.</td>
                </tr>
              ) : filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="font-bold text-slate-900">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold mb-1 border ${
                      u.role === 'DOCTOR' ? 'bg-teal-50 text-teal-700 border-teal-200' : 
                      u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                      'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {u.role}
                    </span>
                    <p className="text-xs font-mono text-slate-400">{u.id}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {new Date(u.createdOn).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${u.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      {u.isActive ? <CheckCircle2 className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                      {u.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 items-center">
                      <button 
                        onClick={() => toggleStatus(u.id, u.isActive)} 
                        className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-slate-700"
                      >
                        {u.isActive ? 'Suspend' : 'Activate'}
                      </button>
                      <button 
                        onClick={() => initiateDelete(u.id)} 
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Double Confirmation Delete Modal --- */}
      {deleteState && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-red-100">
            <div className="p-6 text-center mt-2">
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border-4 border-red-100">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                {deleteState.step === 1 ? 'Delete User Account?' : 'Final Confirmation'}
              </h3>
              <p className="text-slate-500 leading-relaxed px-2">
                {deleteState.step === 1 
                  ? "This will soft-delete the user and immediately revoke their access. Are you sure?" 
                  : "This action cannot be undone. The user's account and profile connection will be severed. Confirm deletion?"}
              </p>
            </div>
            
            <div className="p-4 bg-slate-50 flex justify-center gap-3 border-t border-slate-100">
              <button 
                onClick={() => setDeleteState(null)}
                className="px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              
              {deleteState.step === 1 ? (
                <button 
                  onClick={confirmDeleteStep1}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-sm"
                >
                  Yes, Proceed
                </button>
              ) : (
                <button 
                  onClick={executeDelete}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-red-700 hover:bg-red-800 rounded-xl transition-colors shadow-md animate-pulse"
                >
                  Confirm Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsersView;