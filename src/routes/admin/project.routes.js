import { Router } from 'express';
import {
  getAdminProjects,
  getAdminProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '../../controllers/admin.project.controller.js';

const router = Router();

router.get('/', getAdminProjects);
router.get('/:id', getAdminProjectById);
router.post('/', createProject);
router.patch('/:id', updateProject);
router.delete('/:id', deleteProject);

export default router;
