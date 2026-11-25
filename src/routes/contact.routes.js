import { Router } from 'express';
import { submitContact } from '../controllers/contact.controller.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Rate limiter for contact inquiry submission: 5 submissions per 15 minutes per IP
const contactLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many contact inquiries from this IP address. Please try again after 15 minutes.',
});

// POST /api/contact
router.post('/', contactLimiter, submitContact);

export default router;
