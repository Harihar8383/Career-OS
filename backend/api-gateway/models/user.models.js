// backend/api-gateway/models/user.models.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

// ----------------------------------------------------------------------
// SUB-DOCUMENTS (for arrays within the profile)
// ----------------------------------------------------------------------

const EducationSchema = new Schema({
  institution_name: { type: String, required: true },
  degree: { type: String, required: true },
  branch: { type: String }, // Made optional as per many resumes
  start_date: { type: String }, // Made optional
  end_date: { type: String },   // Made optional
  gpa: { type: String },
  relevant_coursework: { type: [String] }
}, { _id: false });

const ProjectSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  bullet_points: { type: [String] },
  tech_stack: { type: [String] }, // Made optional
  github_link: { type: String },
  live_demo_link: { type: String }
}, { _id: false });

const ExperienceSchema = new Schema({
  role: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String },
  start_date: { type: String }, // Made optional
  end_date: { type: String },   // Made optional
  description_points: { type: [String] } // Made optional
}, { _id: false });

const AchievementSchema = new Schema({
  title: { type: String, required: true },
  issuer: { type: String },
  date: { type: String },
  description: { type: String }
}, { _id: false });

const PositionSchema = new Schema({
  role: { type: String, required: true },
  organization: { type: String, required: true },
  start_date: { type: String },
  end_date: { type: String },
  description_points: { type: [String] }
}, { _id: false });

const CertificationSchema = new Schema({
  name: { type: String, required: true },
  issuer: { type: String, required: true },
  issue_date: { type: String },
  credential_url: { type: String }
}, { _id: false });

const PublicationSchema = new Schema({
  title: { type: String, required: true },
  conference_journal: { type: String, required: true },
  status: { type: String },
  link: { type: String }
}, { _id: false });


// ----------------------------------------------------------------------
// MAIN USER SCHEMA
// ----------------------------------------------------------------------

const UserSchema = new Schema(
  {
    // Core user auth info
    clerkId: { // Renamed from auth_provider to be specific
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    onboarding_complete: { 
      type: Boolean, 
      default: false 
    },

    // The "Smart Profile" containing all resume data
    profile: {
      // Phase 1: AI-Extracted Data (from partial_profiles)
      // We will copy the AI data here upon completion
      ai_suggestions: {
        type: Schema.Types.Mixed,
        default: {}
      },

      // Phase 2: Comprehensive User-Verified Resume Data
      personal_info: {
        full_name: { type: String, default: '' },
        phone: { type: String, default: '' },
        email: { type: String, default: '' },
        location: { type: String, default: '' },
        linkedin_url: { type: String, default: '' },
        github_url: { type: String, default: '' },
        portfolio_url: { type: String, default: '' }
      },

      education: {
        type: [EducationSchema],
        default: []
      },

      skills: {
        programming_languages: { type: [String], default: [] },
        frameworks_libraries: { type: [String], default: [] },
        databases: { type: [String], default: [] },
        developer_tools_platforms: { type: [String], default: [] },
        other_tech: { type: [String], default: [] }
      },

      projects: {
        type: [ProjectSchema],
        default: []
      },

      experience: {
        type: [ExperienceSchema],
        default: []
      },

      achievements: {
        type: [AchievementSchema],
        default: []
      },

      positions_of_responsibility: {
        type: [PositionSchema],
        default: []
      },

      certifications: {
        type: [CertificationSchema],
        default: []
      },

      publications: {
        type: [PublicationSchema],
        default: []
      },
      
      career_preferences: {
        preferred_roles: { type: [String], default: [] },
        job_type: { type: [String], default: [] }, // e.g., 'Full-time', 'Internship'
        target_locations: { type: [String], default: [] },
        availability: { type: String } // e.g., 'Immediate', '2 weeks notice'
      }
    }
  },
  {
    // This adds `created_at` and `updated_at` fields
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
  }
);

const User = mongoose.model('User', UserSchema);
export default User;