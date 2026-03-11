import React from 'react';
import { Users, Calendar, AlertTriangle, FilePlus } from 'lucide-react';
import type { ViewState } from '../../types/doctor.types';
import { mockDoctor, initialFlags } from '../../data/mockDoctorData';

interface DashboardHomeProps {
  onNavigate: (view: ViewState) => void;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ onNavigate }) => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="bg-gradient-to-r from-teal-600 to-blue-700 rounded-2xl p-8 text-white shadow-lg shadow-teal-200">
      <h2 className="text-3xl font-bold mb-2">Welcome back, {mockDoctor.name.split(' ')[1]}!</h2>
      <p className="text-teal-50 max-w-2xl">
        You have 8 appointments scheduled for today. Your first patient is waiting in Room 3.
      </p>
    </div>

    {/* Key Metrics */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 cursor-pointer group" onClick={() => onNavigate('TREATMENT_HISTORY')}>
        <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
          <Users className="w-8 h-8" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500">Total Patients Treated</p>
          <p className="text-3xl font-bold text-slate-900">{mockDoctor.totalPatientsTreated.toLocaleString()}</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
        <div className="p-4 bg-teal-50 text-teal-600 rounded-2xl">
          <Calendar className="w-8 h-8" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500">Today's Appointments</p>
          <p className="text-3xl font-bold text-slate-900">8</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 cursor-pointer group" onClick={() => onNavigate('MEDICATION_FLAGS')}>
        <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl group-hover:scale-110 transition-transform">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500">Active Med Flags</p>
          <p className="text-3xl font-bold text-slate-900">{initialFlags.length}</p>
        </div>
      </div>
    </div>

    {/* Quick Actions & Recent */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Today's Schedule (Mock) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">Today's Schedule</h3>
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">Updated</span>
        </div>
        <div className="divide-y divide-slate-100 p-2">
          {[
            { time: '09:00 AM', patient: 'Michael Lawson', type: 'Follow-up' },
            { time: '09:45 AM', patient: 'Sarah Connor', type: 'New Patient' },
            { time: '10:30 AM', patient: 'David Smith', type: 'Routine Checkup' },
          ].map((apt, i) => (
            <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 rounded-xl transition-colors">
              <div className="flex items-center gap-4">
                <div className="bg-slate-100 text-slate-600 font-bold text-sm px-3 py-1.5 rounded-lg w-24 text-center">
                  {apt.time}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{apt.patient}</p>
                  <p className="text-xs text-slate-500">{apt.type}</p>
                </div>
              </div>
              <button 
                onClick={() => onNavigate('TREATMENT_RECORDS')}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Create Treatment Record"
              >
                <FilePlus className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Access */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => onNavigate('TREATMENT_RECORDS')}
            className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-slate-200 rounded-2xl text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all group"
          >
            <FilePlus className="w-8 h-8 group-hover:scale-110 transition-transform" />
            <span className="font-semibold">New Record</span>
          </button>
          <button 
            onClick={() => onNavigate('MEDICATION_FLAGS')}
            className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-slate-200 rounded-2xl text-slate-600 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 transition-all group"
          >
            <AlertTriangle className="w-8 h-8 group-hover:scale-110 transition-transform" />
            <span className="font-semibold">Flag Medicine</span>
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default DashboardHome;