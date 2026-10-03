import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { findUserById } from '../repositories/users.js'
import { ApiError, asyncHandler } from '../utils/errors.js'

export const publicUser = (user) => {
  if (!user) return null
  const { passwordHash, ...rest } = user
  return rest
}

export const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  })

const readToken = (req) => {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) return header.slice(7).trim()
  return undefined
}

export const attachUser = async (req, _res, next) => {
  const token = readToken(req)
  if (!token) {
    req.user = null
    return next()
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret)
    req.user = await findUserById(payload.sub)
  } catch {
    req.user = null
  }
  return next()
}

export const requireAuth = (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized())
  next()
}

export const requireAdmin = [
  requireAuth,
  (req, _res, next) => {
    if (req.user.role !== 'admin') return next(ApiError.forbidden())
    next()
  },
]

export const requireSelf = (handler) =>
  asyncHandler(async (req, res, next) => {
    const target = req.params.id
    if (req.user.role !== 'admin' && req.user.id !== target) {
      return next(ApiError.forbidden('No podés ver datos de otro usuario'))
    }
    return handler(req, res, next)
  })
