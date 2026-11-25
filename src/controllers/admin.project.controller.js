import { Project } from '../models/Project.js';
import { slugify } from '../utils/slugify.js';
import { isValidObjectId } from '../utils/validation.js';
import { sendSuccess, sendPaginated, sendError } from '../utils/response.js';

/**
 * GET /api/admin/projects
 * Retrieve all projects with pagination and optional filters.
 */
export async function getAdminProjects(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.published !== undefined) {
      filter.published = req.query.published === 'true';
    }
    if (req.query.category && typeof req.query.category === 'string') {
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
 * GET /api/admin/projects/:id
 * Retrieve a specific project by ObjectId.
 */
export async function getAdminProjectById(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return sendError(res, 'Invalid project ID format', 400);
    }

    const project = await Project.findById(id).lean();
    if (!project) {
      return sendError(res, 'Project not found', 404);
    }

    return sendSuccess(res, project);
  } catch (error) {
    return next(error);
  }
}

/**
 * POST /api/admin/projects
 * Create a new project.
 */
export async function createProject(req, res, next) {
  try {
    const {
      title,
      slug,
      category,
      shortDescription,
      description,
      thumbnail,
      gallery,
      technologies,
      liveUrl,
      githubUrl,
      featured,
      published,
      completionDate,
      order,
    } = req.body || {};

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return sendError(res, 'Project title is required', 400);
    }
    if (!category || typeof category !== 'string' || category.trim() === '') {
      return sendError(res, 'Project category is required', 400);
    }
    if (!shortDescription || typeof shortDescription !== 'string' || shortDescription.trim() === '') {
      return sendError(res, 'Short description is required', 400);
    }
    if (!description || typeof description !== 'string' || description.trim() === '') {
      return sendError(res, 'Detailed description is required', 400);
    }
    if (!thumbnail || typeof thumbnail !== 'string' || thumbnail.trim() === '') {
      return sendError(res, 'Thumbnail image URL is required', 400);
    }

    const targetSlug = slugify(slug || title);
    if (!targetSlug) {
      return sendError(res, 'Valid slug or title is required', 400);
    }

    const existingSlug = await Project.findOne({ slug: targetSlug });
    if (existingSlug) {
      return sendError(res, `Slug "${targetSlug}" is already in use by another project`, 409);
    }

    const project = await Project.create({
      title: title.trim(),
      slug: targetSlug,
      category: category.trim(),
      shortDescription: shortDescription.trim(),
      description: description.trim(),
      thumbnail: thumbnail.trim(),
      gallery: Array.isArray(gallery) ? gallery.map((g) => String(g).trim()).filter(Boolean) : [],
      technologies: Array.isArray(technologies) ? technologies.map((t) => String(t).trim()).filter(Boolean) : [],
      liveUrl: liveUrl ? String(liveUrl).trim() : '',
      githubUrl: githubUrl ? String(githubUrl).trim() : '',
      featured: Boolean(featured),
      published: published !== undefined ? Boolean(published) : true,
      completionDate: completionDate ? new Date(completionDate) : null,
      order: Number(order) || 0,
    });

    return sendSuccess(res, project, 201, 'Project created successfully');
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/admin/projects/:id
 * Update an existing project by ObjectId.
 */
export async function updateProject(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return sendError(res, 'Invalid project ID format', 400);
    }

    const project = await Project.findById(id);
    if (!project) {
      return sendError(res, 'Project not found', 404);
    }

    const {
      title,
      slug,
      category,
      shortDescription,
      description,
      thumbnail,
      gallery,
      technologies,
      liveUrl,
      githubUrl,
      featured,
      published,
      completionDate,
      order,
    } = req.body || {};

    if (slug || title) {
      const targetSlug = slugify(slug || title);
      if (targetSlug && targetSlug !== project.slug) {
        const existingSlug = await Project.findOne({ slug: targetSlug, _id: { $ne: id } });
        if (existingSlug) {
          return sendError(res, `Slug "${targetSlug}" is already in use by another project`, 409);
        }
        project.slug = targetSlug;
      }
    }

    if (title !== undefined) project.title = String(title).trim();
    if (category !== undefined) project.category = String(category).trim();
    if (shortDescription !== undefined) project.shortDescription = String(shortDescription).trim();
    if (description !== undefined) project.description = String(description).trim();
    if (thumbnail !== undefined) project.thumbnail = String(thumbnail).trim();
    if (gallery !== undefined) {
      project.gallery = Array.isArray(gallery) ? gallery.map((g) => String(g).trim()).filter(Boolean) : [];
    }
    if (technologies !== undefined) {
      project.technologies = Array.isArray(technologies) ? technologies.map((t) => String(t).trim()).filter(Boolean) : [];
    }
    if (liveUrl !== undefined) project.liveUrl = String(liveUrl).trim();
    if (githubUrl !== undefined) project.githubUrl = String(githubUrl).trim();
    if (featured !== undefined) project.featured = Boolean(featured);
    if (published !== undefined) project.published = Boolean(published);
    if (completionDate !== undefined) {
      project.completionDate = completionDate ? new Date(completionDate) : null;
    }
    if (order !== undefined) project.order = Number(order) || 0;

    await project.save();

    return sendSuccess(res, project, 200, 'Project updated successfully');
  } catch (error) {
    return next(error);
  }
}

/**
 * DELETE /api/admin/projects/:id
 * Delete an existing project by ObjectId.
 */
export async function deleteProject(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return sendError(res, 'Invalid project ID format', 400);
    }

    const deleted = await Project.findByIdAndDelete(id);
    if (!deleted) {
      return sendError(res, 'Project not found', 404);
    }

    return sendSuccess(res, { id }, 200, 'Project deleted successfully');
  } catch (error) {
    return next(error);
  }
}
