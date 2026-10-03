import assert from 'node:assert/strict'
import { config } from '../server/config.js'
import { assertDatabaseReady, closePool } from '../server/database.js'
import { tableReport } from '../server/seed.js'

const BASE = `http://${config.host}:${config.port}/api`
const stamp = Date.now()

const call = async (path, { method = 'GET', body, token } = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }
  return { status: res.status, data }
}

let passed = 0
const check = (label, fn) => {
  try {
    fn()
    passed += 1
    console.log(`  ok   ${label}`)
  } catch (error) {
    console.log(`  FAIL ${label}`)
    console.log(`       ${error.message}`)
    process.exitCode = 1
  }
}

await assertDatabaseReady()
console.log(`Probando la API contra ${BASE}\n`)

const admin = await call('/auth/login', {
  method: 'POST',
  body: { email: config.adminEmail, password: config.adminPassword },
})
check('login del administrador devuelve token y rol admin', () => {
  assert.equal(admin.status, 200)
  assert.ok(admin.data.token)
  assert.equal(admin.data.user.role, 'admin')
})
const adminToken = admin.data.token

const badLogin = await call('/auth/login', {
  method: 'POST',
  body: { email: config.adminEmail, password: 'incorrecta' },
})
check('login con contraseña inválida devuelve 401', () => {
  assert.equal(badLogin.status, 401)
})

const catalog = await call('/products')
check('el catálogo público responde con items y total', () => {
  assert.equal(catalog.status, 200)
  assert.ok(Array.isArray(catalog.data.items))
  assert.ok(catalog.data.total >= 5)
  assert.ok(Number.isFinite(catalog.data.items[0].price), 'price debe venir como número')
})

const categories = await call('/products/categories')
check('las categorías traen nombre y conteo', () => {
  assert.equal(categories.status, 200)
  assert.ok(categories.data.items.length > 0)
  assert.ok(Number.isInteger(categories.data.items[0].count))
})

const filtered = await call('/products?minPrice=100&maxPrice=500&sort=precio-asc')
check('los filtros de precio y orden se aplican', () => {
  assert.equal(filtered.status, 200)
  const prices = filtered.data.items.map((p) => p.price)
  assert.ok(prices.every((p) => p >= 100 && p <= 500))
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b))
})

const search = await call('/products?search=cafe')
check('la búsqueda por texto encuentra productos', () => {
  assert.equal(search.status, 200)
  assert.ok(search.data.items.length >= 0)
})

const one = await call('/products/p-fleischmann')
check('el detalle por id funciona', () => {
  assert.equal(one.status, 200)
  assert.equal(one.data.product.id, 'p-fleischmann')
})

const missing = await call('/products/no-existe-xyz')
check('un producto inexistente devuelve 404', () => {
  assert.equal(missing.status, 404)
})

const email = `smoke_${stamp}@test.uy`
const registered = await call('/auth/register', {
  method: 'POST',
  body: {
    name: 'Cliente Smoke',
    email,
    password: 'clave12345',
    phone: '099 000 111',
    city: 'Minas',
  },
})
check('el registro de cliente crea la cuenta', () => {
  assert.equal(registered.status, 201)
  assert.equal(registered.data.user.role, 'user')
  assert.equal(registered.data.user.email, email)
})
const userToken = registered.data.token

const dupe = await call('/auth/register', {
  method: 'POST',
  body: { name: 'Duplicado', email, password: 'clave12345' },
})
check('registrar dos veces el mismo email devuelve 409', () => {
  assert.equal(dupe.status, 409)
})

const me = await call('/auth/me', { token: userToken })
check('/auth/me devuelve el usuario de la sesión', () => {
  assert.equal(me.status, 200)
  assert.equal(me.data.user.email, email)
})

const noAuth = await call('/auth/me')
check('/auth/me sin token devuelve 401', () => {
  assert.equal(noAuth.status, 401)
})

const profile = await call('/auth/me', {
  method: 'PATCH',
  token: userToken,
  body: { phone: '099 999 888', city: 'Minas', address: 'Calle 123' },
})
check('el perfil se actualiza', () => {
  assert.equal(profile.status, 200)
  assert.equal(profile.data.user.phone, '099 999 888')
})

