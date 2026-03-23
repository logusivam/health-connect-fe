import React, { useState, useEffect } from 'react';
import { Calendar, Activity, Pill, FileText, Clock, ChevronRight, X } from 'lucide-react';
import type { ViewState, Medication } from '../../types/patient.types';
import { mockMedications, mockHistory } from '../../data/mockPatientData';
import { patientApi } from '../../services/api'; 

interface DashboardHomeProps {
  onNavigate: (view: ViewState, recordId?: string) => void;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ onNavigate }) => {
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null);
  
  // Real Data States
  const [patientName, setPatientName] = useState<string>('Loading...');
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [profileRes, apptsRes] = await Promise.all([
          patientApi.getProfile(),
          patientApi.getAppointments()
        ]);

        if (profileRes.success) {
          setPatientName(profileRes.data.lastName || profileRes.data.firstName);
        }

        if (apptsRes.success) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const threeDaysFromNow = new Date(today);
          threeDaysFromNow.setDate(today.getDate() + 3);

          const upcomingAppts = apptsRes.data.filter((appt: any) => {
            const apptDate = new Date(appt.visitDate);
            apptDate.setHours(0, 0, 0, 0);
            return apptDate.getTime() >= today.getTime() && apptDate.getTime() <= threeDaysFromNow.getTime();
          });

          upcomingAppts.sort((a: any, b: any) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime());

          if (upcomingAppts.length > 0) {
            setNextAppointment(upcomingAppts[0]);
          }
        }
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const getRelativeDayText = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const apptDate = new Date(dateString);
    apptDate.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(apptDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === 2) return 'Day after tomorrow';
    return 'In 3 days';
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl p-8 text-white shadow-lg shadow-blue-200 transition-all hover:shadow-xl hover:shadow-blue-300/50">
        <h2 className="text-3xl font-bold mb-2">Hello, {patientName}!</h2>
        <p className="text-blue-50 max-w-2xl">
          Welcome to your Health Connect patient portal. Here you can view your latest medical records, check your upcoming appointments, and monitor your health vitals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Upcoming Appointment - Now Clickable */}
        <div 
          onClick={() => nextAppointment && onNavigate('BOOK_APPOINTMENT', nextAppointment._id)}
          className={`bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all ${nextAppointment ? 'cursor-pointer' : ''}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-800">Next Appointment</h3>
          </div>
          <div className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-slate-500">Loading appointment data...</p>
            ) : nextAppointment ? (
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {getRelativeDayText(nextAppointment.visitDate)}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dr. {nextAppointment.doctor_id.lastName || nextAppointment.doctor_id.firstName} 
                    <span className="block mt-0.5 text-[10px] uppercase tracking-wider font-semibold text-indigo-600 bg-indigo-50 inline-block px-2 py-0.5 rounded-md">
                      {nextAppointment.doctor_id.department || 'General Practice'}
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No upcoming appointments in the next 3 days.</p>
            )}
          </div>
        </div>

        {/* Latest Vitals */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-800">Latest Vitals</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Blood Pressure</p>
              <p className="text-lg font-bold text-slate-900">120/80</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Heart Rate</p>
              <p className="text-lg font-bold text-slate-900">72 <span className="text-sm font-normal text-slate-500">bpm</span></p>
            </div>
          </div>
        </div>

        {/* Active Medications */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
              <Pill className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-800">Active Medications</h3>
          </div>
          <ul className="space-y-3">
            {mockMedications.map((med) => (
              <li 
                key={med.id} 
                className="flex items-center justify-between text-sm cursor-pointer hover:bg-slate-50 p-2 -mx-2 rounded-lg transition-colors group"
                onClick={() => setSelectedMed(med)}
              >
                <span className="font-medium text-slate-700 group-hover:text-blue-600 transition-colors">{med.name}</span>
                <span className="text-slate-500 text-xs bg-slate-100 px-2 py-1 rounded-md">{med.frequency}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-slate-800">Recent Treatment History</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {mockHistory.slice(0, 2).map((record) => (
            <div key={record.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg hidden sm:block">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{record.diagnosis}</p>
                  <p className="text-xs text-slate-500">{record.doctorName} • {record.date}</p>
                </div>
              </div>
              <button 
                onClick={() => onNavigate('HISTORY', record.id)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 transition-transform hover:translate-x-1"
              >
                View <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Medication Popover Modal */}
      {selectedMed && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setSelectedMed(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
                <Pill className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Medication Info</h3>
            </div>
            <div className="space-y-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Medicine Name</p>
                <p className="font-semibold text-slate-900 text-base">{selectedMed.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Duration</p>
                  <p className="font-medium text-slate-800">{selectedMed.duration}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Frequency</p>
                  <p className="font-medium text-slate-800">{selectedMed.frequency}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">From Date</p>
                  <p className="font-medium text-slate-800">{selectedMed.fromDate}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">To Date</p>
                  <p className="font-medium text-slate-800">{selectedMed.toDate}</p>
                </div>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Prescribed By</p>
                <p className="font-medium text-slate-800">{selectedMed.doctorName}</p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedMed(null)}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardHome;