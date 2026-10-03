export const LOGIN_PATH = '/login'
export const REGISTER_PATH = '/registro'

const PROTECTED_PREFIXES = ['/pedidos', '/perfil', '/checkout', '/admin']

export const isProtectedPath = (pathname: string) =>
  PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )

export const loginHref = (next?: string) =>
  next ? `${LOGIN_PATH}?next=${encodeURIComponent(next)}` : LOGIN_PATH

export const registerHref = (next?: string) =>
  next ? `${REGISTER_PATH}?next=${encodeURIComponent(next)}` : REGISTER_PATH

export const safeNext = (value: string | null): string | null => {
  if (!value) return null
  if (!value.startsWith('/') || value.startsWith('//')) return null
  return value
}
