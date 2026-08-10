import { Router } from 'express';
import { getCart, addToCart, updateQuantity, removeFromCart, clearCart } from '../controllers/cartController.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { addToCartSchema, updateCartSchema } from '../utils/schemas.js';

const router = Router();

router.use(auth);

router.get('/', getCart);
router.post('/', validate(addToCartSchema), addToCart);
router.patch('/:product_id', validate(updateCartSchema), updateQuantity);
router.delete('/:product_id', removeFromCart);
router.delete('/', clearCart);

export default router;
