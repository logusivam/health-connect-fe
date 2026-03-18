import React, { useState } from 'react';
import { Calendar, Smartphone, CreditCard, Building, X, CheckCircle2 } from 'lucide-react';
import type { BookedAppointment } from '../../types/patient.types';
import { mockDepartments, mockDoctors, initialAppointments, mockProfile } from '../../data/mockPatientData';

type PaymentStep = 'HIDDEN' | 'SUMMARY' | 'OPTIONS' | 'SUCCESS';

const BookAppointmentView: React.FC = () => {
  const [department, setDepartment] = useState('');
  const [date, setDate] = useState('');
  const [problemBrief, setProblemBrief] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  
  const [appointments, setAppointments] = useState<BookedAppointment[]>(initialAppointments);
  
  // Payment Modal State
  const [paymentStep, setPaymentStep] = useState<PaymentStep>('HIDDEN');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

  const APPOINTMENT_FEE = 500; // in INR

  // Mock availability logic purely for demonstration: available based on date odd/even parity 
  const dayOfMonth = date ? new Date(date).getDate() : 0;
  
  const filteredDoctors = mockDoctors.filter(doc => !department || doc.specialty === department).map(doc => {
    const isDocEven = parseInt(doc.id.split('-')[1] || '0') % 2 === 0;
    const isDateEven = dayOfMonth % 2 === 0;
    const isAvailable = date ? (isDocEven === isDateEven) : false;
    
    return { ...doc, isAvailable };
  });

  const selectedDoctorDetails = mockDoctors.find(d => d.id === selectedDoctor);

  const handleConfirmAppointmentClick = () => {
    if (!problemBrief.trim()) {
      alert("Please provide a brief description of your problem.");
      return;
    }
    setPaymentStep('SUMMARY');
  };

  const handleProcessPayment = () => {
    if (!selectedPaymentMethod) {
      alert("Please select a payment method.");
      return;
    }
    
    setPaymentStep('SUCCESS');
    
    // Add to upcoming appointments
    const newAppointment: BookedAppointment = {
      id: `apt-${Date.now()}`,
      doctorName: selectedDoctorDetails?.name || 'Unknown Doctor',
      department: department || selectedDoctorDetails?.specialty || 'General Practice',
      problem: problemBrief,
      date: date,
      status: 'Upcoming'
    };
    
    setAppointments([newAppointment, ...appointments]);

    // Auto close and reset
    setTimeout(() => {
      setPaymentStep('HIDDEN');
      setDepartment('');
      setDate('');
      setProblemBrief('');
      setSelectedDoctor(null);
      setSelectedPaymentMethod('');
    }, 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Book Appointment</h2>
        <p className="text-slate-500">Schedule a new consultation with our specialists.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 relative transition-all hover:shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Department Dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">Select Department</label>
            <select 
              value={department}
              onChange={(e) => { setDepartment(e.target.value); setSelectedDoctor(null); }}
              className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm bg-slate-50 focus:bg-white appearance-none cursor-pointer"
            >
              <option value="">All Departments</option>
              {mockDepartments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 block">Select Date</label>
            <input 
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setSelectedDoctor(null); }}
              min={new Date().toISOString().split('T')[0]} // prevent past dates
              className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm bg-slate-50 focus:bg-white cursor-pointer"
            />
          </div>
        </div>

        {/* Problem Brief Field */}
        <div className="space-y-2 mb-8">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-slate-700 block">Problem Brief</label>
            <span className={`text-xs font-medium ${problemBrief.length >= 1000 ? 'text-red-500' : 'text-slate-400'}`}>
              {problemBrief.length} / 1000
            </span>
          </div>
          <textarea
            value={problemBrief}
            onChange={(e) => setProblemBrief(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Please briefly describe your symptoms or reason for the visit..."
            className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm bg-slate-50 focus:bg-white resize-none"
          />
        </div>

        {/* Doctors List */}
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
                  key={doc.id}
                  disabled={!doc.isAvailable}
                  onClick={() => setSelectedDoctor(doc.id)}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                    !doc.isAvailable 
                      ? 'opacity-60 cursor-not-allowed border-slate-100 bg-slate-50' 
                      : selectedDoctor === doc.id
                        ? 'border-blue-600 bg-blue-50 shadow-md shadow-blue-100 scale-[1.02]'
                        : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
                  }`}
                >
                  {/* Avatar rendering */}
                  {doc.avatar ? (
                     <img src={doc.avatar} alt={doc.name} className={`w-12 h-12 rounded-full object-cover shrink-0 border transition-all ${!doc.isAvailable ? 'border-slate-200 grayscale' : 'border-blue-200 group-hover:border-blue-400'}`} />
                  ) : (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 font-bold border transition-all ${
                      !doc.isAvailable ? 'bg-slate-200 text-slate-500 border-slate-200' : 'bg-blue-100 text-blue-700 border-blue-200 group-hover:bg-blue-200'
                    }`}>
                      {doc.name.replace('Dr. ', '').charAt(0)}
                    </div>
                  )}

                  <div>
                    <p className={`font-semibold ${!doc.isAvailable ? 'text-slate-600' : 'text-slate-900'}`}>{doc.name}</p>
                    <p className="text-xs text-slate-500 mb-2">{doc.specialty}</p>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                      doc.isAvailable ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {doc.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
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

      {/* Upcoming Appointments Section */}
      <div className="space-y-4 pt-6">
        <h3 className="text-xl font-bold text-slate-900">Upcoming Appointments</h3>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
          {appointments.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              You have no appointments scheduled.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-slate-700">Doctor Name</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Department</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Problem Brief</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Date</th>
                    <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">
                        {appt.doctorName}
                      </td>
                      <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                        {appt.department}
                      </td>
                      <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate">
                        {appt.problem}
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-medium whitespace-nowrap">
                        {appt.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          appt.status === 'Upcoming' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          appt.status === 'Completed' ? 'bg-green-50 text-green-700 border border-green-100' :
                          'bg-red-50 text-red-700 border border-red-100'
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

      {/* Payment Popover Modal */}
      {paymentStep !== 'HIDDEN' && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <h3 className="font-bold text-slate-900">
                {paymentStep === 'SUMMARY' ? 'Appointment Summary' : paymentStep === 'OPTIONS' ? 'Select Payment Method' : 'Payment Status'}
              </h3>
              {paymentStep !== 'SUCCESS' && (
                <button 
                  onClick={() => setPaymentStep('HIDDEN')}
                  className="text-slate-400 hover:text-slate-600 bg-slate-200 hover:bg-slate-300 p-1.5 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Content Area */}
            <div className="p-6 overflow-y-auto">
              
              {/* Step 1: Summary */}
              {paymentStep === 'SUMMARY' && (
                <div className="space-y-5 animate-in slide-in-from-right-8 duration-300">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                    <p className="text-sm text-blue-600 font-semibold mb-1">Total Amount Due</p>
                    <p className="text-3xl font-bold text-slate-900">₹{APPOINTMENT_FEE}</p>
                  </div>
                  
                  <div className="space-y-3 text-sm border border-slate-100 rounded-xl p-4">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Patient Name:</span>
                      <span className="font-semibold text-slate-900">{mockProfile.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Doctor Name:</span>
                      <span className="font-semibold text-slate-900">{selectedDoctorDetails?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date:</span>
                      <span className="font-semibold text-slate-900">{date}</span>
                    </div>
                    <div className="pt-2 mt-2 border-t border-slate-100">
                      <span className="text-slate-500 block mb-1">Problem Brief:</span>
                      <p className="text-slate-800 font-medium line-clamp-2">{problemBrief}</p>
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

              {/* Step 2: Payment Options */}
              {paymentStep === 'OPTIONS' && (
                <div className="space-y-5 animate-in slide-in-from-right-8 duration-300">
                  <div className="space-y-3">
                    {/* UPI Option */}
                    <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors ${selectedPaymentMethod === 'upi' ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}>
                      <input 
                        type="radio" 
                        name="payment_method" 
                        value="upi"
                        checked={selectedPaymentMethod === 'upi'}
                        onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <Smartphone className="w-6 h-6 text-slate-600" />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 text-sm">UPI (GPay, PhonePe, Paytm)</p>
                        <p className="text-xs text-slate-500">Instant payment via UPI apps</p>
                      </div>
                    </label>

                    {/* Card Option */}
                    <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors ${selectedPaymentMethod === 'card' ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}>
                      <input 
                        type="radio" 
                        name="payment_method" 
                        value="card"
                        checked={selectedPaymentMethod === 'card'}
                        onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <CreditCard className="w-6 h-6 text-slate-600" />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 text-sm">Credit / Debit Card</p>
                        <p className="text-xs text-slate-500">Visa, Mastercard, RuPay</p>
                      </div>
                    </label>

                    {/* Net Banking Option */}
                    <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors ${selectedPaymentMethod === 'netbanking' ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}>
                      <input 
                        type="radio" 
                        name="payment_method" 
                        value="netbanking"
                        checked={selectedPaymentMethod === 'netbanking'}
                        onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
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
                      className="px-6 py-3.5 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      Back
                    </button>
                    <button 
                      onClick={handleProcessPayment}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-200 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Pay ₹{APPOINTMENT_FEE}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Success */}
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