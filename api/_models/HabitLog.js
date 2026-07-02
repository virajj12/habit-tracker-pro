import mongoose from 'mongoose';

const HabitLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  habitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    required: true,
  },
  status: {
    type: String,
    enum: ['completed', 'skipped'],
    required: true,
  },
  dateString: {
    type: String,
    required: true,
    // Expected format: YYYY-MM-DD
    match: /^\d{4}-\d{2}-\d{2}$/,
  },
  mood: {
    type: String,
    enum: ['great', 'neutral', 'bad'],
  },
  completionTime: {
    type: Date,
  },
  loggedAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure a habit can only have one log per day
HabitLogSchema.index({ habitId: 1, dateString: 1 }, { unique: true });

export default mongoose.models.HabitLog || mongoose.model('HabitLog', HabitLogSchema);
