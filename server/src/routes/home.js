import { Router } from 'express';
import { getHome } from '../controllers/homeController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, getHome);

export default router;
