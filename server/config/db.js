import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongodInstance = null;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/spendwise';
  
  try {
    // Attempt standard connection first with a short timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`[Database] Connected successfully to MongoDB at: ${uri}`);
  } catch (err) {
    console.warn(`[Database] Could not connect to primary MongoDB (${err.message}).`);
    console.log('[Database] Initializing automated MongoDB Memory Server fallback for local evaluation...');
    try {
      mongodInstance = await MongoMemoryServer.create();
      const memoryUri = mongodInstance.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[Database] Connected successfully to in-memory MongoDB at: ${memoryUri}`);
    } catch (fallbackErr) {
      console.error('[Database] Failed to initialize in-memory fallback:', fallbackErr.message);
      process.exit(1);
    }
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (err) {
    console.error('[Database] Disconnect error:', err.message);
  }
};
