export type ViewState = 'DASHBOARD' | 'TREATMENT_HISTORY' | 'TREATMENT_RECORDS' | 'MEDICATION_FLAGS' | 'PROFILE';

export interface DoctorProfile {
  id: string;
  name: string;
  specialization: string;
  department: string;
  email: string;
  phone: string;
  address: string;
  lastLogin: string;
  avatar?: string;
  totalPatientsTreated: number;
}

export interface TreatmentRecord {
  id: string;
  date: string;
  complaint: string;
  diagnosis: string;
  treatmentPrescribed: string;
  followUpDate: string;
  followUpInstruction: string;
  outcomeStatus: 'Ongoing' | 'Resolved' | 'Referred' | 'Follow up required';
  additionalNotes: string;
  medicineName: string;
  frequency: string;
  durationDays: number | '';
  medNotes: string;
  patientName: string; 
}

export interface MedicationFlag {
  id: string;
  medicineName: string;
  flag: 'Unsuit' | 'Suit';
  flaggedBy: string; 
  flaggedFor: string; 
  patientId: string;
  reason: string;
  date: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
}

export interface PatientHistoryRecord {
  id: string;
  patientId: string;
  patientName: string;
  avatar?: string;
  department: string[];
  diagnosis: string;
  status: 'Ongoing' | 'Resolved' | 'Referred' | 'Follow up required';
  doctors: { id: string; name: string; avatar?: string }[];
  lastDateVisited: string;
}