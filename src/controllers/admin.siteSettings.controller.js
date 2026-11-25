import { SiteSettings } from '../models/SiteSettings.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * GET /api/admin/site-settings
 * Retrieve site settings for administration.
 */
export async function getAdminSiteSettings(_req, res, next) {
  try {
    let settings = await SiteSettings.findOne().lean();

    if (!settings) {
      settings = await SiteSettings.create({
        personalInfo: {
          name: 'Developer Mehedi',
          title: 'Full Stack Engineer',
          bio: 'Passionate Full Stack Engineer specializing in scalable web applications.',
          profileImage: '',
          email: 'mehedi@example.com',
          phone: '',
          location: 'Dhaka, Bangladesh',
          resumeUrl: '',
          availableForHire: true,
        },
        socialLinks: [],
        skills: [],
        experience: [],
        education: [],
      });
    }

    return sendSuccess(res, settings);
  } catch (error) {
    return next(error);
  }
}

/**
 * PATCH /api/admin/site-settings
 * Update portfolio site settings, personal info, experience, and skills.
 */
export async function updateAdminSiteSettings(req, res, next) {
  try {
    const updates = req.body || {};

    // Remove any unauthorized fields or root mutations
    const allowedFields = ['personalInfo', 'socialLinks', 'skills', 'experience', 'education'];
    const sanitizedUpdates = {};

    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        sanitizedUpdates[key] = updates[key];
      }
    }

    const settings = await SiteSettings.findOneAndUpdate(
      {},
      { $set: sanitizedUpdates },
      { returnDocument: 'after', upsert: true, runValidators: true }
    );

    return sendSuccess(res, settings, 200, 'Site settings updated successfully');
  } catch (error) {
    return next(error);
  }
}
