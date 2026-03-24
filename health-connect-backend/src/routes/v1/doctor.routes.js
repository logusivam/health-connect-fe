import express from 'express';
import { getDoctorProfile, updateDoctorProfile, getDoctorDirectory, searchPatients,
    getDepartmentMedicines, getFlags, createFlag, updateFlag
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

export default router;