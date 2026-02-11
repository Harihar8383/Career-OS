// backend/api-gateway/models/jdAnalysis.models.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const JdAnalysisSchema = new Schema(
  {
    clerkId: {
      type: String,
      required: true,
      index: true,
    },
    runId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'validating', 'parsing_jd', 'analyzing', 'complete', 'failed'],
      default: 'pending',
    },
    jdText: {
      type: String,
      required: true,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    analysisResults: {
      // This will store the final JSON output from the AI
      // e.g., { matchScore, jdSummary, comparisonMatrix, suggestions }
      type: Schema.Types.Mixed,
      default: null,
    },
    embedding: {
      // Vector embedding for semantic search (768 dimensions for Gemini)
      type: [Number],
      default: []
    },
  },
  {
    // This adds `createdAt` and `updatedAt` fields
    timestamps: true,
  }
);

// Explicitly name the collection 'jd_analyses'
const JdAnalysis = mongoose.model('JdAnalysis', JdAnalysisSchema, 'jd_analyses');
export default JdAnalysis;