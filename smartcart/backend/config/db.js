const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,  // 30 s – give Atlas time to respond
      connectTimeoutMS:         30000,
      socketTimeoutMS:          45000,
      maxPoolSize:              10,
    });
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    // Retry once after 5 seconds before exiting
    setTimeout(async () => {
      try {
        await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 30000 });
        logger.info('MongoDB Connected (retry)');
      } catch (err) {
        logger.error(`MongoDB retry failed: ${err.message}`);
        process.exit(1);
      }
    }, 5000);
  }
};

// Handle connection events after initial connect
mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
mongoose.connection.on('reconnected',  () => logger.info('MongoDB reconnected'));

module.exports = connectDB;
