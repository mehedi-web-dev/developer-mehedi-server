import { Service } from '../models/Service.js';
import { slugify } from '../utils/slugify.js';
import { isValidObjectId } from '../utils/validation.js';
import { sendSuccess, sendPaginated, sendError } from '../utils/response.js';

/**
 * GET /api/admin/services
 * Retrieve all services with pagination and optional published filter.
 */
export async function getAdminServices(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.published !== undefined) {
      filter.published = req.query.published === 'true';
    }

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
 * GET /api/admin/services/:id
 * Retrieve a specific service by ObjectId.
 */
export async function getAdminServiceById(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return sendError(res, 'Invalid service ID format', 400);
    }

    const service = await Service.findById(id).lean();
    if (!service) {
      return sendError(res, 'Service not found', 404);
    }

    return sendSuccess(res, service);
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/admin/services
 * Create a new service.
 */
export async function createService(req, res, next) {
  try {
    const { title, slug, shortDescription, description, icon, features, technologies, featured, published, order } = req.body || {};

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return sendError(res, 'Service title is required', 400);
    }
    if (!shortDescription || typeof shortDescription !== 'string' || shortDescription.trim() === '') {
      return sendError(res, 'Short description is required', 400);
    }
    if (!description || typeof description !== 'string' || description.trim() === '') {
      return sendError(res, 'Detailed description is required', 400);
    }

    const targetSlug = slugify(slug || title);
    if (!targetSlug) {
      return sendError(res, 'Valid slug or title is required', 400);
    }

    const existingSlug = await Service.findOne({ slug: targetSlug });
    if (existingSlug) {
      return sendError(res, `Slug "${targetSlug}" is already in use by another service`, 409);
    }

    const service = await Service.create({
      title: title.trim(),
      slug: targetSlug,
      shortDescription: shortDescription.trim(),
      description: description.trim(),
      icon: icon ? String(icon).trim() : '',
      features: Array.isArray(features) ? features.map((f) => String(f).trim()).filter(Boolean) : [],
      technologies: Array.isArray(technologies) ? technologies.map((t) => String(t).trim()).filter(Boolean) : [],
      featured: Boolean(featured),
      published: published !== undefined ? Boolean(published) : true,
      order: Number(order) || 0,
    });

    return sendSuccess(res, service, 201, 'Service created successfully');
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/admin/services/:id
 * Update an existing service by ObjectId.
 */
export async function updateService(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return sendError(res, 'Invalid service ID format', 400);
    }

    const service = await Service.findById(id);
    if (!service) {
      return sendError(res, 'Service not found', 404);
    }

    const { title, slug, shortDescription, description, icon, features, technologies, featured, published, order } = req.body || {};

    if (slug || title) {
      const targetSlug = slugify(slug || title);
      if (targetSlug && targetSlug !== service.slug) {
        const existingSlug = await Service.findOne({ slug: targetSlug, _id: { $ne: id } });
        if (existingSlug) {
          return sendError(res, `Slug "${targetSlug}" is already in use by another service`, 409);
        }
        service.slug = targetSlug;
      }
    }

    if (title !== undefined) service.title = String(title).trim();
    if (shortDescription !== undefined) service.shortDescription = String(shortDescription).trim();
    if (description !== undefined) service.description = String(description).trim();
    if (icon !== undefined) service.icon = String(icon).trim();
    if (features !== undefined) {
      service.features = Array.isArray(features) ? features.map((f) => String(f).trim()).filter(Boolean) : [];
    }
    if (technologies !== undefined) {
      service.technologies = Array.isArray(technologies) ? technologies.map((t) => String(t).trim()).filter(Boolean) : [];
    }
    if (featured !== undefined) service.featured = Boolean(featured);
    if (published !== undefined) service.published = Boolean(published);
    if (order !== undefined) service.order = Number(order) || 0;

    await service.save();

    return sendSuccess(res, service, 200, 'Service updated successfully');
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /api/admin/services/:id
 * Delete an existing service by ObjectId.
 */
export async function deleteService(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return sendError(res, 'Invalid service ID format', 400);
    }

    const deleted = await Service.findByIdAndDelete(id);
    if (!deleted) {
      return sendError(res, 'Service not found', 404);
    }

    return sendSuccess(res, { id }, 200, 'Service deleted successfully');
  } catch (error) {
    return next(error);
  }
}
