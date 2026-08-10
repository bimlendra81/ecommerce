import { Router } from 'express';
import {
  listProducts,
  getProduct,
  listReviews,
  createReview,
  updateReview,
  deleteReview,
  reportReview,
  getPriceRange,
} from '../controllers/productController.js';
import { auth, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { reviewSchema } from '../utils/schemas.js';

const router = Router();

router.get('/', listProducts);
router.get('/price-range', getPriceRange);
router.get('/:slug/reviews', listReviews);
router.post('/:slug/reviews', auth, validate(reviewSchema), createReview);
router.put('/:slug/reviews', auth, updateReview);
router.delete('/:slug/reviews', auth, deleteReview);
router.post('/:slug/reviews/:id/report', auth, reportReview);
router.get('/:slug', optionalAuth, getProduct);

export default router;
