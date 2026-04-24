import express from 'express';
import { getAdminProfile } from '../../controllers/v1/admin.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/profile', protect, getAdminProfile);

export default router;