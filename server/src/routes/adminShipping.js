import { Router } from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import { validate } from '../middleware/validate.js';
import { shippingMethodSchema, shippingConfigSchema } from '../utils/schemas.js';
import {
  listAdminShippingMethods,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
  getShippingConfig,
  updateShippingConfig,
  testShippo,
} from '../controllers/adminShippingController.js';

const router = Router();

router.use(adminAuth);

router.get('/shipping-methods', listAdminShippingMethods);
router.post('/shipping-methods', validate(shippingMethodSchema), createShippingMethod);
router.put('/shipping-methods/:id', validate(shippingMethodSchema), updateShippingMethod);
router.delete('/shipping-methods/:id', deleteShippingMethod);

router.get('/shipping-config', getShippingConfig);
router.put('/shipping-config', validate(shippingConfigSchema), updateShippingConfig);
router.post('/shipping-test/shippo', testShippo);

export default router;
