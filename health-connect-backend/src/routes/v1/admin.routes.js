import express from 'express';
import { getAdminProfile, updateAdminProfile } from '../../controllers/v1/admin.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/profile', protect, getAdminProfile);
router.put('/profile', protect, updateAdminProfile);

export default router;