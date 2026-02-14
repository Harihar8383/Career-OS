import mongoose from 'mongoose';
import dns from 'dns';

// Fix for Node.js v22 DNS resolver issue on Windows
// This forces Node.js to use Google Public DNS for SRV record lookups
// See: https://stackoverflow.com/questions/68386270/nodejs-mongoose-srv-query-failed
dns.setServers(['8.8.8.8', '8.8.4.4']);

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
    console.log(`⚠️  Server will continue running, but database operations will fail`);
    console.log(`💡 Please check your MongoDB connection string and network connectivity`);
    // Don't exit - allow server to start for debugging
  }
};

export default connectDB;