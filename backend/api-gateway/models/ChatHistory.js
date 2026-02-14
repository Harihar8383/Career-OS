// backend/api-gateway/models/ChatHistory.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const ChatHistorySchema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  threadId: {
    type: String,
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system', 'action_card'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  embedding: {
    type: [Number],  // 768 dimensions for Gemini text-embedding-004
    default: []
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound index for efficient thread retrieval
ChatHistorySchema.index({ userId: 1, threadId: 1, createdAt: -1 });

const ChatHistory = mongoose.model('ChatHistory', ChatHistorySchema);
export default ChatHistory;
