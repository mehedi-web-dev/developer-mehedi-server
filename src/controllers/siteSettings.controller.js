import { SiteSettings } from '../models/SiteSettings.js';
import { sendSuccess } from '../utils/response.js';

/**
 * GET /api/site-settings
 * Retrieve public site settings and profile information.
 */
export async function getSiteSettings(_req, res, next) {
  try {
    let settings = await SiteSettings.findOne().lean();

    if (!settings) {
      // Default fallback structure if not yet seeded
      settings = {
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
      };
    }

    return sendSuccess(res, settings);
  } catch (error) {
    return next(error);
  }
}
