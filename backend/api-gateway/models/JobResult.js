// backend/api-gateway/models/JobResult.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const JobResultSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    sessionId: {
      type: String,
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true
    },
    company: {
      type: String,
      required: true
    },
    location: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    salary: {
      type: String,
      default: ''
    },
    salary_min: {
      type: Number,
      default: 0
    },
    salary_max: {
      type: Number,
      default: 0
    },
    applyLink: {
      type: String,
      required: true,
      unique: true
    },
    source: {
      type: String,
      enum: ['adzuna', 'google', 'jobspy'],
      required: true
    },
    status: {
      type: String,
      enum: ['new', 'applied'],
      default: 'new'
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    tierLabel: {
      type: String,
      default: ''
    },
    tier: {
      type: String,
      default: ''
    },
    badges: {
      type: [String],
      default: []
    },
    gapAnalysis: {
      type: String,
      default: ''
    },
    rank: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
  }
);

// Index for efficient querying by sessionId and userId
JobResultSchema.index({ sessionId: 1, userId: 1 });

const JobResult = mongoose.model('JobResult', JobResultSchema);
export default JobResult;
