import { Project } from '../models/Project.js';
import { sendSuccess, sendPaginated, sendError } from '../utils/response.js';

/**
 * GET /api/projects
 * Retrieve paginated list of published projects with optional category filter.
 */
export async function getProjects(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 9));
    const skip = (page - 1) * limit;

    const filter = { published: true };

    if (req.query.category && typeof req.query.category === 'string' && req.query.category.trim() !== '') {
      filter.category = req.query.category.trim();
    }

    const [projects, totalItems] = await Promise.all([
      Project.find(filter)
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Project.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return sendPaginated(res, projects, {
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
 * GET /api/projects/featured
 * Retrieve maximum 3 published and featured projects.
 */
export async function getFeaturedProjects(_req, res, next) {
  try {
    const projects = await Project.find({ published: true, featured: true })
      .sort({ order: 1, createdAt: -1 })
      .limit(3)
      .lean();

    return sendSuccess(res, projects);
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/projects/:slug
 * Retrieve a single published project by its unique slug.
 */
export async function getProjectBySlug(req, res, next) {
  try {
    const slug = (req.params.slug || '').toLowerCase().trim();

    if (!slug) {
      return sendError(res, 'Project slug parameter is required', 400);
    }

    const project = await Project.findOne({ slug, published: true }).lean();

    if (!project) {
      return sendError(res, 'Project not found', 404);
    }

    return sendSuccess(res, project);
  } catch (error) {
    return next(error);
  }
}
