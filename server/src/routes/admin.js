import { Router } from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import { validate } from '../middleware/validate.js';
import { productSchema, categorySchema, brandSchema, slideSchema, orderStatusSchema, updateUserSchema, updateShippingSchema, addShippingEventSchema, moderateReviewSchema, couponSchema, categoryFeaturedSchema, settingsSchema, refundSchema } from '../utils/schemas.js';
import { upload } from '../utils/upload.js';
import {
  getStats,
  listAdminProducts,
  getAdminProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
  listAdminCategories,
  createCategory,
  updateCategory,
  setCategoryFeatured,
  deleteCategory,
  restoreCategory,
  adminListOrders,
  adminGetOrder,
  updateOrderStatus,
  deleteOrder,
  restoreOrder,
  refundOrder,
  listUsers,
  updateUser,
  deleteUser,
  restoreUser,
  listAdminReviews,
  moderateReview,
} from '../controllers/adminController.js';
import {
  updateOrderShipping,
  createOrderShipment,
  syncOrderTracking,
  addShippingEvent,
  buyShippingLabel,
  updateOrderParcel,
} from '../controllers/adminShippingController.js';
import {
  listAdminSlides,
  createSlide,
  updateSlide,
  deleteSlide,
  restoreSlide,
} from '../controllers/slideController.js';
import {
  listAdminBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  restoreBrand,
} from '../controllers/brandController.js';
import {
  getAllSettings,
  updateSettings,
} from '../controllers/settingsController.js';
import {
  adminListCoupons,
  adminGetCoupon,
  adminCreateCoupon,
  adminUpdateCoupon,
  adminDeleteCoupon,
  adminRestoreCoupon,
} from '../controllers/couponController.js';
import {
  adminListSubscribers,
  adminDeleteSubscriber,
} from '../controllers/newsletterController.js';

const router = Router();

function handleUpload(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}

function handleProductUpload(req, res, next) {
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 8 },
    { name: 'videos', maxCount: 3 },
  ])(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}

function handleSettingsUpload(req, res, next) {
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'favicon', maxCount: 1 },
    { name: 'footer_logo', maxCount: 1 },
  ])(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}

router.use(adminAuth);

router.get('/stats', getStats);

// Products
router.get('/products', listAdminProducts);
router.get('/products/:id', getAdminProduct);
router.post('/products', handleProductUpload, validate(productSchema), createProduct);
router.put('/products/:id', handleProductUpload, validate(productSchema), updateProduct);
router.delete('/products/:id', deleteProduct);
router.post('/products/:id/restore', restoreProduct);

// Categories
router.get('/categories', listAdminCategories);
router.post('/categories', handleUpload, validate(categorySchema), createCategory);
router.put('/categories/:id', handleUpload, validate(categorySchema), updateCategory);
router.delete('/categories/:id', deleteCategory);
router.post('/categories/:id/restore', restoreCategory);
router.put('/categories/:id/feature', handleUpload, validate(categoryFeaturedSchema), setCategoryFeatured);

// Brands
router.get('/brands', listAdminBrands);
router.post('/brands', validate(brandSchema), createBrand);
router.put('/brands/:id', validate(brandSchema), updateBrand);
router.delete('/brands/:id', deleteBrand);
router.post('/brands/:id/restore', restoreBrand);

// Slides
router.get('/slides', listAdminSlides);
router.post('/slides', handleUpload, validate(slideSchema), createSlide);
router.put('/slides/:id', handleUpload, validate(slideSchema), updateSlide);
router.delete('/slides/:id', deleteSlide);
router.post('/slides/:id/restore', restoreSlide);

// Settings
router.get('/settings', getAllSettings);
router.put('/settings', handleSettingsUpload, validate(settingsSchema), updateSettings);

// Orders
router.get('/orders', adminListOrders);
router.get('/orders/:id', adminGetOrder);
router.patch('/orders/:id', validate(orderStatusSchema), updateOrderStatus);
router.post('/orders/:id/refund', validate(refundSchema), refundOrder);
router.delete('/orders/:id', deleteOrder);
router.post('/orders/:id/restore', restoreOrder);

// Order shipping actions
router.patch('/orders/:id/shipping', validate(updateShippingSchema), updateOrderShipping);
router.post('/orders/:id/shipping/label', buyShippingLabel);
router.patch('/orders/:id/shipping/parcel', updateOrderParcel);
router.post('/orders/:id/shipping/ship', createOrderShipment);
router.post('/orders/:id/shipping/sync', syncOrderTracking);
router.post('/orders/:id/shipping/events', validate(addShippingEventSchema), addShippingEvent);

// Users
router.get('/users', listUsers);
router.patch('/users/:id', validate(updateUserSchema), updateUser);
router.delete('/users/:id', deleteUser);
router.post('/users/:id/restore', restoreUser);

// Review moderation
router.get('/reviews', listAdminReviews);
router.patch('/reviews/:id', validate(moderateReviewSchema), moderateReview);

// Coupons
router.get('/coupons', adminListCoupons);
router.get('/coupons/:id', adminGetCoupon);
router.post('/coupons', validate(couponSchema), adminCreateCoupon);
router.put('/coupons/:id', validate(couponSchema), adminUpdateCoupon);
router.delete('/coupons/:id', adminDeleteCoupon);
router.post('/coupons/:id/restore', adminRestoreCoupon);

// Newsletter subscribers
router.get('/subscribers', adminListSubscribers);
router.delete('/subscribers/:id', adminDeleteSubscriber);

export default router;
