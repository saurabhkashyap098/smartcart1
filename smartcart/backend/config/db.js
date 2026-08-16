const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS:         10000,
      socketTimeoutMS:          30000,
      maxPoolSize:              10,
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    logger.warn('Server will continue running without database. Some features may be unavailable.');
    // Retry in background without blocking server startup or crashing
    setTimeout(async () => {
      try {
        await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
        logger.info('MongoDB Connected (retry successful)');
      } catch (err) {
        logger.error(`MongoDB retry failed: ${err.message}`);
        // Do NOT exit — keep server alive for AI chat & static files
      }
    }, 8000);
  }
};

// Handle connection events after initial connect
mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
mongoose.connection.on('reconnected',  () => logger.info('MongoDB reconnected'));

module.exports = connectDB;
