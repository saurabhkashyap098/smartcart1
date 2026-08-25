const { createLogger, format, transports } = require('winston');
const path = require('path');

const { combine, timestamp, printf, colorize, errors } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// In production (Render), only use Console transport (no file writes needed)
// Render has ephemeral storage and captures stdout/stderr automatically
const transportsList = [
  new transports.Console({
    format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), logFormat),
    silent: process.env.NODE_ENV === 'test',
  }),
];

// Only add file transports in development
if (process.env.NODE_ENV !== 'production') {
  try {
    require('winston-daily-rotate-file');
    const logsDir = path.join(__dirname, '../logs');
    const fs = require('fs');
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
    transportsList.push(
      new transports.DailyRotateFile({
        dirname: logsDir,
        filename: 'app-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxFiles: '14d',
        maxSize: '20m',
      })
    );
    transportsList.push(
      new transports.DailyRotateFile({
        dirname: logsDir,
        filename: 'error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxFiles: '30d',
        maxSize: '20m',
      })
    );
  } catch(e) {
    console.warn('File logging unavailable:', e.message);
  }
}

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports: transportsList,
});

module.exports = logger;
