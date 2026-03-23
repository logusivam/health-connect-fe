import express from 'express';
import { getPatientProfile, updatePatientProfile, bookAppointment, getPatientAppointments } from '../../controllers/v1/patient.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// Protected routes (Requires valid JWT token)
router.get('/profile', protect, getPatientProfile);
router.put('/profile', protect, updatePatientProfile);
router.post('/appointments', protect, bookAppointment);
router.get('/get-appointments', protect, getPatientAppointments);

export default router;