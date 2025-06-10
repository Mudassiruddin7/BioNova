import mongoose, { Document, Schema } from 'mongoose';

// Gene document interface
export interface IGene extends Document {
  userId: mongoose.Types.ObjectId;
  originalSequence: string;
  predictedSequence: string;
  editCount: number;
  editPositions: number[];
  efficiency: number;
  originalEfficiency: number;
  changedPosition: number;
  originalBase: string;
  newBase: string;
  changeIndicator: string;
  message: string;
  name: string;
  description: string;
  tags: string[];
  geneType: 'crispr' | 'rna' | 'dna' | 'protein' | 'other';
  isFavorite: boolean;
  isPublic: boolean;
  metadata: {
    [key: string]: any;
  };
  explanations: {
    text: string;
    timestamp: Date;
  }[];
  visualizations: {
    imageUrl: string;
    type: 'sequence' | 'diagram';
    timestamp: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// Gene schema
const geneSchema = new Schema<IGene>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    originalSequence: {
      type: String,
      required: true,
      index: true,
    },
    predictedSequence: {
      type: String,
      required: true,
    },
    editCount: {
      type: Number,
      required: true,
      default: 0,
    },
    editPositions: {
      type: [Number],
      default: [],
    },
    efficiency: {
      type: Number, 
      required: true,
    },
    originalEfficiency: {
      type: Number,
      required: true,
    },
    changedPosition: {
      type: Number,
      required: true,
    },
    originalBase: {
      type: String,
      required: true,
    },
    newBase: {
      type: String,
      required: true,
    },
    changeIndicator: {
      type: String,
    },
    message: {
      type: String,
    },
    name: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    geneType: {
      type: String,
      enum: ['crispr', 'rna', 'dna', 'protein', 'other'],
      default: 'dna',
      index: true,
    },
    isFavorite: {
      type: Boolean,
      default: false,
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    explanations: {
      type: [{
        text: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      }],
      default: [],
    },
    visualizations: {
      type: [{
        imageUrl: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ['sequence', 'diagram'],
          default: 'sequence',
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

// Add indexes for faster lookups and queries
geneSchema.index({ userId: 1 });
geneSchema.index({ createdAt: -1 });
geneSchema.index({ efficiency: -1 });
geneSchema.index({ originalEfficiency: -1 });
geneSchema.index({ 'metadata.experiment': 1 });
geneSchema.index({ userId: 1, isFavorite: 1 });
geneSchema.index({ userId: 1, isPublic: 1 });
geneSchema.index({ userId: 1, geneType: 1 });

// Create virtual field for improvement percentage
geneSchema.virtual('improvementPercentage').get(function() {
  return this.efficiency - this.originalEfficiency;
});

// Create and export Gene model
const Gene = mongoose.model<IGene>('Gene', geneSchema);
export default Gene; 