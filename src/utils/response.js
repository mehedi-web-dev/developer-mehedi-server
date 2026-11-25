/**
 * Standard API response utility helpers
 */

export function sendSuccess(res, data, statusCode = 200, message = null) {
  const response = {
    success: true,
    data,
  };
  if (message) {
    response.message = message;
  }
  return res.status(statusCode).json(response);
}

export function sendPaginated(res, data, pagination, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    pagination: {
      page: Number(pagination.page),
      limit: Number(pagination.limit),
      totalItems: Number(pagination.totalItems),
      totalPages: Number(pagination.totalPages),
      hasNextPage: Boolean(pagination.hasNextPage),
      hasPrevPage: Boolean(pagination.hasPrevPage),
    },
  });
}

export function sendError(res, error, statusCode = 500, details = null) {
  const response = {
    success: false,
    error: typeof error === 'string' ? error : (error?.message || 'Internal Server Error'),
  };
  if (details) {
    response.details = details;
  }
  return res.status(statusCode).json(response);
}
