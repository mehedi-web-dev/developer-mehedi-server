import { Router } from 'express';
import { getProjects, getFeaturedProjects, getProjectBySlug } from '../controllers/project.controller.js';

const router = Router();

// Public Project Routes
router.get('/featured', getFeaturedProjects);
router.get('/', getProjects);
router.get('/:slug', getProjectBySlug);

export default router;
