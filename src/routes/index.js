import { Router } from 'express';
import serviceRoutes from './service.routes.js';
import projectRoutes from './project.routes.js';
import reviewRoutes from './review.routes.js';
import faqRoutes from './faq.routes.js';
import siteSettingsRoutes from './siteSettings.routes.js';
import contactRoutes from './contact.routes.js';

const router = Router();

router.use('/services', serviceRoutes);
router.use('/projects', projectRoutes);
router.use('/reviews', reviewRoutes);
router.use('/faqs', faqRoutes);
router.use('/site-settings', siteSettingsRoutes);
router.use('/contact', contactRoutes);

export default router;
