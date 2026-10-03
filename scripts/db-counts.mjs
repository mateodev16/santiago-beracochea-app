import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const before = await pool.query(
  'SELECT (SELECT count(*) FROM users) u,(SELECT count(*) FROM products) p,(SELECT count(*) FROM orders) o,(SELECT count(*) FROM order_items) i',
)
console.log(
  `  antes: usuarios=${before.rows[0].u} productos=${before.rows[0].p} pedidos=${before.rows[0].o} items=${before.rows[0].i}`,
)

await pool.query(
  'DELETE FROM orders WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)',
  ['smoke_%'],
)
await pool.query("DELETE FROM users WHERE email LIKE 'smoke_%'")
await pool.query("DELETE FROM orders WHERE id LIKE 'SB-%'")

const after = await pool.query(
  'SELECT (SELECT count(*) FROM users) u,(SELECT count(*) FROM products) p,(SELECT count(*) FROM orders) o,(SELECT count(*) FROM order_items) i',
)
console.log(
  `  despues: usuarios=${after.rows[0].u} productos=${after.rows[0].p} pedidos=${after.rows[0].o} items=${after.rows[0].i}`,
)

await pool.end()