/**
 * Structured Logging Utility
 *
 * Provides structured JSON logging with correlation ID support for
 * distributed tracing and debugging.
 *
 * Related to: T014 - Structured logging implementation
 * Created: 2025-10-29
 */

/**
 * Log levels
 */
const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};

/**
 * Get the current log level from environment
 * @returns {string} Log level
 */
function getLogLevel() {
  return process.env.LOG_LEVEL || LogLevel.INFO;
}

/**
 * Check if a log level should be logged based on current configuration
 * @param {string} level - Log level to check
 * @returns {boolean} True if should log
 */
function shouldLog(level) {
  const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
  const currentLevel = getLogLevel();
  const currentIndex = levels.indexOf(currentLevel);
  const levelIndex = levels.indexOf(level);
  return levelIndex >= currentIndex;
}

/**
 * Create a structured log entry
 *
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} context - Additional context
 * @returns {Object} Structured log entry
 */
function createLogEntry(level, message, context = {}) {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    correlationId: context.correlationId || null,
    ...context,
    // Add environment info
    env: process.env.NODE_ENV || 'development',
  };
}

/**
 * Format and output log entry
 *
 * @param {Object} logEntry - Structured log entry
 */
function outputLog(logEntry) {
  const logString = JSON.stringify(logEntry);

  // Route to appropriate console method based on level
  switch (logEntry.level) {
    case LogLevel.DEBUG:
      console.debug(logString);
      break;
    case LogLevel.INFO:
      console.log(logString);
      break;
    case LogLevel.WARN:
      console.warn(logString);
      break;
    case LogLevel.ERROR:
      console.error(logString);
      break;
    default:
      console.log(logString);
  }
}

/**
 * Log an info-level message
 *
 * @param {string} message - Log message
 * @param {Object} context - Additional context
 * @example
 * logInfo('User logged in', { userId: '123', correlationId: 'abc' });
 */
function logInfo(message, context = {}) {
  if (!shouldLog(LogLevel.INFO)) return;

  const logEntry = createLogEntry(LogLevel.INFO, message, context);
  outputLog(logEntry);
}

/**
 * Log an error-level message
 *
 * @param {string} message - Log message
 * @param {Error|Object} errorOrContext - Error object or additional context
 * @param {Object} additionalContext - Additional context if first param is Error
 * @example
 * logError('Database connection failed', new Error('Connection timeout'), { correlationId: 'abc' });
 * logError('Invalid input', { field: 'email', correlationId: 'abc' });
 */
function logError(message, errorOrContext = {}, additionalContext = {}) {
  if (!shouldLog(LogLevel.ERROR)) return;

  let context = additionalContext;

  // If second parameter is an Error, extract error details
  if (errorOrContext instanceof Error) {
    context = {
      ...additionalContext,
      error: {
        name: errorOrContext.name,
        message: errorOrContext.message,
        stack: errorOrContext.stack,
      },
    };
  } else {
    context = errorOrContext;
  }

  const logEntry = createLogEntry(LogLevel.ERROR, message, context);
  outputLog(logEntry);
}

/**
 * Log a debug-level message
 *
 * @param {string} message - Log message
 * @param {Object} context - Additional context
 * @example
 * logDebug('Cache hit', { key: 'user:123', ttl: 3600 });
 */
function logDebug(message, context = {}) {
  if (!shouldLog(LogLevel.DEBUG)) return;

  const logEntry = createLogEntry(LogLevel.DEBUG, message, context);
  outputLog(logEntry);
}

/**
 * Log a warning-level message
 *
 * @param {string} message - Log message
 * @param {Object} context - Additional context
 * @example
 * logWarn('Rate limit approaching', { userId: '123', remaining: 10 });
 */
function logWarn(message, context = {}) {
  if (!shouldLog(LogLevel.WARN)) return;

  const logEntry = createLogEntry(LogLevel.WARN, message, context);
  outputLog(logEntry);
}

/**
 * Create a child logger with a persistent correlation ID
 *
 * @param {string} correlationId - Correlation ID for tracing
 * @returns {Object} Logger instance with bound correlation ID
 * @example
 * const logger = createLogger('migration-batch-123');
 * logger.info('Starting migration');
 * logger.error('Migration failed', new Error('Connection lost'));
 */
function createLogger(correlationId) {
  return {
    debug: (message, context = {}) => logDebug(message, { ...context, correlationId }),
    info: (message, context = {}) => logInfo(message, { ...context, correlationId }),
    warn: (message, context = {}) => logWarn(message, { ...context, correlationId }),
    error: (message, errorOrContext = {}, additionalContext = {}) => {
      const mergedContext = errorOrContext instanceof Error
        ? { ...additionalContext, correlationId }
        : { ...errorOrContext, correlationId };
      logError(message, errorOrContext, mergedContext);
    },
  };
}

/**
 * Log a timed operation
 *
 * @param {string} operationName - Name of the operation
 * @param {Function} fn - Async function to time
 * @param {Object} context - Additional context
 * @returns {Promise<any>} Result of the function
 * @example
 * const result = await logTimed('fetch-user', async () => {
 *   return await db.users.findOne({ id: '123' });
 * }, { userId: '123', correlationId: 'abc' });
 */
async function logTimed(operationName, fn, context = {}) {
  const startTime = Date.now();

  logDebug(`Starting ${operationName}`, context);

  try {
    const result = await fn();
    const duration = Date.now() - startTime;

    logInfo(`Completed ${operationName}`, {
      ...context,
      durationMs: duration,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    logError(`Failed ${operationName}`, error, {
      ...context,
      durationMs: duration,
    });

    throw error;
  }
}

module.exports = {
  logInfo,
  logError,
  logDebug,
  logWarn,
  createLogger,
  logTimed,
  LogLevel,
};
