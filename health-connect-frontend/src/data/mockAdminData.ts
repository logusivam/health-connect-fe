import type { AdminProfile, PatientRecord, DoctorRecord, UnsuitableMedicineRecord, UserAccount, AuditLog } from '../types/admin.types';

export const mockAdmin: AdminProfile = {
  id: "ADM-9001",
  name: "Robert Admin",
  department: "IT Systems & Compliance",
  email: "r.admin@healthconnect.com",
  phone: "+1 (555) 000-1111",
  address: "Server Room A, Health Connect HQ",
  lastLogin: "Today, 07:05 AM"
};

export const mockPatients: PatientRecord[] = [
  {
    id: "p1", patientId: "PT-8842-91", name: "Jane Doe", bloodGroup: "O+", gender: "Female", dob: "1985-04-12",
    email: "jane.doe@example.com", phone: "+1 (555) 123-4567", address: "123 Wellness Ave",
    emergencyContact: "John Doe (Spouse) - 555-9876", knownProblems: ["Penicillin Allergy", "Hypertension"],
    activeDepartments: ["General Practice", "Cardiology"]
  }
];

export const mockDoctors: DoctorRecord[] = [
  {
    id: "d1", doctorId: "DOC-2048-55", name: "Dr. Sarah Jenkins", specialization: "General Medicine",
    department: "General Practice", email: "s.jenkins@healthconnect.com", phone: "+1 (555) 888-9999",
    address: "Suite 402, North Wing", status: "Online", lastLoginTime: "Today, 08:30 AM",
    totalPatientsTreated: 3420, flaggedMedicineCount: 12
  },
  {
    id: "d2", doctorId: "DOC-1024-44", name: "Dr. Michael Chen", specialization: "Cardiovascular",
    department: "Cardiology", email: "m.chen@healthconnect.com", phone: "+1 (555) 777-8888",
    address: "Suite 501, Heart Center", status: "Offline", lastLoginTime: "Yesterday, 06:15 PM",
    totalPatientsTreated: 5120, flaggedMedicineCount: 3
  }
];

export const mockMedicines: UnsuitableMedicineRecord[] = [
  {
    id: "m1", medicineName: "Penicillin VK 250mg", flag: "Unsuit", patientName: "Jane Doe", patientId: "PT-8842-91",
    reason: "Severe allergic reaction resulting in hives.", severity: "Severe", date: "2023-10-12", flaggedBy: "Dr. Sarah Jenkins"
  }
];

export const mockUsers: UserAccount[] = [
  { id: "u1", userId: "PT-8842-91", name: "Jane Doe", role: "Patient", email: "jane.doe@example.com", accountStatus: "Active", createdOn: "2022-01-15" },
  { id: "u2", userId: "DOC-2048-55", name: "Dr. Sarah Jenkins", role: "Doctor", email: "s.jenkins@healthconnect.com", accountStatus: "Active", createdOn: "2021-11-05" },
  { id: "u3", userId: "PT-9999-00", name: "Spam Account", role: "Patient", email: "spam@fake.com", accountStatus: "Suspended", createdOn: "2024-03-01" }
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: "log-001", timestamp: "2024-03-13 10:45:12", actorRole: "Doctor", actionType: "UPDATE", entityType: "treatment_record",
    oldValues: '{"status": "Ongoing"}', newValues: '{"status": "Resolved"}'
  },
  {
    id: "log-002", timestamp: "2024-03-13 09:12:05", actorRole: "Admin", actionType: "EXPORT", entityType: "patient",
    oldValues: 'null', newValues: '{"format": "PDF", "timeframe": "Last 30 Days"}'
  }
];