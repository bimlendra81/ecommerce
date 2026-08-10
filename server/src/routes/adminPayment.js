import { Router } from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import { validate } from '../middleware/validate.js';
import { paymentConfigSchema } from '../utils/schemas.js';
import { getPaymentConfig, updatePaymentConfig } from '../controllers/adminPaymentController.js';

const router = Router();

router.use(adminAuth);

router.get('/payment-config', getPaymentConfig);
router.put('/payment-config', validate(paymentConfigSchema), updatePaymentConfig);

export default router;
