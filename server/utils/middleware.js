import { ZodError } from 'zod'
import { ApiError } from './errors.js'
import { config, isProduction } from '../config.js'

const fieldErrors = (error) =>
  Object.fromEntries(error.issues.map((issue) => [issue.path.join('.') || '_', issue.message]))

export const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Ruta no encontrada: ${req.method} ${req.originalUrl}`))
}

// eslint-disable-next-line no-unused-vars
export const errorHandler = (error, req, res, next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: 'Datos inválidos',
      message: error.issues[0]?.message ?? 'Revisá los campos enviados',
      fields: fieldErrors(error),
    })
  }

  if (error instanceof ApiError) {
    return res.status(error.status).json({
      error: error.name === 'ApiError' ? 'Error' : error.name,
      message: error.message,
      ...(error.details ? { fields: error.details } : {}),
    })
  }

  if (error?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Error', message: 'El cuerpo del request no es JSON válido' })
  }

  console.error('[api] error no controlado:', error)
  res.status(500).json({
    error: 'Error interno',
    message: 'Ocurrió un error inesperado en el servidor',
    ...(isProduction ? {} : { detail: String(error?.message ?? error) }),
  })
}

export const requestLogger = (req, res, next) => {
  const startedAt = process.hrtime.bigint()
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - startedAt) / 1e6
    console.log(`[api] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms`)
  })
  next()
}

export const jsonOk = (res, data, status = 200) => res.status(status).json(data)

export const describeConfig = () => ({
  env: config.nodeEnv,
  port: config.port,
  dbFile: config.dbFile,
})