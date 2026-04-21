import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Smartphone, CreditCard, Building, X, CheckCircle2, AlertTriangle, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { metadataApi, doctorApi, patientApi } from '../../services/api'; 

type PaymentStep = 'HIDDEN' | 'SUMMARY' | 'OPTIONS' | 'SUCCESS';

interface BookedAppointment {
  id: string;
  doctorId: string; 
  doctorName: string;
  department: string;
  problem: string;
  date: string;
  followUpDate?: string | null;
  isFollowUpParent: boolean;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Referred' | 'Follow up required' | 'Appointment Booked' | 'Follow up completed' | 'Not visited';
}

interface BookAppointmentViewProps {
  highlightedRecordId?: string | null;
}

const BookAppointmentView: React.FC<BookAppointmentViewProps> = ({ highlightedRecordId }) => {
  // Form States
  const [department, setDepartment] = useState('');
  const [date, setDate] = useState('');
  const [complaints, setComplaints] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  
  // Follow-up specific states
  const [isFollowUpBooking, setIsFollowUpBooking] = useState(false);
  const [followUpSourceId, setFollowUpSourceId] = useState<string | null>(null);

  const [appointments, setAppointments] = useState<BookedAppointment[]>([]);
  
  // Pagination States
  const [activePage, setActivePage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const [followUpPage, setFollowUpPage] = useState(1);
  const itemsPerPage = 5;

  // Real Data States
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [patientName, setPatientName] = useState<string>('Loading...'); 
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false); 

  // Payment Modal State
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('HIDDEN');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

  // In-Viewport Notification State
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'warning' } | null>(null);

  const APPOINTMENT_FEE = 500; 

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // --- Dynamic Real-time Linked Status Calculator ---
  const calculateStatus = (record: any, allRecords: any[]): BookedAppointment['status'] => {
    // 1. Is this a parent Follow-up record?
    if (record.outcomeStatus === 'Follow up required') {
      const childRecord = allRecords.find(r => r.followUp_for_record_id === record._id);
      
      if (childRecord) {
        // Did the child get seen by the doctor yet?
        if (childRecord.diagnosis && childRecord.outcomeStatus) return 'Follow up completed';
        
        // Still pending
        const childDate = new Date(childRecord.visitDate).setHours(0,0,0,0);
        const today = new Date().setHours(0,0,0,0);
        if (childDate >= today) return 'Appointment Booked';
        return 'Not visited';
      } else {
        // No appointment booked yet
        if (!record.followUpDate) return 'Follow up required';
        const fDate = new Date(record.followUpDate).setHours(0,0,0,0);
        const today = new Date().setHours(0,0,0,0);
        if (fDate < today) return 'Not visited';
        return 'Follow up required';
      }
    }

    // 2. Standard Outcomes
    if (record.outcomeStatus === 'Resolved') return 'Completed';
    if (record.outcomeStatus === 'Referred') return 'Referred';

    // 3. Fallback Date-based logic for pending/new appointments
    const today = new Date().setHours(0, 0, 0, 0); 
    const apptDate = new Date(record.visitDate).setHours(0, 0, 0, 0);

    if (apptDate > today) return 'Upcoming';
    if (apptDate === today) return 'Ongoing';
    
    // Past record without outcome? Marked as not visited
    if (record.diagnosis && record.outcomeStatus) return 'Completed';
    return 'Not visited';
  };

  const fetchBookingData = useCallback(async () => {
    try {
      const [deptRes, docsRes, patientRes, apptsRes] = await Promise.all([
        metadataApi.getDepartments(),
        doctorApi.getDirectory(),
        patientApi.getProfile(),
        patientApi.getAppointments() 
      ]);
      
      if (deptRes.success) setDepartmentsList(deptRes.data);
      if (docsRes.success) setDoctorsList(docsRes.data);
      if (patientRes.success) setPatientName(`${patientRes.data.firstName} ${patientRes.data.lastName}`);
      
      if (apptsRes.success) {
        const rawData = apptsRes.data;
        const formattedAppts = rawData.map((record: any) => ({
          id: record._id,
          doctorId: record.doctor_id._id || record.doctor_id, 
          doctorName: `Dr. ${record.doctor_id.firstName} ${record.doctor_id.lastName}`,
          department: record.doctor_id.department || 'General',
          problem: record.chiefComplaint,
          date: new Date(record.visitDate).toISOString().split('T')[0],
          followUpDate: record.followUpDate,
          isFollowUpParent: record.outcomeStatus === 'Follow up required',
          status: calculateStatus(record, rawData)
        }));
        // Appointments come pre-sorted latest first from backend
        setAppointments(formattedAppts);
      }
    } catch (error) {
      showToast("Failed to load booking data.", "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookingData();
  }, [fetchBookingData]);

  useEffect(() => {
    if (highlightedRecordId) {
      setTimeout(() => {
        const element = document.getElementById(`appointment-${highlightedRecordId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100); 
    }
  }, [highlightedRecordId, appointments]);

  const filteredDoctors = doctorsList.filter(doc => {
    if (!department) return true; 
    return doc.department === department;
  });

  const selectedDoctorDetails = doctorsList.find(d => d._id === selectedDoctor);

  // --- Start Follow-up Booking Logic ---
  const handleBookFollowUp = (appt: BookedAppointment) => {
    setIsFollowUpBooking(true);
    setFollowUpSourceId(appt.id);
    
    setDepartment(appt.department);
    if (appt.followUpDate) {
      setDate(new Date(appt.followUpDate).toISOString().split('T')[0]);
    }
    setComplaints(`${appt.problem} - Follow up required`);
    setSelectedDoctor(appt.doctorId);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFollowUpBooking = () => {
    setIsFollowUpBooking(false);
    setFollowUpSourceId(null);
    setDepartment('');
    setDate('');
    setComplaints('');
    setSelectedDoctor(null);
  };

  const handleConfirmAppointmentClick = () => {
    if (!complaints.trim()) {
      showToast("Please provide your chief complaints.", "warning");
      return;
    }

    if (selectedDoctorDetails) {
      // Strict frontend validation for exact doctor + date match across ALL statuses
      const isDuplicate = appointments.some(appt => 
        appt.doctorId === selectedDoctorDetails._id && 
        appt.date === date
      );

      if (isDuplicate) {
        showToast("You already have an appointment with this doctor on the selected date.", "error");
        return;
      }
    }

    setPaymentStep('SUMMARY');
  };

  const handleProcessPayment = async () => {
    if (!selectedPaymentMethod) {
      showToast("Please select a payment method.", "warning");
      return;
    }
    
    setIsProcessing(true);

    try {
      const res = await patientApi.bookAppointment({
        doctor_id: selectedDoctorDetails?._id,
        visitDate: date,
        chiefComplaint: complaints,
        followUp_for_record_id: followUpSourceId 
      });

      if (res.success && selectedDoctorDetails) {
        setPaymentStep('SUCCESS');
        
        setTimeout(async () => {
          setPaymentStep('HIDDEN');
          clearFollowUpBooking();
          
          // Re-fetch data to automatically recalculate linked statuses accurately
          await fetchBookingData();
          
          // Reset pagination to see the newest record
          setActivePage(1);
          setSelectedPaymentMethod('');
        }, 2000);

      } else {
        showToast(res.message || "Failed to book appointment.", "error");
      }
    } catch (error) {
      showToast("Network error processing appointment.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Reusable Pagination UI Renderer
  const renderPagination = (currentPage: number, totalItems: number, setPage: (page: number) => void) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    return (
      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between rounded-b-2xl">
        <span className="text-sm text-slate-500 hidden sm:inline-block">
          Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
        </span>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
          <button 
            onClick={() => setPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button 
              key={page} 
              onClick={() => setPage(page)}
              className={`w-8 h-8 rounded-lg font-semibold text-sm transition-colors ${
                currentPage === page 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button 
            onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div className="text-center py-20 text-slate-500">Loading booking data...</div>;
  }

  // Categorize Appointments strictly
  const activeAppointments = appointments.filter(a => !a.isFollowUpParent && (a.status === 'Upcoming' || a.status === 'Ongoing'));
  const completedAppointments = appointments.filter(a => !a.isFollowUpParent && (a.status === 'Completed' || a.status === 'Referred' || a.status === 'Not visited'));
  const followUpAppointments = appointments.filter(a => a.isFollowUpParent);

  // Paginate arrays
  const paginatedActive = activeAppointments.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage);
  const paginatedFollowUp = followUpAppointments.slice((followUpPage - 1) * itemsPerPage, followUpPage * itemsPerPage);
  const paginatedCompleted = completedAppointments.slice((completedPage - 1) * itemsPerPage, completedPage * itemsPerPage);

  // Dynamic Completed Columns
  const showFollowUpCol = completedAppointments.some(a => a.followUpDate);

  return (
    <div className="max-w-4xl mx-auto space-y-8 relative">

      {/* IN-VIEWPORT TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-top-4 ${
          toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 
          toast.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
          'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          <span className="font-semibold">{toast.message}</span>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-slate-900">Book Appointment</h2>
        <p className="text-slate-500">Schedule a new consultation with our specialists.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 relative transition-all hover:shadow-md">
        
        {isFollowUpBooking && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 text-orange-800 rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-bold">Booking a Follow-up Appointment</span>
            </div>
            <button onClick={clearFollowUpBooking} className="text-orange-600 hover:text-orange-900 bg-orange-100 hover:bg-orange-200 p-1.5 rounded-lg transition-colors flex items-center gap-1 text-sm font-semibold">
              <X className="w-4 h-4"/> Cancel Follow-up
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">Select Department</label>
            <select 
              value={department}
              onChange={(e) => { setDepartment(e.target.value); setSelectedDoctor(null); }}
              disabled={isFollowUpBooking}
              className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm bg-slate-50 focus:bg-white appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">All Departments</option>
              {departmentsList.map(dept => (
                <option key={dept._id} value={dept.name}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">Select Date</label>
            <input 
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setSelectedDoctor(null); }}
              disabled={isFollowUpBooking}
              min={new Date().toISOString().split('T')[0]} 
              className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm bg-slate-50 focus:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div className="space-y-2 mb-8">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-slate-700 block">Chief Complaints</label>
            <span className={`text-xs font-medium ${complaints.length >= 1000 ? 'text-red-500' : 'text-slate-400'}`}>
              {complaints.length} / 1000
            </span>
          </div>
          <textarea
            value={complaints}
            onChange={(e) => setComplaints(e.target.value)}
            disabled={isFollowUpBooking}
            maxLength={1000}
            rows={3}
            placeholder="Please briefly describe your symptoms or reason for the visit..."
            className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm bg-slate-50 focus:bg-white resize-none disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>

        <div className="space-y-4 animate-in fade-in duration-500">
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Available Doctors</h3>
          
          {!date ? (
            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              Please select a date to view doctor availability.
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              No doctors found for the selected department.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredDoctors.map(doc => (
                <button
                  key={doc._id}
                  onClick={() => !isFollowUpBooking && setSelectedDoctor(doc._id)}
                  disabled={isFollowUpBooking && selectedDoctor !== doc._id}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                    selectedDoctor === doc._id
                      ? 'border-blue-600 bg-blue-50 shadow-md shadow-blue-100 scale-[1.02] ring-2 ring-blue-400 ring-offset-1'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
                  } ${isFollowUpBooking && selectedDoctor !== doc._id ? 'opacity-40 cursor-not-allowed grayscale' : ''}`}
                >
                  {doc.avatar ? (
                     <img src={doc.avatar} alt={doc.firstName} className="w-12 h-12 rounded-full object-cover shrink-0 border border-blue-200 group-hover:border-blue-400 transition-all" />
                  ) : (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-bold border border-blue-200 bg-blue-100 text-blue-700 group-hover:bg-blue-200 transition-all">
                      {doc.firstName.charAt(0)}
                    </div>
                  )}

                  <div>
                    <p className="font-semibold text-slate-900">Dr. {doc.firstName} {doc.lastName}</p>
                    <p className="text-xs text-slate-500 mb-2">{doc.department || 'General'}</p>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-green-100 text-green-700">
                      Available
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {date && selectedDoctor && (
          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end animate-in fade-in slide-in-from-bottom-2">
            <button 
              onClick={handleConfirmAppointmentClick}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg shadow-blue-200 transition-all hover:scale-105 active:scale-95"
            >
              Confirm Appointment
            </button>
          </div>
        )}
      </div>

      {/* --- Upcoming & Ongoing Appointments Section --- */}
      {activeAppointments.length > 0 && (
        <div className="space-y-4 pt-6">
          <h3 className="text-xl font-bold text-slate-900">Upcoming Appointments</h3>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden transition-all hover:shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-700">Doctor Name</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Department</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Chief Complaints</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Date</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedActive.map((appt) => (
                    <tr 
                      key={appt.id} 
                      id={`appointment-${appt.id}`} 
                      className={`transition-all duration-500 ${
                        highlightedRecordId === appt.id ? 'bg-blue-50/80 border-l-4 border-blue-500' : 'hover:bg-slate-50/50 border-l-4 border-transparent'
                      }`}
                    >
                      <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">{appt.doctorName}</td>
                      <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{appt.department}</td>
                      <td className="px-6 py-4 text-slate-600 max-w-[250px] truncate">{appt.problem}</td>
                      <td className="px-6 py-4 text-slate-700 font-medium whitespace-nowrap">{appt.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          appt.status === 'Ongoing' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>
                          {appt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {renderPagination(activePage, activeAppointments.length, setActivePage)}
          </div>
        </div>
      )}

      {/* --- Follow-up Required Section --- */}
      {followUpAppointments.length > 0 && (
        <div className="space-y-4 pt-6">
          <h3 className="text-xl font-bold text-slate-900">Follow-up Required Appointments</h3>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden transition-all hover:shadow-md ring-1 ring-orange-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-orange-50 border-b border-orange-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-700">Doctor Name</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Department</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Chief Complaints</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Original Date</th>
                    <th className="px-6 py-4 font-bold text-orange-700">Must Book Before</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                    <th className="px-6 py-4 font-semibold text-slate-700 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedFollowUp.map((appt) => {
                    const canBook = appt.status === 'Follow up required';
                    return (
                      <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors border-l-4 border-transparent">
                        <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">{appt.doctorName}</td>
                        <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{appt.department}</td>
                        <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate">{appt.problem}</td>
                        <td className="px-6 py-4 text-slate-700 font-medium whitespace-nowrap">{appt.date}</td>
                        <td className="px-6 py-4 font-bold text-orange-600 whitespace-nowrap">
                          {appt.followUpDate ? new Date(appt.followUpDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold shadow-sm border ${
                            appt.status === 'Follow up required' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            appt.status === 'Appointment Booked' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            appt.status === 'Follow up completed' ? 'bg-green-50 text-green-700 border-green-200' :
                            'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {appt.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleBookFollowUp(appt)}
                            disabled={!canBook}
                            className="inline-flex items-center gap-1 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 hover:border-blue-300 border border-slate-200 transition-colors font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:border-slate-100 disabled:text-slate-400"
                          >
                            Book <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {renderPagination(followUpPage, followUpAppointments.length, setFollowUpPage)}
          </div>
        </div>
      )}

      {/* --- Completed Appointments Section --- */}
      {completedAppointments.length > 0 && (
        <div className="space-y-4 pt-6">
          <h3 className="text-xl font-bold text-slate-900">Completed Appointments</h3>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden transition-all hover:shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-700">Doctor Name</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Department</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Chief Complaints</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Date</th>
                    {showFollowUpCol && <th className="px-6 py-4 font-semibold text-slate-700">Follow-up Date</th>}
                    <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedCompleted.map((appt) => (
                    <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors border-l-4 border-transparent">
                      <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">{appt.doctorName}</td>
                      <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{appt.department}</td>
                      <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate">{appt.problem}</td>
                      <td className="px-6 py-4 text-slate-700 font-medium whitespace-nowrap">{appt.date}</td>
                      
                      {showFollowUpCol && (
                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                          {appt.followUpDate ? new Date(appt.followUpDate).toLocaleDateString() : 'N/A'}
                        </td>
                      )}
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          appt.status === 'Referred' ? 'bg-purple-50 text-purple-700 border-purple-100' : 
                          appt.status === 'Not visited' ? 'bg-red-50 text-red-700 border-red-100' :
                          'bg-green-50 text-green-700 border-green-100'
                        }`}>
                          {appt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {renderPagination(completedPage, completedAppointments.length, setCompletedPage)}
          </div>
        </div>
      )}

      {/* Payment Popover Modal */}
      {paymentStep !== 'HIDDEN' && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-900">
                {paymentStep === 'SUMMARY' ? 'Appointment Summary' : paymentStep === 'OPTIONS' ? 'Select Payment Method' : 'Payment Status'}
              </h3>
              {paymentStep !== 'SUCCESS' && !isProcessing && (
                <button 
                  onClick={() => setPaymentStep('HIDDEN')}
                  className="text-slate-400 hover:text-slate-600 bg-slate-200 hover:bg-slate-300 p-1.5 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="p-6 overflow-y-auto">
              
              {paymentStep === 'SUMMARY' && (
                <div className="space-y-5 animate-in slide-in-from-right-8 duration-300">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                    <p className="text-sm text-blue-600 font-semibold mb-1">Total Amount Due</p>
                    <p className="text-3xl font-bold text-slate-900">₹{APPOINTMENT_FEE}</p>
                  </div>
                  
                  <div className="space-y-3 text-sm border border-slate-100 rounded-xl p-4">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Patient Name:</span>
                      <span className="font-semibold text-slate-900">{patientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Doctor Name:</span>
                      <span className="font-semibold text-slate-900">Dr. {selectedDoctorDetails?.firstName} {selectedDoctorDetails?.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date:</span>
                      <span className="font-semibold text-slate-900">{date}</span>
                    </div>
                    <div className="pt-2 mt-2 border-t border-slate-100">
                      <span className="text-slate-500 block mb-1">Chief Complaints:</span>
                      <p className="text-slate-800 font-medium line-clamp-2">{complaints}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setPaymentStep('OPTIONS')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Proceed to Pay ₹{APPOINTMENT_FEE}
                  </button>
                </div>
              )}

              {paymentStep === 'OPTIONS' && (
                <div className="space-y-5 animate-in slide-in-from-right-8 duration-300">
                  <div className="space-y-3">
                    <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors ${selectedPaymentMethod === 'upi' ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}>
                      <input 
                        type="radio" 
                        name="payment_method" 
                        value="upi"
                        checked={selectedPaymentMethod === 'upi'}
                        onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        disabled={isProcessing}
                      />
                      <Smartphone className="w-6 h-6 text-slate-600" />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 text-sm">UPI (GPay, PhonePe, Paytm)</p>
                        <p className="text-xs text-slate-500">Instant payment via UPI apps</p>
                      </div>
                    </label>

                    <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors ${selectedPaymentMethod === 'card' ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}>
                      <input 
                        type="radio" 
                        name="payment_method" 
                        value="card"
                        checked={selectedPaymentMethod === 'card'}
                        onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        disabled={isProcessing}
                      />
                      <CreditCard className="w-6 h-6 text-slate-600" />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 text-sm">Credit / Debit Card</p>
                        <p className="text-xs text-slate-500">Visa, Mastercard, RuPay</p>
                      </div>
                    </label>

                    <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors ${selectedPaymentMethod === 'netbanking' ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}>
                      <input 
                        type="radio" 
                        name="payment_method" 
                        value="netbanking"
                        checked={selectedPaymentMethod === 'netbanking'}
                        onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        disabled={isProcessing}
                      />
                      <Building className="w-6 h-6 text-slate-600" />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 text-sm">Net Banking</p>
                        <p className="text-xs text-slate-500">All major Indian banks supported</p>
                      </div>
                    </label>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => setPaymentStep('SUMMARY')}
                      disabled={isProcessing}
                      className="px-6 py-3.5 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
                    >
                      Back
                    </button>
                    <button 
                      onClick={handleProcessPayment}
                      disabled={isProcessing}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? 'Processing...' : `Pay ₹${APPOINTMENT_FEE}`}
                    </button>
                  </div>
                </div>
              )}

              {paymentStep === 'SUCCESS' && (
                <div className="text-center py-8 animate-in zoom-in-95 duration-300">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600 animate-in spin-in-180 duration-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h3>
                  <p className="text-slate-500 mb-6">Your appointment has been confirmed. You can view it in the upcoming appointments section.</p>
                  <p className="text-sm text-slate-400">Redirecting...</p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookAppointmentView;