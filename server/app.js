import express from 'express'
import cors from 'cors'
import fs from 'node:fs'
import path from 'node:path'
import { config } from './config.js'
import authRoutes from './routes/auth.routes.js'
import imageRoutes from './routes/images.routes.js'
import productRoutes from './routes/products.routes.js'
import orderRoutes from './routes/orders.routes.js'
import metricsRoutes from './routes/metrics.routes.js'
import { attachUser } from './middleware/auth.js'
import { errorHandler, notFoundHandler, requestLogger } from './utils/middleware.js'

export const createApp = () => {
  const app = express()

  app.disable('x-powered-by')
  app.use(cors({ origin: config.corsOrigin }))
  app.use(express.json({ limit: '100kb' }))
  app.use(requestLogger)
  app.use(attachUser)

  app.get('/api/health', (_req, res) =>
    res.json({ status: 'ok', env: config.nodeEnv, uptime: process.uptime() }),
  )

  app.use('/api/auth', authRoutes)
  app.use('/api/images', imageRoutes)
  app.use('/api/products', productRoutes)
  app.use('/api/orders', orderRoutes)
  app.use('/api/metrics', metricsRoutes)

  if (config.serveStatic && fs.existsSync(config.distDir)) {
    app.use(express.static(config.distDir))
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api/')) return next()
      const fallback = path.join(config.distDir, 'index.html')
      if (fs.existsSync(fallback)) return res.sendFile(fallback)
      return next()
    })
  }

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}