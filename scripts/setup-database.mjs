import { config } from '../server/config.js'
import { assertDatabaseReady, closePool } from '../server/database.js'
import { tableReport } from '../server/seed.js'

const mask = (url) => url.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')

console.log('Santiago Beracochea · PostgreSQL')
console.log(`  conexión: ${mask(config.databaseUrl)}\n`)

try {
  await assertDatabaseReady()
  console.log('  ✓ conexión correcta')
  console.log('  ✓ esquema verificado (users, products, orders, order_items)')

  const report = await tableReport()
  console.log('\n  Contenido actual:')
  console.log(`    usuarios:      ${report.users}`)
  console.log(`    productos:     ${report.products}`)
  console.log(`    pedidos:       ${report.orders}`)
  console.log(`    items pedidos: ${report.items}`)
} catch (error) {
  console.error(`  ✗ ${error.message}`)
  console.error('\n  Revisá que el servicio de PostgreSQL esté corriendo y que .env tenga')
  console.error('  una DATABASE_URL válida.')
  process.exitCode = 1
} finally {
  await closePool()
}
