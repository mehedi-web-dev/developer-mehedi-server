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
    const sanitizedUpdates = {};

    // Support nested personalInfo object with dot notation to preserve sibling fields
    if (updates.personalInfo && typeof updates.personalInfo === 'object' && !Array.isArray(updates.personalInfo)) {
      for (const [subKey, subVal] of Object.entries(updates.personalInfo)) {
        sanitizedUpdates[`personalInfo.${subKey}`] = subVal;
      }
    }

    // Support direct root-level aliases for profileImage and resumeUrl if sent directly
    if (updates.profileImage !== undefined) {
      sanitizedUpdates['personalInfo.profileImage'] = updates.profileImage;
    }
    if (updates.resumeUrl !== undefined) {
      sanitizedUpdates['personalInfo.resumeUrl'] = updates.resumeUrl;
    }

    // Array / section fields
    const arrayFields = ['socialLinks', 'skills', 'experience', 'education'];
    for (const key of arrayFields) {
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
