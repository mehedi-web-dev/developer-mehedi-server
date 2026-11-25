import { Router } from 'express';
import {
  getAdminContacts,
  getAdminContactById,
  updateContactStatus,
  deleteContact,
} from '../../controllers/admin.contact.controller.js';

const router = Router();

router.get('/', getAdminContacts);
router.get('/:id', getAdminContactById);
router.patch('/:id', updateContactStatus);
router.delete('/:id', deleteContact);

export default router;
