import React, { useState, useEffect } from 'react';
import { Users, Calendar, AlertTriangle, FilePlus } from 'lucide-react';
import type { ViewState } from '../../types/doctor.types';
import { doctorApi } from '../../services/api';

interface DashboardHomeProps {
  onNavigate: (view: ViewState, recordId?: string) => void;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ onNavigate }) => {
  const [doctorName, setDoctorName] = useState<string>('Loading...');
  const [pendingToday, setPendingToday] = useState<any[]>([]);
  const [totalTreated, setTotalTreated] = useState<number>(0);
  const [activeFlagsCount, setActiveFlagsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [profileRes, todayRes, recordsRes, flagsRes] = await Promise.all([
          doctorApi.getProfile(),
          doctorApi.getTodayAppointments(),
          doctorApi.getTreatmentRecords(),
          doctorApi.getFlags()
        ]);

        if (profileRes.success) {
          setDoctorName(profileRes.data.lastName || profileRes.data.firstName);
        }

        if (todayRes.success) {
          // Filter strictly for records that do NOT have a diagnosis/outcome filled out yet
          const pending = todayRes.data.filter((r: any) => !r.diagnosis && !r.outcomeStatus);
          setPendingToday(pending);
        }

        if (recordsRes.success) {
          // STRICT FILTER: Must have diagnosis and outcome status
          const validRecords = recordsRes.data.filter((r: any) => r.diagnosis && r.outcomeStatus);
          
          // UNIQUE PATIENTS ONLY: Map the patient IDs and put them in a Set to remove duplicates
          const uniquePatientIds = new Set(validRecords.map((r: any) => r.patient_id?._id || r.patient_id));
          
          setTotalTreated(uniquePatientIds.size);
        }

        if (flagsRes.success) {
          // Filter for active unsuitable flags only
          const active = flagsRes.data.filter((f: any) => f.is_active);
          setActiveFlagsCount(active.length);
        }

      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-r from-teal-600 to-blue-700 rounded-2xl p-8 text-white shadow-lg shadow-teal-200">
        <h2 className="text-3xl font-bold mb-2">Welcome back, Dr. {doctorName}!</h2>
        <p className="text-teal-50 max-w-2xl">
          You have {pendingToday.length} appointments scheduled for today.
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
            <p className="text-3xl font-bold text-slate-900">{isLoading ? '-' : totalTreated.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
          <div className="p-4 bg-teal-50 text-teal-600 rounded-2xl">
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Today's Appointments</p>
            <p className="text-3xl font-bold text-slate-900">{isLoading ? '-' : pendingToday.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-4 cursor-pointer group" onClick={() => onNavigate('MEDICATION_FLAGS')}>
          <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl group-hover:scale-110 transition-transform">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Active Med Flags</p>
            <p className="text-3xl font-bold text-slate-900">{isLoading ? '-' : activeFlagsCount}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full min-h-[350px]">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
            <h3 className="font-semibold text-slate-800">Today's Schedule</h3>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">Live</span>
          </div>
          <div className="divide-y divide-slate-100 p-2 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500 text-sm">Loading schedule...</div>
            ) : pendingToday.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No pending appointments for today.</div>
            ) : (
              pendingToday.map((apt) => (
                <div key={apt._id} className="px-4 py-3 flex items-start justify-between hover:bg-slate-50 rounded-xl transition-colors">
                  <div className="flex items-start gap-4">
                    <div>
                      <p className="font-bold text-slate-900">{apt.patient_id.firstName} {apt.patient_id.lastName}</p>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2 pr-4">{apt.chiefComplaint}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onNavigate('TREATMENT_RECORDS', apt._id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0"
                    title="Create Treatment Record"
                  >
                    <FilePlus className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Access */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => onNavigate('TREATMENT_RECORDS')}
              className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-slate-200 rounded-2xl text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all group h-full"
            >
              <FilePlus className="w-8 h-8 group-hover:scale-110 transition-transform" />
              <span className="font-semibold">New Record</span>
            </button>
            <button 
              onClick={() => onNavigate('MEDICATION_FLAGS')}
              className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-slate-200 rounded-2xl text-slate-600 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 transition-all group h-full"
            >
              <AlertTriangle className="w-8 h-8 group-hover:scale-110 transition-transform" />
              <span className="font-semibold">Flag Medicine</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;