import { Router } from 'express';
import { register, login, me, updateProfile, forgotPassword, resetPassword } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { upload } from '../utils/upload.js';
import { registerSchema, loginSchema, profileSchema, forgotPasswordSchema, resetPasswordSchema } from '../utils/schemas.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.get('/me', auth, me);
router.put('/profile', auth, upload.single('avatar'), validate(profileSchema), updateProfile);

export default router;
