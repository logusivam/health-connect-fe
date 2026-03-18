export type ViewState = 'PROFILE' | 'PATIENT_RECORDS' | 'DOCTOR_RECORDS' | 'UNSUITABLE_MEDICINE' | 'MANAGE_USERS' | 'AUDIT_LOGS';

export interface AdminProfile {
  id: string;
  name: string;
  department: string;
  email: string;
  phone: string;
  address: string;
  lastLogin: string;
  avatar?: string;
}

export interface PatientRecord {
  id: string;
  patientId: string;
  name: string;
  avatar?: string;
  bloodGroup: string;
  gender: string;
  dob: string;
  email: string;
  phone: string;
  address: string;
  emergencyContact: string;
  knownProblems: string[];
  activeDepartments: string[];
}

export interface DoctorRecord {
  id: string;
  doctorId: string;
  name: string;
  avatar?: string;
  specialization: string;
  department: string;
  email: string;
  phone: string;
  address: string;
  status: 'Online' | 'Offline';
  lastLoginTime: string;
  totalPatientsTreated: number;
  flaggedMedicineCount: number;
}

export interface UnsuitableMedicineRecord {
  id: string;
  medicineName: string;
  flag: 'Unsuit' | 'Suit';
  patientName: string;
  patientId: string;
  reason: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  date: string;
  flaggedBy: string;
}

export interface UserAccount {
  id: string;
  userId: string;
  name: string;
  role: 'Patient' | 'Doctor' | 'Admin';
  email: string;
  accountStatus: 'Active' | 'Suspended';
  createdOn: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorRole: string;
  actionType: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'MFA_ATTEMPT';
  entityType: 'treatment_record' | 'patient' | 'unsuitable_medicine' | 'user' | 'export';
  oldValues: string;
  newValues: string;
}