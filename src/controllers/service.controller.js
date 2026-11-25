import { Service } from '../models/Service.js';
import { sendSuccess, sendPaginated, sendError } from '../utils/response.js';

/**
 * GET /api/services
 * Retrieve paginated list of published services.
 */
export async function getServices(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = { published: true };

    const [services, totalItems] = await Promise.all([
      Service.find(filter)
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Service.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return sendPaginated(res, services, {
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
 * GET /api/services/featured
 * Retrieve maximum 3 published and featured services.
 */
export async function getFeaturedServices(_req, res, next) {
  try {
    const services = await Service.find({ published: true, featured: true })
      .sort({ order: 1, createdAt: -1 })
      .limit(3)
      .lean();

    return sendSuccess(res, services);
  } catch (error) {
    return next(error);
  }
}
