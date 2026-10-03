import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
try {
  const ids = await pool.query(
    "SELECT o.id FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email LIKE 'smoke_%'",
  )
  if (ids.rows.length) {
    const inClause = ids.rows.map((_, i) => `$${i + 1}`).join(',')
    const orderIds = ids.rows.map((r) => r.id)
    await pool.query(`DELETE FROM order_items WHERE order_id IN (${inClause})`, orderIds)
    await pool.query(`DELETE FROM orders WHERE id IN (${inClause})`, orderIds)
  }
  await pool.query("DELETE FROM users WHERE email LIKE 'smoke_%'")
  await pool.query("DELETE FROM orders WHERE id::text LIKE 'SB-%'")

  const r = await pool.query(
    'SELECT (SELECT count(*) FROM users) u,(SELECT count(*) FROM products) p,(SELECT count(*) FROM orders) o,(SELECT count(*) FROM order_items) i',
  )
  console.log(`usuarios=${r.rows[0].u} productos=${r.rows[0].p} pedidos=${r.rows[0].o} items=${r.rows[0].i}`)
} finally {
  await pool.end()
}