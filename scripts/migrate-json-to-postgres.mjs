import { assertDatabaseReady, closePool, one } from '../server/database.js'
import { insertProduct } from '../server/repositories/products.js'
import { insertUser, findUserByEmail, listUsers } from '../server/repositories/users.js'
import { insertRawOrder, orderMetrics } from '../server/repositories/orders.js'
import { uid } from '../server/utils/ids.js'

const jsonUrl = new URL('../server/data/db.json', import.meta.url)
const source = await import('node:fs').then((fs) => JSON.parse(fs.readFileSync(jsonUrl, 'utf8')))

await assertDatabaseReady()

console.log('Migrando server/data/db.json → PostgreSQL\n')

const idMap = new Map()
let users = 0
let products = 0
let orders = 0
let items = 0

for (const user of source.users ?? []) {
  const existing = await findUserByEmail(user.email)
  if (existing) {
    idMap.set(user.id, existing.id)
    continue
  }
  const created = await insertUser({
    id: user.id ?? uid(),
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    role: user.role,
    phone: user.phone,
    city: user.city,
    address: user.address,
    createdAt: user.createdAt,
  })
  idMap.set(user.id, created.id)
  users += 1
}

for (const product of source.products ?? []) {
  try {
    await insertProduct({
      id: product.id ?? uid(),
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      category: product.category,
      description: product.description,
      price: product.price,
      unit: product.unit,
      image: product.image,
      badge: product.badge || null,
      stock: product.stock,
      active: product.active ?? true,
      createdAt: product.createdAt,
    })
    products += 1
  } catch (error) {
    console.warn(`  ! producto ${product.id} omitido: ${error.message}`)
  }
}

for (const order of source.orders ?? []) {
  const userId = idMap.get(order.userId) ?? order.userId

  const alreadyThere = await one('select id from orders where id = $1 or code = $2', [
    order.id,
    order.code,
  ])
  if (alreadyThere) continue

  try {
    await insertRawOrder(
      {
        id: order.id,
        code: order.code,
        userId,
        userName: order.userName,
        userEmail: order.userEmail,
        subtotal: order.subtotal,
        shipping: order.shipping,
        total: order.total,
        status: order.status,
        address: order.address,
        notes: order.notes,
        paymentMethod: order.paymentMethod,
        date: order.date,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
      order.items ?? [],
    )
    orders += 1
    items += (order.items ?? []).length
  } catch (error) {
    console.warn(`  ! pedido ${order.code} omitido: ${error.message}`)
  }
}

const metrics = await orderMetrics()
const allUsers = await listUsers()

console.log('Migración completada')
console.log(`  usuarios nuevos:  ${users} (total ${allUsers.length})`)
console.log(`  productos nuevos: ${products}`)
console.log(`  pedidos nuevos:   ${orders} (total ${metrics.total})`)
console.log(`  items insertados: ${items}`)

await closePool()
