import { Router } from 'express';
import { getServices, getFeaturedServices } from '../controllers/service.controller.js';

const router = Router();

// Public Service Routes
router.get('/featured', getFeaturedServices);
router.get('/', getServices);

export default router;
