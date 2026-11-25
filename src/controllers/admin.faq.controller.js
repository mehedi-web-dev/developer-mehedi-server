import { FAQ } from '../models/FAQ.js';
import { isValidObjectId } from '../utils/validation.js';
import { sendSuccess, sendPaginated, sendError } from '../utils/response.js';

/**
 * GET /api/admin/faqs
 * Retrieve all FAQs with pagination and optional active filter.
 */
export async function getAdminFAQs(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.active !== undefined) {
      filter.active = req.query.active === 'true';
    }

    const [faqs, totalItems] = await Promise.all([
      FAQ.find(filter)
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FAQ.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return sendPaginated(res, faqs, {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/admin/faqs/:id
 * Retrieve a specific FAQ by ObjectId.
 */
export async function getAdminFAQById(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return sendError(res, 'Invalid FAQ ID format', 400);
    }

    const faq = await FAQ.findById(id).lean();
    if (!faq) {
      return sendError(res, 'FAQ not found', 404);
    }

    return sendSuccess(res, faq);
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/admin/faqs
 * Create a new FAQ.
 */
export async function createFAQ(req, res, next) {
  try {
    const { question, answer, active, order } = req.body || {};

    if (!question || typeof question !== 'string' || question.trim() === '') {
      return sendError(res, 'Question is required', 400);
    }
    if (!answer || typeof answer !== 'string' || answer.trim() === '') {
      return sendError(res, 'Answer is required', 400);
    }

    const faq = await FAQ.create({
      question: question.trim(),
      answer: answer.trim(),
      active: active !== undefined ? Boolean(active) : true,
      order: Number(order) || 0,
    });

    return sendSuccess(res, faq, 201, 'FAQ created successfully');
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/admin/faqs/:id
 * Update an existing FAQ by ObjectId.
 */
export async function updateFAQ(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return sendError(res, 'Invalid FAQ ID format', 400);
    }

    const faq = await FAQ.findById(id);
    if (!faq) {
      return sendError(res, 'FAQ not found', 404);
    }

    const { question, answer, active, order } = req.body || {};

    if (question !== undefined) faq.question = String(question).trim();
    if (answer !== undefined) faq.answer = String(answer).trim();
    if (active !== undefined) faq.active = Boolean(active);
    if (order !== undefined) faq.order = Number(order) || 0;

    await faq.save();

    return sendSuccess(res, faq, 200, 'FAQ updated successfully');
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /api/admin/faqs/:id
 * Delete an existing FAQ by ObjectId.
 */
export async function deleteFAQ(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return sendError(res, 'Invalid FAQ ID format', 400);
    }

    const deleted = await FAQ.findByIdAndDelete(id);
    if (!deleted) {
      return sendError(res, 'FAQ not found', 404);
    }

    return sendSuccess(res, { id }, 200, 'FAQ deleted successfully');
  } catch (error) {
    return next(error);
  }
}
