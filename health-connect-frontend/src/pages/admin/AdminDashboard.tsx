import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, Stethoscope, AlertTriangle, UserCog, Activity, User, ChevronLeft, ChevronRight } from 'lucide-react';
import favicon from '../../assets/logo-v1.png';
import type { ViewState } from '../../types/admin.types';
import { mockAdmin } from '../../data/mockAdminData';

import AdminProfileView from '../../components/admin/AdminProfileView';
import PatientRecordsView from '../../components/admin/PatientRecordsView';
import DoctorRecordsView from '../../components/admin/DoctorRecordsView';
import UnsuitableMedicineAdminView from '../../components/admin/UnsuitableMedicineAdminView';
import ManageUsersView from '../../components/admin/ManageUsersView';
import AuditLogsView from '../../components/admin/AuditLogsView';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract the current view from the URL (e.g., /admin/patient_records -> 'PATIENT_RECORDS')
  const urlPath = location.pathname.split('/')[2];
  const activeView = (urlPath ? urlPath.toUpperCase() : 'PATIENT_RECORDS') as ViewState;

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [adminAvatar, setAdminAvatar] = useState<string | undefined>(mockAdmin.avatar);

  const navItems = [
    { id: 'PATIENT_RECORDS', label: 'Patient Records', icon: Users },
    { id: 'DOCTOR_RECORDS', label: 'Doctor Records', icon: Stethoscope },
    { id: 'UNSUITABLE_MEDICINE', label: 'Unsuitable Medicines', icon: AlertTriangle },
    { id: 'MANAGE_USERS', label: 'Manage Accounts', icon: UserCog },
    { id: 'AUDIT_LOGS', label: 'Audit Logs', icon: Activity },
    { id: 'PROFILE', label: 'Admin Profile', icon: User },
  ] as const;

  const handleNavigate = (view: string) => {
    navigate(`/admin/${view.toLowerCase()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      {/* Sidebar - Desktop */}
      <aside 
        className={`hidden lg:flex flex-col bg-slate-900 text-white min-h-screen sticky top-0 transition-all duration-300 ease-in-out relative z-20 ${
          isSidebarOpen ? 'w-72' : 'w-20'
        }`}
      >
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-8 bg-slate-800 text-slate-300 p-1.5 rounded-full border border-slate-700 hover:text-white hover:bg-slate-700 transition-all shadow-md hover:scale-110 z-30"
        >
          {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <div className={`p-6 flex items-center gap-3 border-b border-slate-800 h-20 shrink-0 ${isSidebarOpen ? 'justify-start' : 'justify-center px-0'}`}>
          <div className="">
             <img src={favicon} alt="HealthConnect" className="w-10 h-10" />
          </div>
          <div className={`overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
            <h1 className="text-xl font-bold tracking-tight text-white whitespace-nowrap">
              Health<span className="text-blue-400">Connect</span>
            </h1>
          </div>
        </div>

        <nav className="flex-1 px-3 py-8 space-y-2 overflow-y-auto hide-scrollbar overflow-x-hidden">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`w-full flex items-center group relative px-3 py-3.5 rounded-xl transition-all font-medium ${
                activeView === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20 scale-[1.02]' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              } ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}
            >
              <item.icon className={`w-5 h-5 shrink-0 transition-all duration-300 ${isSidebarOpen ? 'mr-3' : 'mr-0'}`} />
              <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${isSidebarOpen ? 'max-w-[200px] opacity-100' : 'max-w-0 opacity-0'}`}>
                {item.label}
              </span>
              {!isSidebarOpen && (
                 <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-slate-700">
                    {item.label}
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45 border-l border-b border-slate-700"></div>
                 </div>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-10">
          <div className="flex items-center gap-3 lg:hidden">
            <img src={favicon} alt="HealthConnect" className="w-10 h-10" />
            <h1 className="text-xl font-bold text-slate-900">Health<span className="text-blue-600">Connect</span></h1>
          </div>
          
          <div className="hidden lg:flex items-center text-slate-500 font-medium">
             <span className="text-slate-400">System Admin</span>
             <ChevronRight className="w-4 h-4 mx-2" />
             <span className="text-slate-900 font-semibold">{navItems.find(i => i.id === activeView)?.label || 'Dashboard'}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">{mockAdmin.name}</p>
              <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Super Admin</p>
            </div>
            <div 
              className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border-2 border-slate-200 text-slate-700 font-bold overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all" 
              onClick={() => handleNavigate('PROFILE')}
            >
              {adminAvatar ? <img src={adminAvatar} alt="Admin" className="w-full h-full object-cover" /> : mockAdmin.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Mobile Navigation */}
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-2 flex overflow-x-auto hide-scrollbar sticky top-16 z-10 transition-all shadow-sm">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeView === item.id ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto bg-slate-50/50">
          <div key={activeView}>
            {activeView === 'PROFILE' && <AdminProfileView avatar={adminAvatar} onAvatarChange={setAdminAvatar} />}
            {activeView === 'PATIENT_RECORDS' && <PatientRecordsView />}
            {activeView === 'DOCTOR_RECORDS' && <DoctorRecordsView />}
            {activeView === 'UNSUITABLE_MEDICINE' && <UnsuitableMedicineAdminView />}
            {activeView === 'MANAGE_USERS' && <ManageUsersView />}
            {activeView === 'AUDIT_LOGS' && <AuditLogsView />}
          </div>
        </main>
      </div>
    </div>
  );
}