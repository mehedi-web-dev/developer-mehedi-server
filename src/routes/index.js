import { Router } from 'express';
import serviceRoutes from './service.routes.js';
import projectRoutes from './project.routes.js';
import reviewRoutes from './review.routes.js';
import faqRoutes from './faq.routes.js';
import siteSettingsRoutes from './siteSettings.routes.js';
import contactRoutes from './contact.routes.js';
import adminRoutes from './admin/index.js';

const router = Router();

// Public REST APIs
router.use('/services', serviceRoutes);
router.use('/projects', projectRoutes);
router.use('/reviews', reviewRoutes);
router.use('/faqs', faqRoutes);
router.use('/site-settings', siteSettingsRoutes);
router.use('/contact', contactRoutes);

// Protected Admin CRUD & Upload APIs
router.use('/admin', adminRoutes);

export default router;
