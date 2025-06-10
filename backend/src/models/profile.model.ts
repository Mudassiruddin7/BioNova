import mongoose, { Document, Schema } from 'mongoose';

// Profile document interface
export interface IProfile extends Document {
  userId: mongoose.Types.ObjectId;
  role: 'student' | 'researcher' | 'other';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  interests: string[];
  onboardingCompleted: boolean;
  recentActivity: {
    type: 'prediction' | 'monitoring';
    data: Record<string, any>;
    timestamp: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// Profile schema
const profileSchema = new Schema<IProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['student', 'researcher', 'other'],
      default: 'student',
    },
    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    interests: {
      type: [String],
      default: [],
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    recentActivity: {
      type: [{
        type: {
          type: String,
          enum: ['prediction', 'monitoring'],
          required: true,
        },
        data: {
          type: Schema.Types.Mixed,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      }],
      default: [],
    },
  },
  { timestamps: true }
);

// Add index for faster lookups
profileSchema.index({ userId: 1 });

// Create and export Profile model
const Profile = mongoose.model<IProfile>('Profile', profileSchema);
export default Profile; 