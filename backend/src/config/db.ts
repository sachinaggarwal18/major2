import mongoose from 'mongoose';

export async function connectToDB(): Promise<typeof mongoose> {
  const mongoUri = process.env.MONGO_URI;
  
  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined in the environment variables');
  }
  
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to DB');
    return mongoose;
  } catch (error: unknown) {
    console.error('MongoDB connection error:', error instanceof Error ? error.message : 'Unknown error occurred');
    process.exit(1);
  }
}

export default connectToDB;
