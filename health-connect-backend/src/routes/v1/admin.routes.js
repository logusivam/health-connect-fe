import express from 'express';
import { getAdminProfile, updateAdminProfile, getAllPatients,
    updatePatientByAdmin, deletePatientByAdmin, getAllDoctors,
    updateDoctorByAdmin, deleteDoctorByAdmin
 } from '../../controllers/v1/admin.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// Admin Profile Routes
router.get('/profile', protect, getAdminProfile);
router.put('/profile', protect, updateAdminProfile);

// Patient Management Routes
router.get('/patients', protect, getAllPatients);
router.put('/patients/:id', protect, updatePatientByAdmin);
router.delete('/patients/:id', protect, deletePatientByAdmin);

// Doctor Management Routes
router.get('/doctors', protect, getAllDoctors);
router.put('/doctors/:id', protect, updateDoctorByAdmin);
router.delete('/doctors/:id', protect, deleteDoctorByAdmin);

export default router;