import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { addressSchema } from '../utils/schemas.js';
import {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from '../controllers/addressController.js';

const router = Router();

router.use(auth);

router.get('/', listAddresses);
router.post('/', validate(addressSchema), createAddress);
router.put('/:id', validate(addressSchema), updateAddress);
router.delete('/:id', deleteAddress);

export default router;
