import express from 'express';
import { getDoctorProfile, updateDoctorProfile, getDoctorDirectory } from '../../controllers/v1/doctor.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/profile', protect, getDoctorProfile);
router.put('/profile', protect, updateDoctorProfile);
router.get('/directory', protect, getDoctorDirectory);

export default router;