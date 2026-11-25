import { Review } from '../models/Review.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';

/**
 * GET /api/reviews
 * Retrieve paginated list of approved client reviews.
 */
export async function getReviews(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = { approved: true };

    if (req.query.featured === 'true') {
      filter.featured = true;
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
