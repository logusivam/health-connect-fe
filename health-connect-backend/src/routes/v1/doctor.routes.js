import express from 'express';
import { getDoctorProfile, updateDoctorProfile, getDoctorDirectory, searchPatients,
    getDepartmentMedicines, getFlags, createFlag, updateFlag, getTodayAppointments,
    getTreatmentRecords, updateTreatmentRecord, getPatientsHistory
 } from '../../controllers/v1/doctor.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/profile', protect, getDoctorProfile);
router.put('/profile', protect, updateDoctorProfile);
router.get('/directory', protect, getDoctorDirectory);
// NEW: Clinical Flagging Routes
router.get('/patients/search', protect, searchPatients);
router.get('/medicines', protect, getDepartmentMedicines);
router.get('/flags', protect, getFlags);
router.post('/flags', protect, createFlag);
router.put('/flags/:id', protect, updateFlag);
// Clinical Record Routes
router.get('/appointments/today', protect, getTodayAppointments);
router.get('/treatment-records', protect, getTreatmentRecords);
router.put('/treatment-records/:id', protect, updateTreatmentRecord);

// NEW: Global Patients History Endpoint
router.get('/patients-history', protect, getPatientsHistory); 

export default router;