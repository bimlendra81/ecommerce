import { Router } from 'express';
import { createPayment, verifyPayment, testConfirm, paymentConfig } from '../controllers/paymentController.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { paymentCreateSchema, paymentVerifySchema } from '../utils/schemas.js';

const router = Router();

router.get('/config', paymentConfig);

router.use(auth);

router.post('/create-order', validate(paymentCreateSchema), createPayment);
router.post('/verify', validate(paymentVerifySchema), verifyPayment);
router.post('/test-confirm', validate(paymentCreateSchema), testConfirm);

export default router;
