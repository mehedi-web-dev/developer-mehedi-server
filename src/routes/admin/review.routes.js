import { Router } from 'express';
import {
  getAdminReviews,
  getAdminReviewById,
  createReview,
  updateReview,
  deleteReview,
} from '../../controllers/admin.review.controller.js';

const router = Router();

router.get('/', getAdminReviews);
router.get('/:id', getAdminReviewById);
router.post('/', createReview);
router.patch('/:id', updateReview);
router.delete('/:id', deleteReview);

export default router;
