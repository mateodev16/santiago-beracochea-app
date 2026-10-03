const BASE = import.meta.env.PUBLIC_API_URL ?? '/api'
const TOKEN_KEY = 'sb_token'

export class ApiError extends Error {
  status: number
  fields: Record<string, string> | undefined

  constructor(status: number, message: string, fields?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fields = fields
  }
}

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(TOKEN_KEY)
}

export const setToken = (token: string) => window.localStorage.setItem(TOKEN_KEY, token)

export const clearToken = () => window.localStorage.removeItem(TOKEN_KEY)

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface ErrorPayload {
  message?: string
  fields?: Record<string, string>
}

const errorFromResponse = async (response: Response): Promise<ApiError> => {
  const raw = await response.text().catch(() => '')
  let payload: ErrorPayload | null = null

  try {
    payload = raw ? (JSON.parse(raw) as ErrorPayload) : null
  } catch {
    payload = null
  }

  if (payload?.message) return new ApiError(response.status, payload.message, payload.fields)

  // Sin JSON válido la respuesta no viene de la API: es el proxy de Vite sin
  // backend detrás, así que el status 500 no era un error interno del server.
  return new ApiError(
    response.status,
    response.status >= 500
      ? 'La API no está disponible. ¿Está corriendo el backend? (npm run dev)'
      : `Respuesta inesperada del servidor (${response.status})`,
  )
}

async function request<T>(path: string, method: Method = 'GET', body?: unknown): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {}

  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'No pudimos conectar con el servidor. Revisá tu conexión.')
  }

  if (response.status === 204) return undefined as T

  if (!response.ok) throw await errorFromResponse(response)

  return (await response.json()) as T
}

const qs = (params: Record<string, string | number | boolean | undefined>) => {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value))
  })
  const query = search.toString()
  return query ? `?${query}` : ''
}

export interface ListResponse<T> {
  items: T[]
  total: number
}

export interface UploadedImage {
  id: string
  url: string
  mime: string
  size: number
}

// Va aparte de `request` porque el browser tiene que poner el boundary del
// multipart; si fijamos Content-Type a mano la request queda mal formada.
async function uploadFile(path: string, file: File): Promise<{ image: UploadedImage }> {
  const token = getToken()
  const body = new FormData()
  body.append('file', file)

  let response: Response
  try {
    response = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body,
    })
  } catch {
    throw new ApiError(0, 'No pudimos subir la imagen. Revisá tu conexión.')
  }

  if (!response.ok) throw await errorFromResponse(response)

  return (await response.json()) as { image: UploadedImage }
}

export const api = {
  health: () => request<{ status: string }>('/health'),

  images: {
    upload: (file: File) => uploadFile('/images', file),
  },

  auth: {
    register: (payload: {
      name: string
      email: string
      password: string
      phone?: string
      city?: string
      address?: string
    }) => request<{ token: string; user: import('./types').User }>('/auth/register', 'POST', payload),

    login: (payload: { email: string; password: string }) =>
      request<{ token: string; user: import('./types').User }>('/auth/login', 'POST', payload),

    me: () => request<{ user: import('./types').User }>('/auth/me'),

    updateMe: (payload: {
      name?: string
      phone?: string
      city?: string
      address?: string
      password?: string
    }) => request<{ user: import('./types').User }>('/auth/me', 'PATCH', payload),
  },

  products: {
    list: (params: {
      search?: string
      category?: string
      brand?: string
      minPrice?: number
      maxPrice?: number
      inStock?: boolean
      sort?: string
      page?: number
      limit?: number
    } = {}) =>
      request<
        ListResponse<import('../data/products').Product> & {
          page: number
          limit: number
          totalPages: number
        }
      >(`/products${qs(params)}`),

    get: (idOrSlug: string) =>
      request<{ product: import('../data/products').Product }>(`/products/${idOrSlug}`),

    create: (payload: Partial<import('../data/products').Product>) =>
      request<{ product: import('../data/products').Product }>('/products', 'POST', payload),

    update: (id: string, payload: Partial<import('../data/products').Product>) =>
      request<{ product: import('../data/products').Product }>(`/products/${id}`, 'PUT', payload),

    remove: (id: string) =>
      request<{ product: import('../data/products').Product }>(`/products/${id}`, 'DELETE'),
  },

  orders: {
    list: (params: { status?: string } = {}) =>
      request<ListResponse<import('./types').Order>>(`/orders${qs(params)}`),

    create: (payload: {
      items: { productId: string; qty: number }[]
      address: string
      notes?: string
      paymentMethod: string
    }) => request<{ order: import('./types').Order }>('/orders', 'POST', payload),

    setStatus: (id: string, status: string) =>
      request<{ order: import('./types').Order }>(`/orders/${id}/status`, 'PATCH', { status }),
  },

  metrics: {
    report: () =>
      request<{ metrics: import('./types').AdminMetrics; admin: string }>('/metrics'),
  },
}