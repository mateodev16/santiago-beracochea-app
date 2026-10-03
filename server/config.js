import process from 'node:process'
import { fileURLToPath } from 'node:url'

const toPath = (relative) => fileURLToPath(new URL(relative, import.meta.url))

export const config = {
  port: Number(process.env.PORT ?? 3001),
  host: process.env.HOST ?? 'localhost',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwtSecret: process.env.JWT_SECRET ?? 'sb-dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  corsOrigin: process.env.CORS_ORIGIN ?? true,
  dbFile: process.env.DB_FILE ?? toPath('./data/db.json'),
  databaseUrl:
    process.env.DATABASE_URL ??
    process.env.DATABASE_URL_PG ??
    'postgres://sb_app:sb1632app@localhost:5432/sb_store',
  databaseName: process.env.DATABASE_NAME ?? 'sb_store',
  databasePoolMax: Number(process.env.DATABASE_POOL_MAX ?? 10),
  catalogFile: toPath('../src/data/catalog.json'),
  adminEmail: process.env.ADMIN_EMAIL ?? 'admin@sb.com.uy',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'admin123',
  freeShippingThreshold: 800,
  shippingCost: 150,
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 10),
  publicApiUrl: (process.env.PUBLIC_API_URL ?? '').replace(/\/+$/, ''),
  imageMaxBytes: Number(process.env.IMAGE_MAX_BYTES ?? 2 * 1024 * 1024),
  serveStatic: process.env.SERVE_STATIC !== 'false',
  distDir: toPath('../dist/'),
}

export const isProduction = config.nodeEnv === 'production'

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET es obligatorio en producción')
}