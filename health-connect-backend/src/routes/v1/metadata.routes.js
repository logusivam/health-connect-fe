import express from 'express';
import { getDepartments } from '../../controllers/v1/metadata.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// Protect this route so only logged-in users can fetch the list
router.get('/departments', protect, getDepartments);

export default router;