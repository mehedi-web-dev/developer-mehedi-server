import { Router } from 'express';
import {
  getAdminServices,
  getAdminServiceById,
  createService,
  updateService,
  deleteService,
} from '../../controllers/admin.service.controller.js';

const router = Router();

router.get('/', getAdminServices);
router.get('/:id', getAdminServiceById);
router.post('/', createService);
router.patch('/:id', updateService);
router.delete('/:id', deleteService);

export default router;
