import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
try {
  await pool.query(`
    DELETE FROM order_items
    WHERE order_id IN (
      SELECT id FROM orders
      WHERE user_id IN (
        SELECT id FROM users WHERE email LIKE 'smoke_%'
      )
    )
  `)
  await pool.query(`
    DELETE FROM orders
    WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'smoke_%')
  `)
  await pool.query("DELETE FROM users WHERE email LIKE 'smoke_%'")
  await pool.query("DELETE FROM orders WHERE id LIKE 'SB-%'")

  const r = await pool.query(
    'SELECT (SELECT count(*) FROM users) u,(SELECT count(*) FROM products) p,(SELECT count(*) FROM orders) o,(SELECT count(*) FROM order_items) i',
  )
  console.log(`usuarios=${r.rows[0].u} productos=${r.rows[0].p} pedidos=${r.rows[0].o} items=${r.rows[0].i}`)
} finally {
  await pool.end()
}