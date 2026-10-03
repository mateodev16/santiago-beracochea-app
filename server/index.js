import { createApp } from './app.js'
import { config } from './config.js'
import { assertDatabaseReady } from './database.js'
import { orderMetrics } from './repositories/orders.js'
import { countProductsTable } from './repositories/products.js'
import { listUsers } from './repositories/users.js'
import { seedDatabase } from './seed.js'

const bootstrap = async () => {
  try {
    await assertDatabaseReady()
  } catch (error) {
    console.error('')
    console.error('  [api] No se pudo iniciar la API')
    console.error(`  ${error.message}`)
    console.error('')
    process.exit(1)
  }

  const seeded = await seedDatabase()

  const app = createApp()

  app.listen(config.port, config.host, async () => {
    const [users, products, metrics] = await Promise.all([
      listUsers(),
      countProductsTable(),
      orderMetrics(),
    ])

    console.log('')
    console.log(`  Santiago Beracochea API · ${config.nodeEnv}`)
    console.log(`  → http://${config.host}:${config.port}/api`)
    console.log(`  → http://${config.host}:${config.port}/api/health`)
    console.log(`  postgres: ${config.databaseName}`)
    console.log(
      `  usuarios: ${users.length} · productos: ${products} · pedidos: ${metrics.total}`,
    )
    if (seeded.created) {
      console.log(`  datos iniciales cargados desde el catálogo (${seeded.products} productos)`)
    }
    console.log(`  admin: ${config.adminEmail}`)
    console.log('')
  })
}

bootstrap()
