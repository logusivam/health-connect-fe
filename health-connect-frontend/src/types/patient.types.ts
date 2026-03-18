export type ViewState = 'DASHBOARD' | 'HISTORY' | 'UNSUITABLE_MEDICINE' | 'BOOK_APPOINTMENT' | 'PROFILE';

export interface PatientProfile {
  id: string;
  name: string;
  dob: string;
  gender: string;
  bloodGroup: string;
  contact: string;
  email: string;
  address: string;
  allergies: string[];
  avatar?: string;
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  }
}

export interface Medication {
  id: string;
  name: string;
  frequency: string;
  duration: string;
  fromDate: string;
  toDate: string;
  doctorName: string;
}

export interface TreatmentRecord {
  id: string;
  date: string;
  doctorName: string;
  specialty: string;
  diagnosis: string;
  prescription: string[];
  notes: string;
}

export interface UnsuitableMedicine {
  id: string;
  medicineName: string;
  flaggedBy: string;
  department: string;
  reason: string;
  dateFlagged: string;
}

export interface BookedAppointment {
  id: string;
  doctorName: string;
  department: string;
  problem: string;
  date: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled';
}