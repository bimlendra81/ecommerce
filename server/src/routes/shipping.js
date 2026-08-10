import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { quoteSchema } from '../utils/schemas.js';
import { listMethods, getQuote } from '../controllers/shippingController.js';

const router = Router();

router.get('/methods', listMethods);
router.post('/quote', auth, validate(quoteSchema), getQuote);

export default router;
