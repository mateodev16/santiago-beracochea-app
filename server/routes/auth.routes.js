import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { config } from '../config.js'
import { findUserByEmail, findUserById, insertUser, listUsers, updateUser } from '../repositories/users.js'
import { publicUser, requireAdmin, requireAuth, signToken } from '../middleware/auth.js'
import { ApiError, asyncHandler } from '../utils/errors.js'
import { loginSchema, registerSchema, updateProfileSchema } from '../validation.js'
import { uid } from '../utils/ids.js'

const router = Router()

const authResponse = (res, user, status = 200) =>
  res.status(status).json({ token: signToken(user), user: publicUser(user) })

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const input = registerSchema.parse(req.body)

    const user = await insertUser({
      id: uid(),
      name: input.name,
      email: input.email,
      passwordHash: bcrypt.hashSync(input.password, config.bcryptRounds),
      role: 'user',
      phone: input.phone,
      city: input.city,
      address: input.address,
      createdAt: new Date().toISOString(),
    })

    return authResponse(res, user, 201)
  }),
)

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body)
    const user = await findUserByEmail(input.email)

    if (!user || !bcrypt.compareSync(input.password, user.passwordHash)) {
      throw ApiError.unauthorized('Email o contraseña incorrectos')
    }

    return authResponse(res, user)
  }),
)

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await findUserById(req.user.id)
    if (!user) throw ApiError.notFound('Usuario no encontrado')
    res.json({ user: publicUser(user) })
  }),
)

router.patch(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const input = updateProfileSchema.parse(req.body)
    const { password, ...fields } = input

    if (password) fields.passwordHash = bcrypt.hashSync(password, config.bcryptRounds)

    const updated = await updateUser(req.user.id, fields)
    res.json({ user: publicUser(updated) })
  }),
)

router.get(
  '/users',
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const users = (await listUsers()).map(publicUser)
    res.json({ items: users, total: users.length })
  }),
)

export default router
