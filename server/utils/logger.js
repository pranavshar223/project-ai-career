// Basic logger that can be upgraded to Winston/Pino later
const logger = {
  info: (message, ...args) => console.log(`[INFO] ${message}`, ...args),
  warn: (message, ...args) => console.warn(`[WARN] ${message}`, ...args),
  error: (msgOrErr, ...args) => {
    const err = msgOrErr instanceof Error ? msgOrErr : args.find(a => a instanceof Error);
    const msg = typeof msgOrErr === 'string' ? msgOrErr : (err ? err.message : '');
    
    console.error(`[ERROR] ${msg}`);
    
    if (err && process.env.NODE_ENV === 'development' && err.stack && !err.isOperational) {
      console.error(err.stack);
    }
  },
  debug: (message, ...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
};

module.exports = logger;
