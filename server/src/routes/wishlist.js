import { Router } from 'express';
import { getWishlist, addToWishlist, removeFromWishlist } from '../controllers/wishlistController.js';
import { auth } from '../middleware/auth.js';
import { paramInt } from '../middleware/validate.js';

const router = Router();

router.use(auth);

router.get('/', getWishlist);
router.post('/:product_id', paramInt('product_id'), addToWishlist);
router.delete('/:product_id', paramInt('product_id'), removeFromWishlist);

export default router;
