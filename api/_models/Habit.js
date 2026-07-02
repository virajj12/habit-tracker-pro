import mongoose from 'mongoose';

const HabitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Please provide a name for this habit.'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters'],
  },
  category: {
    type: String,
    default: 'General',
  },
  habitType: {
    type: String,
    enum: ['positive', 'negative'],
    default: 'positive',
  },
  dependsOn: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
  },
  moodTrackingEnabled: {
    type: Boolean,
    default: false,
  },
  dateRange: {
    isDaily: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
  },
  skipDays: {
    type: [String], // Array of day strings like 'Sun', 'Mon'
    default: [],
  },
  scheduledTime: {
    timeOption: {
      type: String,
      enum: ['any', 'fixed', 'range'],
      default: 'any',
    },
    fixedTime: String,
    timeRangeStart: String,
    timeRangeEnd: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isVisible: {
    type: Boolean,
    default: true,
  },
});

export default mongoose.models.Habit || mongoose.model('Habit', HabitSchema);