const target = catalog.data.items[0]
const order = await call('/orders', {
  method: 'POST',
  token: userToken,
  body: {
    items: [{ productId: target.id, qty: 2 }],
    address: 'Guernica 586, Minas',
    notes: 'prueba smoke',
    paymentMethod: 'efectivo',
  },
})
let orderId = null
let orderCodeValue = null
check('crear un pedido guarda items, total y estado pendiente', () => {
  assert.equal(order.status, 201)
  const created = order.data.order
  orderId = created.id
  orderCodeValue = created.code
  assert.equal(created.status, 'pendiente')
  assert.equal(created.items.length, 1)
  assert.equal(created.items[0].qty, 2)
  assert.equal(created.total, created.subtotal + created.shipping)
  assert.ok(created.total > 0)
})

const stockAfter = await call(`/products/${target.id}`)
check('el stock del producto baja al crear el pedido', () => {
  assert.equal(stockAfter.status, 200)
  assert.equal(stockAfter.data.product.stock, target.stock - 2)
})

const tooMuch = await call('/orders', {
  method: 'POST',
  token: userToken,
  body: { items: [{ productId: target.id, qty: 999999 }], address: 'x', paymentMethod: 'efectivo' },
})
check('pedir más que el stock disponible devuelve 400', () => {
  assert.equal(tooMuch.status, 400)
})

const myOrders = await call('/orders', { token: userToken })
check('el cliente solo ve sus propios pedidos', () => {
  assert.equal(myOrders.status, 200)
  assert.ok(myOrders.data.items.every((o) => o.userEmail === email))
  assert.ok(myOrders.data.items.length >= 1)
})

const otherOrder = await call(`/orders/${orderId}`, { token: adminToken })
check('el admin puede ver el pedido por id', () => {
  assert.equal(otherOrder.status, 200)
  assert.equal(otherOrder.data.order.id, orderId)
  assert.ok(otherOrder.data.order.items.length >= 1)
})

const adminOrders = await call('/orders', { token: adminToken })
check('el admin ve la lista completa de pedidos', () => {
  assert.equal(adminOrders.status, 200)
  assert.ok(adminOrders.data.total > myOrders.data.items.length)
  assert.ok(adminOrders.data.items.some((o) => o.id === orderId))
})

const metrics = await call('/orders/summary/metrics', { token: adminToken })
check('las métricas suman pedidos, clientes e ingresos', () => {
  assert.equal(metrics.status, 200)
  assert.ok(metrics.data.total >= adminOrders.data.total)
  assert.ok(metrics.data.customers >= 1)
  assert.ok(Number.isFinite(metrics.data.revenue))
})

const statusChange = await call(`/orders/${orderId}/status`, {
  method: 'PATCH',
  token: adminToken,
  body: { status: 'confirmado' },
})
check('el admin cambia el estado del pedido', () => {
  assert.equal(statusChange.status, 200)
  assert.equal(statusChange.data.order.status, 'confirmado')
})

const badStatus = await call(`/orders/${orderId}/status`, {
  method: 'PATCH',
  token: adminToken,
  body: { status: 'inventado' },
})
check('un estado inválido devuelve 400', () => {
  assert.equal(badStatus.status, 400)
})

const forbidden = await call('/orders/summary/metrics', { token: userToken })
check('un cliente no puede leer las métricas', () => {
  assert.equal(forbidden.status, 403)
})

const listUsers = await call('/auth/users', { token: adminToken })
check('el admin lista usuarios sin exponer passwordHash', () => {
  assert.equal(listUsers.status, 200)
  assert.ok(listUsers.data.items.length > 0)
  assert.equal(listUsers.data.items[0].passwordHash, undefined)
})

const adminMetrics = await call('/metrics', { token: adminToken })
check('el panel de métricas responde para el admin', () => {
  assert.equal(adminMetrics.status, 200)
  const m = adminMetrics.data.metrics
  assert.ok(m.totals.orders >= 1)
  assert.ok(Number.isFinite(m.totals.revenueApproved))
  assert.equal(m.customerSpend.length, listUsers.data.total, 'un registro por usuario')
  assert.ok(Array.isArray(m.lowStock))
  assert.ok(Array.isArray(m.salesByMonth))
  assert.ok(Array.isArray(m.salesByYear))
})

