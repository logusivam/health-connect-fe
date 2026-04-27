import express from 'express';
import { getAdminProfile, updateAdminProfile, getAllPatients,
    updatePatientByAdmin, deletePatientByAdmin
 } from '../../controllers/v1/admin.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/profile', protect, getAdminProfile);
router.put('/profile', protect, updateAdminProfile);
router.get('/patients', protect, getAllPatients);
router.put('/patients/:id', protect, updatePatientByAdmin);
router.delete('/patients/:id', protect, deletePatientByAdmin);

export default router;