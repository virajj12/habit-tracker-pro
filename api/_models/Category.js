import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Please provide a category name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Compound index to ensure uniqueness per user
CategorySchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.models.Category || mongoose.model('Category', CategorySchema);
