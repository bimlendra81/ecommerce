import { Router } from 'express';
import { listSlides } from '../controllers/slideController.js';

const router = Router();

router.get('/', listSlides);

export default router;
