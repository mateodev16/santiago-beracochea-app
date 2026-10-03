import { config } from '../config.js'

export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/avif']

// El header Content-Type lo manda el cliente, así que la validación real va por
// los magic bytes del archivo.
export const sniffImageMime = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null
  if (buffer.readUInt32BE(0) === 0x89504e47) return 'image/png'
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg'
  if (buffer.toString('latin1', 0, 4) === 'RIFF' && buffer.toString('latin1', 8, 12) === 'WEBP') {
    return 'image/webp'
  }
  if (buffer.toString('latin1', 4, 8) === 'ftyp') {
    const brand = buffer.toString('latin1', 8, 12)
    if (brand === 'avif' || brand === 'avis') return 'image/avif'
  }
  return null
}

export const formatBytes = (bytes) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`

// Ante un id inválido PostgreSQL lanza 22P02; lo filtramos acá para responder 404.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const isImageId = (value) => UUID_RE.test(String(value ?? ''))

// Las <img> no mandan el bearer token, así que la URL tiene que ser absoluta
// cuando la API vive en otro origen que el sitio.
export const imagePath = (id) => `/api/images/${id}`

// `PUBLIC_API_URL` es el origen de la API, sin `/api`; lo toleramos con y sin
// el prefijo para que no quede `/api/api/images/...`.
export const imageUrl = (id) => `${config.publicApiUrl.replace(/\/api$/, '')}${imagePath(id)}`