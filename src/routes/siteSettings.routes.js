import { Router } from 'express';
import { getSiteSettings } from '../controllers/siteSettings.controller.js';

const router = Router();

// Public Site Settings Routes
router.get('/', getSiteSettings);

export default router;
