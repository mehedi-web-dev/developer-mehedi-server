import { Router } from 'express';
import { getFAQs } from '../controllers/faq.controller.js';

const router = Router();

// Public FAQ Routes
router.get('/', getFAQs);

export default router;
