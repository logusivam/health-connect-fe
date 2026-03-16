import React, { useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { mockUsers } from '../../data/mockAdminData';
import PageHeader from './PageHeader';

const ManageUsersView: React.FC = () => {
  const [users, setUsers] = useState(mockUsers);
  const [search, setSearch] = useState('');

  // Filter based on Role, Name, ID, or Email
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.userId.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, accountStatus: u.accountStatus === 'Active' ? 'Suspended' : 'Active' } : u));
  };

  const handleDelete = (id: string) => {
    if(confirm("Permanently delete this user account? This action is irreversible.")) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
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
                  <td className="px-6 py-4 whitespace-nowrap"><p className="font-bold text-slate-900">{u.name}</p><p className="text-xs text-slate-500">{u.email}</p></td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold mb-1 ${u.role === 'Doctor' ? 'bg-teal-50 text-teal-700' : 'bg-blue-50 text-blue-700'}`}>{u.role}</span>
                    <p className="text-xs font-mono text-slate-400">{u.userId}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{u.createdOn}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${u.accountStatus === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      {u.accountStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => toggleStatus(u.id)} className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                        {u.accountStatus === 'Active' ? 'Suspend' : 'Activate'}
                      </button>
                      <button onClick={() => handleDelete(u.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
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

export default ManageUsersView;