import pino from 'pino';
import { randomUUID } from 'crypto';

// Sensitive fields that should be redacted from logs
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'authorization',
  'cookie',
  'jwt',
  'apiKey',
  // Medical-specific fields
  'diagnosis',
  'medications',
  'symptoms'
];

// Error serializer to clean up error objects for logging
const errorSerializer = (err: Error) => {
  return {
    type: err.constructor.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  };
};

// Request serializer to clean up request objects for logging
const requestSerializer = (req: any) => {
  const cleanHeaders = { ...req.headers };
  // Redact sensitive headers
  SENSITIVE_FIELDS.forEach(field => {
    if (cleanHeaders[field]) {
      cleanHeaders[field] = '[REDACTED]';
    }
  });

  return {
    id: req.id,
    method: req.method,
    url: req.url,
    headers: cleanHeaders,
    remoteAddress: req.remoteAddress,
    remotePort: req.remotePort
  };
};

// Response serializer to clean up response objects for logging
const responseSerializer = (res: any) => {
  return {
    statusCode: res.statusCode,
    headers: res.getHeaders?.() || res.headers
  };
};

// Base logger configuration
const baseConfig = {
  timestamp: true,
  formatters: {
    level: (label: string) => ({ level: label }),
    bindings: () => ({}),
  },
  serializers: {
    err: errorSerializer,
    req: requestSerializer,
    res: responseSerializer,
  },
  redact: {
    paths: SENSITIVE_FIELDS,
    censor: '[REDACTED]'
  }
};

// Create transports based on environment
const streams = pino.multistream([
  // Console transport - info level and above
  {
    level: 'info',
    stream: pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
      }
    })
  },
  // File transport - debug level and above
  {
    level: 'debug',
    stream: pino.transport({
      target: process.env.NODE_ENV === 'production' ? 'pino-roll' : 'pino/file',
      options: process.env.NODE_ENV === 'production' 
        ? {
            file: 'logs/app/app.log',
            size: '10m',
            interval: '1d',
            mkdir: true
          }
        : {
            destination: 'logs/app/development.log',
            mkdir: true
          }
    })
  }
]);

// Create the logger instance
const logger = pino({
  ...baseConfig,
  level: 'debug', // Capture all logs
  mixin() {
    return {
      service: 'eprescription-api',
      env: process.env.NODE_ENV
    };
  }
}, streams);

// Middleware to add request ID and logging
export const requestLoggingMiddleware = () => {
  return (req: any, res: any, next: any) => {
    // Add unique request ID
    req.id = req.headers['x-request-id'] || randomUUID();
    res.setHeader('x-request-id', req.id);

    // Log request
    logger.info({ 
      req,
      msg: 'Incoming request'
    });

    // Log response on finish
    res.on('finish', () => {
      logger.info({
        res,
        req: {
          id: req.id,
          method: req.method,
          url: req.url
        },
        msg: 'Request completed',
        responseTime: res.getHeader('x-response-time')
      });
    });

    next();
  };
};

export default logger;
