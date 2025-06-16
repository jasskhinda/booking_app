// Production-safe logging utility
export const logger = {
  log: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(...args);
    }
  },
  warn: (...args) => {
    console.warn(...args);
  },
  error: (...args) => {
    console.error(...args);
    
    // In production, you could send errors to an external logging service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to external logging service
      // sendToLoggingService({ level: 'error', message: args });
    }
  },
  debug: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(...args);
    }
  },
  info: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.info(...args);
    } else {
      // In production, still log important info but less verbosely
      console.log(...args);
    }
  }
};

export default logger;
