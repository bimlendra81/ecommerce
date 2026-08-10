import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { couponValidateSchema } from '../utils/schemas.js';
import { validateCoupon } from '../controllers/couponController.js';

const router = Router();

router.post('/validate', auth, validate(couponValidateSchema), validateCoupon);

export default router;
