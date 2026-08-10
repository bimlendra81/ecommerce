import { Router } from 'express';
import { createOrder, listOrders, getOrder } from '../controllers/orderController.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { orderCreateSchema } from '../utils/schemas.js';

const router = Router();

router.use(auth);

router.get('/', listOrders);
router.post('/', validate(orderCreateSchema), createOrder);
router.get('/:id', getOrder);

export default router;
