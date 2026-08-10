import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { newsletterSchema } from '../utils/schemas.js';
import { subscribe, unsubscribe } from '../controllers/newsletterController.js';

const router = Router();

router.post('/', validate(newsletterSchema), subscribe);
router.delete('/', validate(newsletterSchema), unsubscribe);

export default router;
