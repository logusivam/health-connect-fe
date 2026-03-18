import express from 'express';
import { registerUser } from '../../controllers/v1/auth.controller.js';

const router = express.Router();

router.post('/register', registerUser);

export default router;