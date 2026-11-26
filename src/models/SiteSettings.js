import mongoose from 'mongoose';

const socialLinkSchema = new mongoose.Schema(
  {
    platform: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    icon: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const skillCategorySchema = new mongoose.Schema(
  {
    category: { type: String, required: true, trim: true },
    items: [{ type: String, trim: true }],
  },
  { _id: false }
);

const experienceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, trim: true, default: '' },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    current: { type: Boolean, default: false },
    description: { type: String, trim: true, default: '' },
    technologies: [{ type: String, trim: true }],
  },
  { _id: false }
);

const educationSchema = new mongoose.Schema(
  {
    degree: { type: String, required: true, trim: true },
    institution: { type: String, required: true, trim: true },
    fieldOfStudy: { type: String, trim: true, default: '' },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    grade: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const urlValidator = {
  validator: function (v) {
    if (!v || v === '') return true;
    try {
      const url = new URL(v);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  },
  message: (props) => `${props.path} must be a valid HTTP or HTTPS URL`,
};

const siteSettingsSchema = new mongoose.Schema(
  {
    personalInfo: {
      name: { type: String, trim: true, default: 'Developer Mehedi' },
      title: { type: String, trim: true, default: 'Full Stack Engineer' },
      bio: { type: String, trim: true, default: '' },
      profileImage: { type: String, trim: true, default: '', validate: urlValidator },
      email: { type: String, trim: true, default: '' },
      phone: { type: String, trim: true, default: '' },
      location: { type: String, trim: true, default: '' },
      resumeUrl: { type: String, trim: true, default: '', validate: urlValidator },
      availableForHire: { type: Boolean, default: true },
    },
    socialLinks: {
      type: [socialLinkSchema],
      default: [],
    },
    skills: {
      type: [skillCategorySchema],
      default: [],
    },
    experience: {
      type: [experienceSchema],
      default: [],
    },
    education: {
      type: [educationSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const SiteSettings = mongoose.models.SiteSettings || mongoose.model('SiteSettings', siteSettingsSchema);
export default SiteSettings;
