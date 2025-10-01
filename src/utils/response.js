/**
 * Standardized API response helper
 */
const sendResponse = (res, statusCode, data = null, message = "", error = "") => {
  const isSuccess = statusCode >= 200 && statusCode < 400;

  const response = {
    success: isSuccess,
    statusCode,
    timestamp: new Date().toISOString(),
  };

  if (message) {
    response.message = message;
  }

  if (data !== null) {
    response.data = data;
  }

  if (error) {
    response.error = error;
  }

  return res.status(statusCode).json(response);
};

/**
 * Success response helper
 */
const sendSuccess = (res, data = null, message = "Success", statusCode = 200) => {
  return sendResponse(res, statusCode, data, message);
};

/**
 * Error response helper
 */
const sendError = (res, error = "An error occurred", statusCode = 500, data = null) => {
  return sendResponse(res, statusCode, data, "", error);
};

/**
 * Validation error response helper
 */
const sendValidationError = (res, errors) => {
  return sendResponse(res, 400, null, "", errors);
};

/**
 * Not found response helper
 */
const sendNotFound = (res, message = "Resource not found") => {
  return sendResponse(res, 404, null, "", message);
};

/**
 * Unauthorized response helper
 */
const sendUnauthorized = (res, message = "Unauthorized access") => {
  return sendResponse(res, 401, null, "", message);
};

/**
 * Forbidden response helper
 */
const sendForbidden = (res, message = "Access forbidden") => {
  return sendResponse(res, 403, null, "", message);
};

module.exports = {
  sendResponse,
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
};
