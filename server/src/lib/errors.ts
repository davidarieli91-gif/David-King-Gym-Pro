export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function apiError(statusCode: number, code: string, message: string, details?: unknown): ApiError {
  return new ApiError(statusCode, code, message, details);
}

export const errors = {
  badRequest: (message = 'Bad request', details?: unknown) => apiError(400, 'bad_request', message, details),
  unauthorized: (message = 'Authentication required') => apiError(401, 'unauthorized', message),
  forbidden: (message = 'Forbidden') => apiError(403, 'forbidden', message),
  notFound: (message = 'Not found') => apiError(404, 'not_found', message),
  conflict: (message = 'Conflict', details?: unknown) => apiError(409, 'conflict', message, details),
  tooMany: (message = 'Too many requests') => apiError(429, 'too_many_requests', message),
  internal: (message = 'Internal server error') => apiError(500, 'internal_error', message),
};
