import React, { useState, useEffect } from 'react';
import { Calendar, Smartphone, CreditCard, Building, X, CheckCircle2 } from 'lucide-react';
import { metadataApi, doctorApi, patientApi } from '../../services/api'; 

type PaymentStep = 'HIDDEN' | 'SUMMARY' | 'OPTIONS' | 'SUCCESS';

interface BookedAppointment {
  id: string;
  doctorName: string;
  department: string;
  problem: string;
  date: string;
  followUpDate?: string | null;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Referred' | 'Follow up required';
}

interface BookAppointmentViewProps {
  highlightedRecordId?: string | null;
}

const BookAppointmentView: React.FC<BookAppointmentViewProps> = ({ highlightedRecordId }) => {
  const [department, setDepartment] = useState('');
  const [date, setDate] = useState('');
  const [complaints, setComplaints] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  
  const [appointments, setAppointments] = useState<BookedAppointment[]>([]);
  
  // Real Data States
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [patientName, setPatientName] = useState<string>('Loading...'); 
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false); 

  // Payment Modal State
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('HIDDEN');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

  const APPOINTMENT_FEE = 500; 

  // --- NEW: Dynamic Real-time Status Calculator ---
  const calculateStatus = (record: any): BookedAppointment['status'] => {
    // 1. Check for Doctor-Defined Outcomes first
    if (record.outcomeStatus === 'Resolved') return 'Completed';
    if (record.outcomeStatus === 'Referred' && record.followUpDate) return 'Referred';
    if (record.outcomeStatus === 'Follow up required' && record.followUpDate) return 'Follow up required';

    // 2. Fallback to Date-based logic for pending/new appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    
    const apptDate = new Date(record.visitDate);
    apptDate.setHours(0, 0, 0, 0);

    const timeDiff = apptDate.getTime() - today.getTime();

    if (timeDiff > 0) return 'Upcoming';
    if (timeDiff === 0) return 'Ongoing';
    return 'Completed'; // If in the past and no outcome set yet
  };

  useEffect(() => {
    const fetchBookingData = async () => {
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
          const formattedAppts = apptsRes.data.map((record: any) => ({
            id: record._id,
            doctorName: `Dr. ${record.doctor_id.firstName} ${record.doctor_id.lastName}`,
            department: record.doctor_id.department || 'General',
            problem: record.chiefComplaint,
            date: new Date(record.visitDate).toISOString().split('T')[0],
            followUpDate: record.followUpDate,
            status: calculateStatus(record)
          }));
          setAppointments(formattedAppts);
        }
      } catch (error) {
        console.error("Failed to load booking data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookingData();
  }, []);

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

  const handleConfirmAppointmentClick = () => {
    if (!complaints.trim()) {
      alert("Please provide your chief complaints.");
      return;
    }
    setPaymentStep('SUMMARY');
  };

  const handleProcessPayment = async () => {
    if (!selectedPaymentMethod) {
      alert("Please select a payment method.");
      return;
    }
    
    setIsProcessing(true);

    try {
      const res = await patientApi.bookAppointment({
        doctor_id: selectedDoctorDetails._id,
        visitDate: date,
        chiefComplaint: complaints
      });

      if (res.success) {
        setPaymentStep('SUCCESS');
        
        const newRecordObj = { visitDate: date }; // Temp object to calculate initial status
        
        const newAppointment: BookedAppointment = {
          id: res.data._id,
          doctorName: `Dr. ${selectedDoctorDetails.firstName} ${selectedDoctorDetails.lastName}`,
          department: department || selectedDoctorDetails?.department || 'General Practice',
          problem: complaints,
          date: date,
          followUpDate: null,
          status: calculateStatus(newRecordObj)
        };
        
        setAppointments([newAppointment, ...appointments]);

        setTimeout(() => {
          setPaymentStep('HIDDEN');
          setDepartment('');
          setDate('');
          setComplaints('');
          setSelectedDoctor(null);
          setSelectedPaymentMethod('');
        }, 2500);
      } else {
        alert(res.message || "Failed to book appointment.");
      }
    } catch (error) {
      alert("Network error processing appointment.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-20 text-slate-500">Loading booking data...</div>;
  }

  // Categorize Appointments
  const activeAppointments = appointments.filter(a => a.status === 'Upcoming' || a.status === 'Ongoing');
  const completedAppointments = appointments.filter(a => a.status === 'Completed' || a.status === 'Referred');
  const followUpAppointments = appointments.filter(a => a.status === 'Follow up required');

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Book Appointment</h2>
        <p className="text-slate-500">Schedule a new consultation with our specialists.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 relative transition-all hover:shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">Select Department</label>
            <select 
              value={department}
              onChange={(e) => { setDepartment(e.target.value); setSelectedDoctor(null); }}
              className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm bg-slate-50 focus:bg-white appearance-none cursor-pointer"
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
              min={new Date().toISOString().split('T')[0]} 
              className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm bg-slate-50 focus:bg-white cursor-pointer"
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
            maxLength={1000}
            rows={3}
            placeholder="Please briefly describe your symptoms or reason for the visit..."
            className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm bg-slate-50 focus:bg-white resize-none"
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
                  onClick={() => setSelectedDoctor(doc._id)}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                    selectedDoctor === doc._id
                      ? 'border-blue-600 bg-blue-50 shadow-md shadow-blue-100 scale-[1.02]'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
                  }`}
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
      <div className="space-y-4 pt-6">
        <h3 className="text-xl font-bold text-slate-900">Upcoming Appointments</h3>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
          {activeAppointments.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              You have no active appointments.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-700">Doctor Name</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Department</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Chief Complaints</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Date</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Follow-up Date</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeAppointments.map((appt) => (
                    <tr 
                      key={appt.id} 
                      id={`appointment-${appt.id}`} 
                      className={`transition-all duration-500 ${
                        highlightedRecordId === appt.id ? 'bg-blue-50/80 border-l-4 border-blue-500' : 'hover:bg-slate-50/50 border-l-4 border-transparent'
                      }`}
                    >
                      <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">{appt.doctorName}</td>
                      <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{appt.department}</td>
                      <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate">{appt.problem}</td>
                      <td className="px-6 py-4 text-slate-700 font-medium whitespace-nowrap">{appt.date}</td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        {appt.followUpDate ? new Date(appt.followUpDate).toLocaleDateString() : 'N/A'}
                      </td>
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
          )}
        </div>
      </div>

      {/* --- Completed Appointments Section --- */}
      {completedAppointments.length > 0 && (
        <div className="space-y-4 pt-6">
          <h3 className="text-xl font-bold text-slate-900">Completed Appointments</h3>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-700">Doctor Name</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Department</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Chief Complaints</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Date</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Follow-up Date</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completedAppointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors border-l-4 border-transparent">
                      <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">{appt.doctorName}</td>
                      <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{appt.department}</td>
                      <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate">{appt.problem}</td>
                      <td className="px-6 py-4 text-slate-700 font-medium whitespace-nowrap">{appt.date}</td>
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        {appt.followUpDate ? new Date(appt.followUpDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          appt.status === 'Referred' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-green-50 text-green-700 border border-green-100'
                        }`}>
                          {appt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- Follow-up Required Section --- */}
      {followUpAppointments.length > 0 && (
        <div className="space-y-4 pt-6">
          <h3 className="text-xl font-bold text-slate-900">Follow-up Required Appointments</h3>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md ring-1 ring-orange-200">
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {followUpAppointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors border-l-4 border-transparent">
                      <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">{appt.doctorName}</td>
                      <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{appt.department}</td>
                      <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate">{appt.problem}</td>
                      <td className="px-6 py-4 text-slate-700 font-medium whitespace-nowrap">{appt.date}</td>
                      <td className="px-6 py-4 font-bold text-orange-600 whitespace-nowrap">
                        {appt.followUpDate ? new Date(appt.followUpDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200 shadow-sm">
                          {appt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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