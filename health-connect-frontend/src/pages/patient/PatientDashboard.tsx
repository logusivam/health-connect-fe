import React, { useState } from 'react';
import { LayoutDashboard, User, ClipboardList, CalendarPlus, LogOut, HeartPulse, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import type { ViewState } from '../../types/patient.types';
import { mockProfile } from '../../data/mockPatientData';

import Topbar from '../../components/patient/Topbar';
import DashboardHome from '../../components/patient/DashboardHome';
import ProfileView from '../../components/patient/ProfileView';
import TreatmentHistoryView from '../../components/patient/TreatmentHistoryView';
import BookAppointmentView from '../../components/patient/BookAppointmentView';
import UnsuitableMedicineView from '../../components/patient/UnsuitableMedicineView';

export default function PatientDashboard() {
  const [activeView, setActiveView] = useState<ViewState>('DASHBOARD');
  const [highlightedRecordId, setHighlightedRecordId] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | undefined>(mockProfile.avatar);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Reordered navigation items
  const navItems = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'HISTORY', label: 'Treatment History', icon: ClipboardList },
    { id: 'UNSUITABLE_MEDICINE', label: 'Unsuitable Medicine', icon: AlertCircle },
    { id: 'BOOK_APPOINTMENT', label: 'Book Appointment', icon: CalendarPlus },
    { id: 'PROFILE', label: 'My Profile', icon: User },
  ] as const;

  const handleNavigate = (view: ViewState, recordId?: string) => {
    setActiveView(view);
    if (recordId) {
      setHighlightedRecordId(recordId);
      setTimeout(() => setHighlightedRecordId(null), 3000); 
    } else {
      setHighlightedRecordId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      {/* Sidebar - Desktop */}
      <aside 
        className={`hidden lg:flex flex-col bg-slate-900 text-white min-h-screen sticky top-0 transition-all duration-300 ease-in-out relative ${
          isSidebarOpen ? 'w-72' : 'w-20'
        }`}
      >
        {/* Toggle Collapse Button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-6 bg-slate-800 text-slate-300 p-1.5 rounded-full border border-slate-700 hover:text-white hover:bg-slate-700 transition-all z-20 shadow-md hover:scale-110"
        >
          {isSidebarOpen ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-5 h-5" />}
        </button>

        <div className={`p-6 flex items-center gap-3 border-b border-slate-800 h-20 shrink-0 ${isSidebarOpen ? 'justify-start' : 'justify-center px-0'}`}>
          <div className="bg-blue-500 p-2 rounded-xl shrink-0 transition-transform hover:scale-110">
            <HeartPulse className="w-6 h-6 text-white" />
          </div>
          <div className={`overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
            <h1 className="text-2xl font-bold tracking-tight text-white whitespace-nowrap">
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

              {/* Tooltip for collapsed state */}
              {!isSidebarOpen && (
                 <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none translate-x-2 group-hover:translate-x-0 shadow-xl border border-slate-700">
                    {item.label}
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45 border-l border-b border-slate-700"></div>
                 </div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => alert('Logged out! (Redirecting to login screen)')}
            className={`w-full flex items-center group relative px-3 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors font-medium ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}
          >
            <LogOut className={`w-5 h-5 shrink-0 transition-all duration-300 ${isSidebarOpen ? 'mr-3' : 'mr-0'}`} />
            
            <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${isSidebarOpen ? 'max-w-[200px] opacity-100' : 'max-w-0 opacity-0'}`}>
              Sign Out
            </span>

            {/* Tooltip for collapsed state */}
            {!isSidebarOpen && (
               <div className="absolute left-full ml-4 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none translate-x-2 group-hover:translate-x-0 shadow-xl border border-slate-700">
                  Sign Out
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45 border-l border-b border-slate-700"></div>
               </div>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar avatar={userAvatar} />
        
        {/* Mobile Navigation (Simple Tab Bar) */}
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-2 flex overflow-x-auto hide-scrollbar sticky top-16 z-10 transition-all">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeView === item.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto bg-slate-50/50">
          {/* Main content wrapper with mount animation keys */}
          <div key={activeView} className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
            {activeView === 'DASHBOARD' && <DashboardHome onNavigate={handleNavigate} />}
            {activeView === 'HISTORY' && <TreatmentHistoryView highlightedRecordId={highlightedRecordId} />}
            {activeView === 'UNSUITABLE_MEDICINE' && <UnsuitableMedicineView />}
            {activeView === 'BOOK_APPOINTMENT' && <BookAppointmentView />}
            {activeView === 'PROFILE' && <ProfileView avatar={userAvatar} onAvatarChange={setUserAvatar} />}
          </div>
        </main>
      </div>

    </div>
  );
}