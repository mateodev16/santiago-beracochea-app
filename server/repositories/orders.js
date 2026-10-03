import { one, pool, query, withTransaction } from '../database.js'
import { mapOrder } from '../mappers.js'
import { orderCode } from '../utils/ids.js'

const loadItems = async (orderId, executor = pool) => {
  const result = await executor.query(
    'select * from order_items where order_id = $1 order by id asc',
    [orderId],
  )
  return result.rows
}

export const insertOrder = async (order, items) =>
  withTransaction(async (client) => {
    const { rows: inserted } = await client.query(
      `insert into orders
         (id, code, user_id, user_name, user_email, subtotal, shipping, total, status,
          address, notes, payment_method, date, created_at, updated_at)
       values (coalesce($1, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, $9,
               $10, $11, $12, $13, coalesce($14, now()), coalesce($15, now()))
       returning *`,
      [
        order.id ?? null,
        order.code,
        order.userId,
        order.userName,
        order.userEmail,
        order.subtotal,
        order.shipping,
        order.total,
        order.status,
        order.address || null,
        order.notes || null,
        order.paymentMethod || null,
        order.date,
        order.createdAt ?? null,
        order.updatedAt ?? null,
      ],
    )

    const saved = inserted[0]

    for (const item of items) {
      await client.query(
        `insert into order_items (order_id, product_id, slug, name, brand, image, price, qty)
         values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [saved.id, item.productId, item.slug, item.name, item.brand, item.image, item.price, item.qty],
      )
      await client.query('update products set stock = greatest(stock - $2, 0) where id = $1', [
        item.productId,
        item.qty,
      ])
    }

    return mapOrder(saved, await loadItems(saved.id, client))
  })

export const listOrders = async ({ userId, status }) => {
  const clauses = []
  const values = []

  if (userId) {
    values.push(userId)
    clauses.push(`user_id = $${values.length}`)
  }
  if (status) {
    values.push(status)
    clauses.push(`status = $${values.length}`)
  }

  const where = clauses.length ? `where ${clauses.join(' and ')}` : ''
  const result = await query(`select * from orders ${where} order by created_at desc`, values)
  return Promise.all(
    result.rows.map(async (row) => mapOrder(row, await loadItems(row.id))),
  )
}

export const findOrder = async (id) => {
  const row = await one('select * from orders where id = $1', [id])
  if (!row) return null
  return mapOrder(row, await loadItems(row.id))
}

export const updateOrderStatus = async (id, status) => {
  const row = await one(
    `update orders set status = $2, updated_at = now() where id = $1 returning *`,
    [id, status],
  )
  if (!row) return null
  return mapOrder(row, await loadItems(row.id))
}

export const orderMetrics = async () => {
  const row = await one(`
    select
      count(*)::int as total,
      count(*) filter (where status = 'pendiente')::int as pending,
      count(*) filter (where status = 'entregado')::int as delivered,
      count(distinct user_id)::int as customers,
      coalesce(sum(total) filter (where status <> 'pendiente'), 0) as revenue
    from orders
  `)
  return {
    total: row.total,
    pending: row.pending,
    delivered: row.delivered,
    customers: row.customers,
    revenue: Number(row.revenue),
  }
}

export const insertRawOrder = async (order, items) =>
  withTransaction(async (client) => {
    const { rows: inserted } = await client.query(
      `insert into orders
         (id, code, user_id, user_name, user_email, subtotal, shipping, total, status,
          address, notes, payment_method, date, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       returning *`,
      [
        order.id,
        order.code || orderCode(),
        order.userId,
        order.userName,
        order.userEmail,
        order.subtotal,
        order.shipping,
        order.total,
        order.status,
        order.address || null,
        order.notes || null,
        order.paymentMethod || null,
        order.date,
        order.createdAt,
        order.updatedAt || order.createdAt,
      ],
    )
    const saved = inserted[0]

    for (const item of items) {
      const product = await client.query('select id from products where id = $1', [item.productId])
      await client.query(
        `insert into order_items (order_id, product_id, slug, name, brand, image, price, qty)
         values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          saved.id,
          product.rows[0]?.id ?? null,
          item.slug,
          item.name,
          item.brand,
          item.image,
          item.price,
          item.qty,
        ],
      )
    }

    return saved
  })
