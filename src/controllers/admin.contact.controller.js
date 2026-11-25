import { Contact } from '../models/Contact.js';
import { isValidObjectId } from '../utils/validation.js';
import { sendSuccess, sendPaginated, sendError } from '../utils/response.js';

/**
 * GET /api/admin/contacts
 * Retrieve all contact inquiries with pagination and optional status filter.
 */
export async function getAdminContacts(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status && ['new', 'read', 'replied'].includes(req.query.status.toLowerCase())) {
      filter.status = req.query.status.toLowerCase();
    }

    const [contacts, totalItems] = await Promise.all([
      Contact.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Contact.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return sendPaginated(res, contacts, {
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
 * GET /api/admin/contacts/:id
 * Retrieve a single contact inquiry by ObjectId.
 */
export async function getAdminContactById(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return sendError(res, 'Invalid contact ID format', 400);
    }

    const contact = await Contact.findById(id).lean();
    if (!contact) {
      return sendError(res, 'Contact inquiry not found', 404);
    }

    return sendSuccess(res, contact);
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/admin/contacts/:id
 * Update status of a contact inquiry ('new', 'read', 'replied').
 */
export async function updateContactStatus(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return sendError(res, 'Invalid contact ID format', 400);
    }

    const { status } = req.body || {};
    if (!status || !['new', 'read', 'replied'].includes(String(status).toLowerCase())) {
      return sendError(res, 'Valid status is required ("new", "read", "replied")', 400);
    }

    const contact = await Contact.findByIdAndUpdate(
      id,
      { status: String(status).toLowerCase() },
      { returnDocument: 'after', runValidators: true }
    );

    if (!contact) {
      return sendError(res, 'Contact inquiry not found', 404);
    }

    return sendSuccess(res, contact, 200, 'Contact status updated successfully');
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /api/admin/contacts/:id
 * Delete a contact inquiry.
 */
export async function deleteContact(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return sendError(res, 'Invalid contact ID format', 400);
    }

    const deleted = await Contact.findByIdAndDelete(id);
    if (!deleted) {
      return sendError(res, 'Contact inquiry not found', 404);
    }

    return sendSuccess(res, { id }, 200, 'Contact inquiry deleted successfully');
  } catch (error) {
    return next(error);
  }
}
