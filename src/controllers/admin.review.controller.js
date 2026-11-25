import { Review } from '../models/Review.js';
import { isValidObjectId } from '../utils/validation.js';
import { sendSuccess, sendPaginated, sendError } from '../utils/response.js';

/**
 * GET /api/admin/reviews
 * Retrieve all reviews with pagination and optional approved/featured filters.
 */
export async function getAdminReviews(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.approved !== undefined) {
      filter.approved = req.query.approved === 'true';
    }
    if (req.query.featured !== undefined) {
      filter.featured = req.query.featured === 'true';
    }

    const [reviews, totalItems] = await Promise.all([
      Review.find(filter)
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return sendPaginated(res, reviews, {
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
 * GET /api/admin/reviews/:id
 * Retrieve a specific review by ObjectId.
 */
export async function getAdminReviewById(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return sendError(res, 'Invalid review ID format', 400);
    }

    const review = await Review.findById(id).lean();
    if (!review) {
      return sendError(res, 'Review not found', 404);
    }

    return sendSuccess(res, review);
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/admin/reviews
 * Create a new review.
 */
export async function createReview(req, res, next) {
  try {
    const { clientName, clientPosition, clientImage, review, rating, featured, approved, order } = req.body || {};

    if (!clientName || typeof clientName !== 'string' || clientName.trim() === '') {
      return sendError(res, 'Client name is required', 400);
    }
    if (!review || typeof review !== 'string' || review.trim() === '') {
      return sendError(res, 'Review text is required', 400);
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return sendError(res, 'Rating must be a number between 1 and 5', 400);
    }

    const newReview = await Review.create({
      clientName: clientName.trim(),
      clientPosition: clientPosition ? String(clientPosition).trim() : '',
      clientImage: clientImage ? String(clientImage).trim() : '',
      review: review.trim(),
      rating: numericRating,
      featured: Boolean(featured),
      approved: approved !== undefined ? Boolean(approved) : true,
      order: Number(order) || 0,
    });

    return sendSuccess(res, newReview, 201, 'Review created successfully');
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/admin/reviews/:id
 * Update an existing review by ObjectId.
 */
export async function updateReview(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return sendError(res, 'Invalid review ID format', 400);
    }

    const reviewDoc = await Review.findById(id);
    if (!reviewDoc) {
      return sendError(res, 'Review not found', 404);
    }

    const { clientName, clientPosition, clientImage, review, rating, featured, approved, order } = req.body || {};

    if (clientName !== undefined) reviewDoc.clientName = String(clientName).trim();
    if (clientPosition !== undefined) reviewDoc.clientPosition = String(clientPosition).trim();
    if (clientImage !== undefined) reviewDoc.clientImage = String(clientImage).trim();
    if (review !== undefined) reviewDoc.review = String(review).trim();
    if (rating !== undefined) {
      const numericRating = Number(rating);
      if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
        return sendError(res, 'Rating must be a number between 1 and 5', 400);
      }
      reviewDoc.rating = numericRating;
    }
    if (featured !== undefined) reviewDoc.featured = Boolean(featured);
    if (approved !== undefined) reviewDoc.approved = Boolean(approved);
    if (order !== undefined) reviewDoc.order = Number(order) || 0;

    await reviewDoc.save();

    return sendSuccess(res, reviewDoc, 200, 'Review updated successfully');
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /api/admin/reviews/:id
 * Delete an existing review by ObjectId.
 */
export async function deleteReview(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return sendError(res, 'Invalid review ID format', 400);
    }

    const deleted = await Review.findByIdAndDelete(id);
    if (!deleted) {
      return sendError(res, 'Review not found', 404);
    }

    return sendSuccess(res, { id }, 200, 'Review deleted successfully');
  } catch (error) {
    return next(error);
  }
}
