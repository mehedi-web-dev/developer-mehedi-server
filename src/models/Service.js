import mongoose from 'mongoose';
import { slugify } from '../utils/slugify.js';

const serviceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Service title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
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
    icon: {
      type: String,
      trim: true,
      default: '',
    },
    features: {
      type: [String],
      default: [],
    },
    technologies: {
      type: [String],
      default: [],
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
serviceSchema.pre('validate', function () {
  if (this.title && (!this.slug || this.isModified('title'))) {
    if (!this.slug) {
      this.slug = slugify(this.title);
    } else {
      this.slug = slugify(this.slug);
    }
  }
});

// Composite indexes for fast query performance on public endpoints
serviceSchema.index({ published: 1, order: 1, createdAt: -1 });
serviceSchema.index({ published: 1, featured: 1, order: 1 });

export const Service = mongoose.models.Service || mongoose.model('Service', serviceSchema);
export default Service;
