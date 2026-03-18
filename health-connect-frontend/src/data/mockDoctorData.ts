import type { DoctorProfile, TreatmentRecord, MedicationFlag, PatientHistoryRecord } from '../types/doctor.types';

export const mockDoctor: DoctorProfile = {
  id: "DOC-2048-55",
  name: "Dr. Sarah Jenkins",
  specialization: "General Medicine",
  department: "General Practice",
  email: "s.jenkins@healthconnect.com",
  phone: "+1 (555) 888-9999",
  address: "Suite 402, North Wing, Health City Hospital",
  lastLogin: "Today, 08:30 AM",
  avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150&h=150",
  totalPatientsTreated: 3420
};

// Mock patient database for auto-fetching
export const mockPatientsDb: Record<string, string> = {
  "PT-8842-91": "Jane Doe",
  "PT-1029-44": "Michael Lawson",
  "PT-4432-11": "Sarah Connor",
  "PT-9981-22": "David Smith"
};

export const initialTreatmentRecords: TreatmentRecord[] = [
  {
    id: "TR-001",
    date: "2024-02-14",
    patientName: "Jane Doe",
    complaint: "Severe headache and slight fever for 3 days.",
    diagnosis: "Viral Migraine",
    treatmentPrescribed: "Rest and hydration.",
    followUpDate: "2024-02-21",
    followUpInstruction: "Return if fever exceeds 102F.",
    outcomeStatus: "Ongoing",
    additionalNotes: "Patient looked fatigued.",
    medicineName: "Acetaminophen 500mg",
    frequency: "Twice daily",
    durationDays: 5,
    medNotes: "Take after meals."
  },
  {
    id: "TR-002",
    date: "2024-02-10",
    patientName: "Michael Lawson",
    complaint: "Persistent cough.",
    diagnosis: "Acute Bronchitis",
    treatmentPrescribed: "Inhaler and cough syrup.",
    followUpDate: "",
    followUpInstruction: "None",
    outcomeStatus: "Resolved",
    additionalNotes: "",
    medicineName: "Albuterol",
    frequency: "As needed",
    durationDays: 14,
    medNotes: ""
  }
];

export const initialFlags: MedicationFlag[] = [
  {
    id: "FLG-101",
    medicineName: "Penicillin VK 250mg",
    flag: "Unsuit",
    flaggedBy: "Dr. Sarah Jenkins (DOC-2048-55)",
    flaggedFor: "Jane Doe",
    patientId: "PT-8842-91",
    reason: "Severe allergic reaction resulting in hives.",
    date: "2023-10-12",
    severity: "Severe"
  }
];

export const mockPatientHistory: PatientHistoryRecord[] = [
  {
    id: '1',
    patientId: 'PT-8842-91',
    patientName: 'Jane Doe',
    department: ['General Practice', 'Cardiology'],
    diagnosis: 'Viral Migraine, Hypertension',
    status: 'Ongoing',
    doctors: [
      { id: 'DOC-2048-55', name: 'Dr. Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150&h=150' },
      { id: 'DOC-1024-44', name: 'Dr. Michael Chen' }
    ],
    lastDateVisited: '2024-02-14'
  },
  {
    id: '2',
    patientId: 'PT-1029-44',
    patientName: 'Michael Lawson',
    department: ['General Practice'],
    diagnosis: 'Acute Bronchitis',
    status: 'Resolved',
    doctors: [
      { id: 'DOC-2048-55', name: 'Dr. Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150&h=150' }
    ],
    lastDateVisited: '2024-02-10'
  },
  {
    id: '3',
    patientId: 'PT-9981-22',
    patientName: 'David Smith',
    department: ['Dermatology'],
    diagnosis: 'Eczema',
    status: 'Ongoing',
    doctors: [
      { id: 'DOC-5555-11', name: 'Dr. Emily Stone' }
    ],
    lastDateVisited: '2024-01-20' 
  }
];