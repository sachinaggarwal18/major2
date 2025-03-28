import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export interface AppError extends Error {
  statusCode?: number;
  errors?: Record<string, unknown>;
  isOperational?: boolean;
  code?: string;
  path?: string;
  requestId?: string;
}

/**
 * Custom error class for application errors
 */
export class ApplicationError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;
  errors?: Record<string, unknown>;
  code?: string;
  path?: string;
  requestId?: string;

  constructor(
    message: string, 
    statusCode = 500, 
    errors?: Record<string, unknown>,
    code?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    this.code = code ?? this.constructor.name;
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handler middleware
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  const statusCode = err.statusCode ?? 500;
  const message = err.message || 'Something went wrong';
  
  // Enhance error with request details
  err.path = req.path;
  err.requestId = req.id;

  // Log error with appropriate level based on status code
  if (statusCode >= 500) {
    logger.error({ err, req, res }, `Server error: ${message}`);
  } else if (statusCode >= 400) {
    logger.warn({ err, req, res }, `Client error: ${message}`);
  } else {
    logger.info({ err, req, res }, message);
  }

  interface ErrorResponse {
    success: boolean;
    message: string;
    errors?: Record<string, unknown>;
    code?: string;
    requestId?: string;
    stack?: string;
  }

  const response: ErrorResponse = {
    success: false,
    message,
    errors: err.errors,
    code: err.code,
    requestId: req.id
  };

  // Only include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }
  
  res.status(statusCode).json(response);
};

/**
 * Middleware to handle 404 errors for unhandled routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const err = new ApplicationError(
    `Not found - ${req.originalUrl}`,
    404,
    undefined,
    'ROUTE_NOT_FOUND'
  );
  _next(err);
};

/**
 * Async error handler wrapper
 * @param fn The route handler function to wrap with error handling
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) => {
  return (req: Request, res: Response, next: NextFunction): Promise<unknown> => {
    return Promise.resolve(fn(req, res, next))
      .catch(error => {
        // Enhance error with request context
        if (error instanceof ApplicationError) {
          error.path = req.path;
          error.requestId = req.id;
        }
        next(error);
      });
  };
};

/**
 * Database error handler
 * Converts database errors to application errors
 */
export const handleDatabaseError = (error: Error): ApplicationError => {
  logger.error({ err: error }, 'Database error occurred');
  
  if (error.message.includes('unique constraint')) {
    return new ApplicationError(
      'Resource already exists',
      409,
      undefined,
      'UNIQUE_VIOLATION'
    );
  }
  
  return new ApplicationError(
    'Database error occurred',
    500,
    undefined,
    'DATABASE_ERROR'
  );
};
