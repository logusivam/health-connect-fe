import type { PatientProfile, Medication, TreatmentRecord, BookedAppointment } from '../types/patient.types';

export const mockProfile: PatientProfile = {
  id: "PT-8842-91",
  name: "Jane Doe",
  dob: "1985-04-12",
  gender: "Female",
  bloodGroup: "O+",
  contact: "+1 (555) 123-4567",
  email: "jane.doe@example.com",
  address: "123 Wellness Ave, Health City, HC 90210",
  allergies: ["Penicillin", "Peanuts"],
  emergencyContact: {
    name: "John Doe",
    relation: "Spouse",
    phone: "+1 (555) 987-6543"
  }
};

export const mockMedications: Medication[] = [
  { id: 'm1', name: 'Lisinopril 10mg', frequency: 'Daily', duration: '3 Months', fromDate: 'Nov 01, 2023', toDate: 'Feb 01, 2024', doctorName: 'Dr. Sarah Jenkins' },
  { id: 'm2', name: 'Vitamin D3', frequency: 'Weekly', duration: '6 Months', fromDate: 'Oct 15, 2023', toDate: 'Apr 15, 2024', doctorName: 'Dr. Michael Chen' }
];

export const mockDepartments = ['General Practice', 'Cardiology', 'Dermatology', 'Neurology', 'Orthopedics'];

export const mockDoctors = [
  { id: 'doc-1', name: 'Dr. Sarah Jenkins', specialty: 'General Practice', avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150&h=150' },
  { id: 'doc-2', name: 'Dr. Michael Chen', specialty: 'Cardiology' },
  { id: 'doc-3', name: 'Dr. Emily Stone', specialty: 'Dermatology' },
  { id: 'doc-4', name: 'Dr. James Wilson', specialty: 'Neurology' },
  { id: 'doc-5', name: 'Dr. Robert Chase', specialty: 'General Practice' }
];

export const mockHistory: TreatmentRecord[] = [
  {
    id: "TR-2023-11-01",
    date: "Nov 01, 2023",
    doctorName: "Dr. Sarah Jenkins",
    specialty: "General Practice",
    diagnosis: "Acute Bronchitis",
    prescription: ["Amoxicillin 500mg", "Albuterol Inhaler"],
    notes: "Patient advised to rest and stay hydrated. Follow up in 2 weeks if symptoms persist."
  },
  {
    id: "TR-2023-06-15",
    date: "Jun 15, 2023",
    doctorName: "Dr. Michael Chen",
    specialty: "Cardiology",
    diagnosis: "Routine Checkup - Normal",
    prescription: ["None"],
    notes: "EKG normal. Blood pressure slightly elevated but within acceptable range. Recommended dietary adjustments."
  },
  {
    id: "TR-2022-12-05",
    date: "Dec 05, 2022",
    doctorName: "Dr. Emily Stone",
    specialty: "Dermatology",
    diagnosis: "Contact Dermatitis",
    prescription: ["Hydrocortisone Cream 1%", "Loratadine 10mg"],
    notes: "Rash on left arm likely due to allergic reaction. Apply cream twice daily."
  }
];

export const initialAppointments: BookedAppointment[] = [
  { id: 'apt-1', doctorName: 'Dr. Michael Chen', problem: 'Routine Heart Checkup', date: '2024-03-15', status: 'Upcoming' },
  { id: 'apt-2', doctorName: 'Dr. Sarah Jenkins', problem: 'Seasonal flu symptoms', date: '2023-11-01', status: 'Completed' }
];