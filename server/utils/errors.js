export class ApiError extends Error {
  constructor(status, message, details) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }

  static badRequest(message, details) {
    return new ApiError(400, message, details)
  }

  static unauthorized(message = 'Necesitás iniciar sesión') {
    return new ApiError(401, message)
  }

  static forbidden(message = 'No tenés permisos para esta acción') {
    return new ApiError(403, message)
  }

  static notFound(message = 'Recurso no encontrado') {
    return new ApiError(404, message)
  }

  static conflict(message) {
    return new ApiError(409, message)
  }

  static internal(message) {
    return new ApiError(500, message)
  }
}

export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next)