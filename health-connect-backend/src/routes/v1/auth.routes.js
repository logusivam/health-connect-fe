import express from 'express';
import { registerUser, loginUser, logoutUser, getMe, sendPasswordResetOtp, verifyPasswordResetOtp, resetPassword } from '../../controllers/v1/auth.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);

// Password Reset Routes
router.post('/forgot-password/send-otp', sendPasswordResetOtp);
router.post('/forgot-password/verify-otp', verifyPasswordResetOtp);
router.post('/forgot-password/reset', resetPassword);

export default router;