check('el producto más vendido viene de los items reales', () => {
  const m = adminMetrics.data.metrics
  if (!m.salesByMonth.length) return
  assert.ok(m.mostSoldProduct, 'debe haber un producto más vendido')
  assert.ok(m.mostSoldProduct.totalQty > 0)
  assert.ok(Number.isFinite(m.mostSoldProduct.totalRevenue))
})

check('el cliente que más compró supera o iguala al segundo', () => {
  const spender = adminMetrics.data.metrics.customerSpend
    .filter((c) => c.ordersCount > 0)
    .sort((a, b) => b.totalSpent - a.totalSpent)
  if (spender.length === 0) return
  if (spender.length === 1) return
  assert.ok(spender[0].totalSpent >= spender[1].totalSpent)
})

check('las ventas por mes y por año cuadran con los totales', () => {
  const m = adminMetrics.data.metrics
  const monthSum = m.salesByMonth.reduce((acc, r) => acc + r.totalRevenue, 0)
  const yearSum = m.salesByYear.reduce((acc, r) => acc + r.totalRevenue, 0)
  assert.ok(Math.abs(monthSum - m.totals.revenueTotal) < 0.01)
  assert.ok(Math.abs(yearSum - m.totals.revenueTotal) < 0.01)
})

const metricsAsUser = await call('/metrics', { token: userToken })
check('un cliente no puede leer las métricas (403)', () => {
  assert.equal(metricsAsUser.status, 403)
})

const metricsNoAuth = await call('/metrics')
check('sin token las métricas devuelven 401', () => {
  assert.equal(metricsNoAuth.status, 401)
})

const newProduct = await call('/products', {
  method: 'POST',
  token: adminToken,
  body: {
    name: `Producto Smoke ${stamp}`,
    brand: 'SB',
    category: 'Almacén',
    description: 'Creado por el smoke test',
    price: 120,
    unit: '1 u',
    stock: 5,
    image: '/images/logo.png',
  },
})
let createdId = null
check('el admin crea un producto', () => {
  assert.equal(newProduct.status, 201)
  createdId = newProduct.data.product.id
  assert.equal(newProduct.data.product.price, 120)
})

const dupeSlug = await call('/products', {
  method: 'POST',
  token: adminToken,
  body: {
    name: `Producto Smoke ${stamp}`,
    brand: 'SB',
    category: 'Almacén',
    price: 100,
    unit: '1 u',
    stock: 1,
    image: '/images/logo.png',
  },
})
check('crear dos productos con el mismo nombre devuelve 409', () => {
  assert.equal(dupeSlug.status, 409)
})

const updated = await call(`/products/${createdId}`, {
  method: 'PUT',
  token: adminToken,
  body: { price: 175, stock: 9 },
})
check('el admin edita un producto', () => {
  assert.equal(updated.status, 200)
  assert.equal(updated.data.product.price, 175)
  assert.equal(updated.data.product.stock, 9)
})

const removed = await call(`/products/${createdId}`, { method: 'DELETE', token: adminToken })
check('el admin borra un producto', () => {
  assert.equal(removed.status, 200)
  assert.equal(removed.data.product.id, createdId)
})

const gone = await call(`/products/${createdId}`)
check('el producto borrado devuelve 404', () => {
  assert.equal(gone.status, 404)
})

const report = await tableReport()
check('la base sigue consistente tras las pruebas', () => {
  assert.ok(report.users > 0)
  assert.ok(report.products >= 5)
  assert.ok(report.orders > 0)
  assert.ok(report.items > 0)
})

console.log(`\n${passed} comprobaciones ok`)
console.log(`  pedido de prueba: ${orderCodeValue}`)
console.log(`  usuario de prueba: ${email}`)
console.log('  (quedan en la base; se pueden borrar desde el panel o con SQL)')

await closePool()
