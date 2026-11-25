import { Router } from 'express';
import { requireAdmin } from '../../middleware/auth.middleware.js';

import adminServiceRoutes from './service.routes.js';
import adminProjectRoutes from './project.routes.js';
import adminReviewRoutes from './review.routes.js';
import adminFAQRoutes from './faq.routes.js';
import adminContactRoutes from './contact.routes.js';
import adminSiteSettingsRoutes from './siteSettings.routes.js';
import adminUploadRoutes from './upload.routes.js';

const router = Router();

// Enforce requireAdmin on all /api/admin/* routes
router.use(requireAdmin);

router.use('/services', adminServiceRoutes);
router.use('/projects', adminProjectRoutes);
router.use('/reviews', adminReviewRoutes);
router.use('/faqs', adminFAQRoutes);
router.use('/contacts', adminContactRoutes);
router.use('/site-settings', adminSiteSettingsRoutes);
router.use('/upload', adminUploadRoutes);

export default router;
