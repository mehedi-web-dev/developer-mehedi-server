import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
      maxlength: [100, 'Client name cannot exceed 100 characters'],
    },
    clientPosition: {
      type: String,
      trim: true,
      default: '',
      maxlength: [150, 'Client position cannot exceed 150 characters'],
    },
    clientImage: {
      type: String,
      trim: true,
      default: '',
    },
    review: {
      type: String,
      required: [true, 'Review text is required'],
      trim: true,
      maxlength: [2000, 'Review cannot exceed 2000 characters'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      default: 5,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    approved: {
      type: Boolean,
      default: false,
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

// Composite indexes for public queries
reviewSchema.index({ approved: 1, order: 1, createdAt: -1 });
reviewSchema.index({ approved: 1, featured: 1, order: 1 });

export const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);
export default Review;
