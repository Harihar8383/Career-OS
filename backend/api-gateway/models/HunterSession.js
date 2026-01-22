// backend/api-gateway/models/HunterSession.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const HunterSessionSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    status: {
      type: String,
      enum: ['queued', 'running', 'completed', 'failed'],
      default: 'queued'
    },
    logs: {
      type: [String],
      default: []
    },
    criteria: {
      type: Schema.Types.Mixed,
      required: true
    }
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
  }
);

const HunterSession = mongoose.model('HunterSession', HunterSessionSchema);
export default HunterSession;
