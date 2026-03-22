import express from 'express';
import { getPatientProfile, updatePatientProfile } from '../../controllers/v1/patient.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// Protected routes (Requires valid JWT token)
router.get('/profile', protect, getPatientProfile);
router.put('/profile', protect, updatePatientProfile);

export default router;