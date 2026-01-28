// backend/api-gateway/models/TrackedJob.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

// Sub-schema for status history
const StatusHistorySchema = new Schema({
  stage: {
    type: String,
    enum: ['saved', 'applied', 'screening', 'interview', 'offer', 'rejected', 'accepted'],
    required: true
  },
  changedAt: {
    type: Date,
    default: Date.now
  },
  note: {
    type: String,
    default: ''
  }
}, { _id: false });

// Sub-schema for notes
const NoteSchema = new Schema({
  content: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

// Sub-schema for reminders
const ReminderSchema = new Schema({
  date: {
    type: Date,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  }
}, { _id: true });

// Sub-schema for attachments
const AttachmentSchema = new Schema({
  fileName: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    default: 'application/pdf'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

// Sub-schema for interviews
const InterviewSchema = new Schema({
  round: {
    type: String,
    required: true
  },
  scheduledDate: {
    type: Date
  },
  interviewers: {
    type: String,
    default: ''
  },
  feedback: {
    type: String,
    default: ''
  },
  result: {
    type: String,
    enum: ['passed', 'failed', 'pending', ''],
    default: 'pending'
  }
}, { _id: true });

// Main TrackedJob Schema
const TrackedJobSchema = new Schema(
  {
    // Core Job Information
    userId: {
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
    salary: {
      type: String,
      default: ''
    },
    jobType: {
      type: String,
      default: 'Full-time'
    },
    description: {
      type: String,
      default: ''
    },
    applyLink: {
      type: String,
      default: ''
    },

    // Application Tracking
    stage: {
      type: String,
      enum: ['saved', 'applied', 'screening', 'interview', 'offer', 'rejected', 'accepted'],
      default: 'saved'
    },
    applicationDate: {
      type: Date
    },

    // Status History with Timestamps
    statusHistory: {
      type: [StatusHistorySchema],
      default: []
    },

    // User-Added Data
    notes: {
      type: [NoteSchema],
      default: []
    },

    // Reminders & Follow-ups
    reminders: {
      type: [ReminderSchema],
      default: []
    },

    // Attachments (resume versions, cover letters)
    attachments: {
      type: [AttachmentSchema],
      default: []
    },

    // Interview Information
    interviews: {
      type: [InterviewSchema],
      default: []
    },

    // Metadata from Job Hunter/Matcher
    source: {
      type: String,
      enum: ['hunter', 'matcher', 'manual'],
      default: 'manual'
    },
    matchScore: {
      type: Number,
      min: 0,
      max: 100
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

    // Priority & Urgency
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
  }
);

// Index for efficient querying
TrackedJobSchema.index({ userId: 1, stage: 1 });
TrackedJobSchema.index({ userId: 1, updatedAt: -1 });

// Middleware to automatically add to status history when stage changes
TrackedJobSchema.pre('save', function(next) {
  if (this.isModified('stage')) {
    this.statusHistory.push({
      stage: this.stage,
      changedAt: new Date(),
      note: ''
    });
  }
  next();
});

const TrackedJob = mongoose.model('TrackedJob', TrackedJobSchema);
export default TrackedJob;
