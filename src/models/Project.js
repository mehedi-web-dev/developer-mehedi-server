import mongoose from 'mongoose';
import { slugify } from '../utils/slugify.js';

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Project category is required'],
      trim: true,
      index: true,
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    description: {
      type: String,
      required: [true, 'Detailed description is required'],
      trim: true,
    },
    thumbnail: {
      type: String,
      required: [true, 'Thumbnail image URL is required'],
      trim: true,
    },
    gallery: {
      type: [String],
      default: [],
    },
    technologies: {
      type: [String],
      default: [],
    },
    liveUrl: {
      type: String,
      trim: true,
      default: '',
    },
    githubUrl: {
      type: String,
      trim: true,
      default: '',
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    published: {
      type: Boolean,
      default: true,
      index: true,
    },
    completionDate: {
      type: Date,
      default: null,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Auto-generate slug before validation if not provided
projectSchema.pre('validate', function (next) {
  if (this.title && (!this.slug || this.isModified('title'))) {
    if (!this.slug) {
      this.slug = slugify(this.title);
    } else {
      this.slug = slugify(this.slug);
    }
  }
  next();
});

// Composite indexes for fast query performance on public endpoints
projectSchema.index({ published: 1, order: 1, createdAt: -1 });
projectSchema.index({ published: 1, featured: 1, order: 1 });
projectSchema.index({ published: 1, category: 1, order: 1 });

export const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
export default Project;
