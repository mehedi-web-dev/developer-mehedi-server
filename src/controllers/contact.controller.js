import { Contact } from '../models/Contact.js';
import { sendError } from '../utils/response.js';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/contact
 * Public inquiry form submission with validation and anti-spam protection.
 */
export async function submitContact(req, res, next) {
  try {
    const { name, email, subject, message, _hp, website } = req.body || {};

    // 1. Honeypot anti-spam check: if bot fills hidden field, return success without saving
    if (_hp || website) {
      console.warn('[Contact] Bot submission intercepted via honeypot field.');
      return res.status(201).json({
        success: true,
        message: 'Thank you for reaching out! Your message has been received.',
      });
    }

    // 2. Validate required fields & types
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return sendError(res, 'Name is required and cannot be empty', 400);
    }
    if (name.trim().length > 100) {
      return sendError(res, 'Name cannot exceed 100 characters', 400);
    }

    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return sendError(res, 'Email address is required and cannot be empty', 400);
    }
    const trimmedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(trimmedEmail)) {
      return sendError(res, 'Please provide a valid email address', 400);
    }
    if (trimmedEmail.length > 150) {
      return sendError(res, 'Email address cannot exceed 150 characters', 400);
    }

    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      return sendError(res, 'Subject is required and cannot be empty', 400);
    }
    if (subject.trim().length > 200) {
      return sendError(res, 'Subject cannot exceed 200 characters', 400);
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return sendError(res, 'Message is required and cannot be empty', 400);
    }
    const trimmedMessage = message.trim();
    if (trimmedMessage.length < 10) {
      return sendError(res, 'Message must be at least 10 characters long', 400);
    }
    if (trimmedMessage.length > 3000) {
      return sendError(res, 'Message cannot exceed 3000 characters', 400);
    }

    // 3. Persist inquiry in database
    await Contact.create({
      name: name.trim(),
      email: trimmedEmail,
      subject: subject.trim(),
      message: trimmedMessage,
      status: 'new',
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you for reaching out! Your message has been received.',
    });
  } catch (error) {
    console.error('[Contact Error]:', error.message);
    // Never expose MongoDB internal connection or syntax errors to client
    return sendError(res, 'Unable to process your inquiry at this moment. Please try again later.', 500);
  }
}
