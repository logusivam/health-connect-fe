import React, { useState } from 'react';
import { LayoutDashboard, User, ClipboardList, CalendarPlus, LogOut, HeartPulse } from 'lucide-react';
import type { ViewState } from '../../types/patient.types';

// Components
import Topbar from '../../components/patient/Topbar';
import DashboardHome from '../../components/patient/DashboardHome';
import ProfileView from '../../components/patient/ProfileView';
import TreatmentHistoryView from '../../components/patient/TreatmentHistoryView';
import BookAppointmentView from '../../components/patient/BookAppointmentView';

export default function PatientDashboard() {
  const [activeView, setActiveView] = useState<ViewState>('DASHBOARD');
  const [highlightedRecordId, setHighlightedRecordId] = useState<string | null>(null);

  const navItems = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'PROFILE', label: 'My Profile', icon: User },
    { id: 'HISTORY', label: 'Treatment History', icon: ClipboardList },
    { id: 'BOOK_APPOINTMENT', label: 'Book Appointment', icon: CalendarPlus },
  ] as const;

  const handleNavigate = (view: ViewState, recordId?: string) => {
    setActiveView(view);
    if (recordId) {
      setHighlightedRecordId(recordId);
      // Remove highlighting after animation so user can re-trigger it cleanly
      setTimeout(() => setHighlightedRecordId(null), 3000); 
    } else {
      setHighlightedRecordId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-900 text-white min-h-screen sticky top-0">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-blue-500 p-2 rounded-xl">
            <HeartPulse className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Health<span className="text-blue-400">Connect</span>
          </h1>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium ${
                activeView === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => alert('Logged out! (Redirecting to login screen)')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        
        {/* Mobile Navigation (Simple Tab Bar) */}
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-2 flex overflow-x-auto hide-scrollbar sticky top-16 z-10">
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

        <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto">
          {activeView === 'DASHBOARD' && <DashboardHome onNavigate={handleNavigate} />}
          {activeView === 'PROFILE' && <ProfileView />}
          {activeView === 'HISTORY' && <TreatmentHistoryView highlightedRecordId={highlightedRecordId} />}
          {activeView === 'BOOK_APPOINTMENT' && <BookAppointmentView />}
        </main>
      </div>

    </div>
  );
}