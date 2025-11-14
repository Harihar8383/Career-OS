import mongoose from 'mongoose';

// (This schema was missing in the original)
const projectSchema = new mongoose.Schema({
  title: String,
  description: String,
  tech: [String]
});

const experienceSchema = new mongoose.Schema({
  role: String,
  company: String,
  // --- ADDED: Fields from the form ---
  start: String,
  end: String,
  description: String
  // (removed 'duration' as 'start' and 'end' are better)
});

// --- NEW: Added Education Schema ---
const educationSchema = new mongoose.Schema({
  institution: String,
  degree: String,
  start: String,
  end: String
});

const profileSchema = new mongoose.Schema({
  // --- ADDED: All fields from the profile page ---
  name: { type: String },
  headline: { type: String },
  summary: { type: String },
  emails: [String],
  phones: [String],
  education: [educationSchema], // Use the new schema
  linkedin_url: String,
  github_url: String,
  
  // --- RENAMED: To be clear ---
  skills: [String], // This will hold the skills
  experience: [experienceSchema], // This will hold experience/projects
  
  // --- Preferences ---
  preferred_roles: [String],
  target_location: String,
  interests: [String],

  // --- For future features ---
  ai_analysis: { type: mongoose.Schema.Types.Mixed, default: null },
  
  // (Old fields removed for clarity)
  // ai_extracted_skills: [String], (Replaced by 'skills')
  // ai_extracted_projects: [projectSchema], (Merged into 'experience')
  // ai_extracted_experience: [experienceSchema], (Replaced by 'experience')
});

const userSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true }, 
  name: { type: String }, // Top-level name for easy access
  email: { type: String, required: true, unique: true },
  onboarding_complete: { type: Boolean, default: false },
  profile: profileSchema, // The single, complete profile object
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;