import express from 'express';
import authRoutes from './auth.routes.js';
import patientRoutes from './patient.routes.js';
import doctorRoutes from './doctor.routes.js';

const router = express.Router();

// Mount sub-routers
router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/doctors', doctorRoutes);

export default router;