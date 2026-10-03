import { one, rows, uniqueViolation } from '../database.js'
import { mapUser } from '../mappers.js'
import { ApiError } from '../utils/errors.js'

export const findUserByEmail = async (email) =>
  mapUser(await one('select * from users where lower(email) = lower($1)', [email]))

export const findUserById = async (id) => mapUser(await one('select * from users where id = $1', [id]))

export const listUsers = async () =>
  rows('select * from users order by created_at asc').then((result) => result.map(mapUser))

export const insertUser = async (user) => {
  try {
    const row = await one(
      `insert into users (id, name, email, password_hash, role, phone, city, address, created_at)
       values (coalesce($1, gen_random_uuid()), $2, $3, $4, coalesce($5, 'user'), $6, $7, $8, coalesce($9, now()))
       returning *`,
      [
        user.id ?? null,
        user.name,
        user.email,
        user.passwordHash,
        user.role ?? 'user',
        user.phone || null,
        user.city || null,
        user.address || null,
        user.createdAt ?? null,
      ],
    )
    return mapUser(row)
  } catch (error) {
    if (uniqueViolation(error)) {
      throw ApiError.conflict('Ya existe una cuenta con ese email')
    }
    throw error
  }
}

export const updateUser = async (id, fields) => {
  const allowed = ['name', 'email', 'phone', 'city', 'address', 'passwordHash']
  const entries = Object.entries(fields).filter(([key]) => allowed.includes(key))
  if (entries.length === 0) return findUserById(id)

  const column = { passwordHash: 'password_hash' }
  const sets = entries.map(([key], index) => `${column[key] ?? key} = $${index + 1}`)
  const values = entries.map(([, value]) => value || null)

  try {
    const row = await one(
      `update users set ${sets.join(', ')} where id = $${values.length + 1} returning *`,
      [...values, id],
    )
    if (!row) throw ApiError.notFound('Usuario no encontrado')
    return mapUser(row)
  } catch (error) {
    if (uniqueViolation(error)) {
      throw ApiError.conflict('Ya existe una cuenta con ese email')
    }
    throw error
  }
}
