import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { contactSchema } from '../utils/schemas.js';
import { createMessage } from '../controllers/contactController.js';

const router = Router();

router.post('/', validate(contactSchema), createMessage);

export default router;
