import mongoose from 'mongoose';
import { env } from './env.js';
import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

export async function connectDatabase() {
  if (!env.mongoUri || env.mongoUri.includes('<username>')) {
    console.warn('MongoDB is not configured; the API is running without database connectivity.');
    return false;
  }

  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5_000 });
  console.info('MongoDB connected.');
  return true;
}

export function databaseStatus() {
  return mongoose.connection.readyState === 1 ? 'connected' : 'unavailable';
}
