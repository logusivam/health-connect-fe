import express from 'express';
import authRoutes from './auth.routes.js';
import patientRoutes from './patient.routes.js';
import doctorRoutes from './doctor.routes.js';
import metadataRoutes from './metadata.routes.js';
import adminRoutes from './admin.routes.js';

const router = express.Router();

// Mount sub-routers
router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/doctors', doctorRoutes);
router.use('/metadata', metadataRoutes);
router.use('/admins', adminRoutes);

export default router;