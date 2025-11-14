import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
      throw new Error("Missing MONGODB_URI or MONGO_URI in .env file");
    }
    
    const conn = await mongoose.connect(uri, { dbName: 'career_os' });
    console.log(`✅ API Gateway connected to MongoDB: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1); 
  }
};

export default connectDB;