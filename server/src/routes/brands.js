import { Router } from 'express';
import { listBrands } from '../controllers/brandController.js';

const router = Router();

router.get('/', listBrands);

export default router;
