import { Response } from 'express';

/**
 * Standard success response formatter
 */
export const sendSuccess = <T>(
  res: Response, 
  data: T, 
  message = 'Operation successful',
  statusCode = 200
): void => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Standard error response formatter
 */
export const sendError = (
  res: Response,
  message = 'Internal server error',
  statusCode = 500,
  errors: any = null
): void => {
  const response: {
    success: boolean;
    message: string;
    errors?: any;
  } = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  res.status(statusCode).json(response);
};

/**
 * Not found response
 */
export const sendNotFound = (
  res: Response,
  message = 'Resource not found'
): void => {
  sendError(res, message, 404);
};

/**
 * Unauthorized response
 */
export const sendUnauthorized = (
  res: Response,
  message = 'Unauthorized access'
): void => {
  sendError(res, message, 401);
};

/**
 * Forbidden response
 */
export const sendForbidden = (
  res: Response,
  message = 'Access denied'
): void => {
  sendError(res, message, 403);
};