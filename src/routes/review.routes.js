import { Router } from 'express';
import { getReviews } from '../controllers/review.controller.js';

const router = Router();

// Public Review Routes
router.get('/', getReviews);

export default router;
