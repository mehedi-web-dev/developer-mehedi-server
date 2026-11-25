import { Router } from 'express';
import {
  getAdminFAQs,
  getAdminFAQById,
  createFAQ,
  updateFAQ,
  deleteFAQ,
} from '../../controllers/admin.faq.controller.js';

const router = Router();

router.get('/', getAdminFAQs);
router.get('/:id', getAdminFAQById);
router.post('/', createFAQ);
router.patch('/:id', updateFAQ);
router.delete('/:id', deleteFAQ);

export default router;
