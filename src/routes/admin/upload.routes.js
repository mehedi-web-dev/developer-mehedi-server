import { Router } from 'express';
import { uploadSingleImage, uploadMultipleImages } from '../../controllers/admin.upload.controller.js';

const router = Router();

// POST /api/admin/upload/image (single image)
router.post('/image', uploadSingleImage);

// POST /api/admin/upload/images (multiple images)
router.post('/images', uploadMultipleImages);

export default router;
