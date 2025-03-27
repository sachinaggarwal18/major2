"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendForbidden = exports.sendUnauthorized = exports.sendNotFound = exports.sendError = exports.sendSuccess = void 0;
/**
 * Standard success response formatter
 */
const sendSuccess = (res, data, message = 'Operation successful', statusCode = 200) => {
    res.status(statusCode).json({
        success: true,
        message,
        data
    });
};
exports.sendSuccess = sendSuccess;
/**
 * Standard error response formatter
 */
const sendError = (res, message = 'Internal server error', statusCode = 500, errors = null) => {
    const response = {
        success: false,
        message
    };
    if (errors) {
        response.errors = errors;
    }
    res.status(statusCode).json(response);
};
exports.sendError = sendError;
/**
 * Not found response
 */
const sendNotFound = (res, message = 'Resource not found') => {
    (0, exports.sendError)(res, message, 404);
};
exports.sendNotFound = sendNotFound;
/**
 * Unauthorized response
 */
const sendUnauthorized = (res, message = 'Unauthorized access') => {
    (0, exports.sendError)(res, message, 401);
};
exports.sendUnauthorized = sendUnauthorized;
/**
 * Forbidden response
 */
const sendForbidden = (res, message = 'Access denied') => {
    (0, exports.sendError)(res, message, 403);
};
exports.sendForbidden = sendForbidden;
