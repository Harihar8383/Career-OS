import mongoose from 'mongoose';

const partialProfileSchema = new mongoose.Schema({
  user_id: { type: String, required: true }, // This is the Clerk ID
  file_url: { type: String, required: true },
  file_name: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'validated', 'failed'], 
    default: 'pending' 
  },
  extracted_data: { type: mongoose.Schema.Types.Mixed }, // Stores the raw JSON
}, { timestamps: true });

// Explicitly name the collection 'partial_profiles'
const PartialProfile = mongoose.model('PartialProfile', partialProfileSchema, 'partial_profiles');
export default PartialProfile;