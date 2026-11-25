import { Router } from 'express';
import {
  getAdminSiteSettings,
  updateAdminSiteSettings,
} from '../../controllers/admin.siteSettings.controller.js';

const router = Router();

router.get('/', getAdminSiteSettings);
router.patch('/', updateAdminSiteSettings);

export default router;
