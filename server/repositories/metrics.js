import { one, rows } from '../database.js'

const toNumber = (value) => (value === null || value === undefined ? 0 : Number(value))

export const getMetrics = async () => {
  const agg = await one(`
    select
      count(*)::int as total_orders,
      count(distinct user_id)::int as total_customers,
      coalesce(sum(total) filter (where status <> 'pendiente'), 0)::numeric as revenue_approved,
      coalesce(sum(total), 0)::numeric as revenue_total,
      count(*) filter (where status = 'pendiente')::int as pending,
      count(*) filter (where status = 'confirmado')::int as confirmed,
      count(*) filter (where status = 'entregado')::int as delivered,
      coalesce(sum(subtotal), 0)::numeric as subtotal_total,
      coalesce(sum(shipping), 0)::numeric as shipping_total
    from orders
  `)

  const mostSold = await one(`
    select
      p.id as product_id,
      coalesce(p.name, oi.name) as name,
      coalesce(p.brand, oi.brand) as brand,
      coalesce(p.slug, oi.slug) as slug,
      coalesce(p.image, oi.image) as image,
      coalesce(sum(oi.qty), 0)::int as total_qty,
      coalesce(sum(oi.qty * oi.price), 0)::numeric as total_revenue
    from order_items oi
    left join products p on p.id = oi.product_id
    where exists (select 1 from orders o where o.id = oi.order_id)
    group by p.id, oi.name, oi.brand, oi.slug, oi.image
    order by total_qty desc, total_revenue desc
    limit 1
  `)

  const topCustomer = await one(`
    select
      u.id as user_id,
      coalesce(o.user_name, u.name) as name,
      coalesce(o.user_email, u.email) as email,
      count(distinct o.id)::int as orders_count,
      coalesce(sum(o.total), 0)::numeric as total_spent
    from orders o
    left join users u on u.id = o.user_id
    group by u.id, o.user_name, o.user_email, u.name, u.email
    order by total_spent desc, orders_count desc
    limit 1
  `)

  const lowStock = await rows(`
    select
      id,
      name,
      brand,
      slug,
      category,
      price,
      unit,
      stock,
      active,
      image
    from products
    where stock <= 20
    order by stock asc, name asc
  `)

  const salesByMonth = await rows(`
    select
      to_char(date_trunc('month', o.created_at), 'YYYY-MM') as month,
      count(*)::int as orders_count,
      coalesce(sum(o.total), 0)::numeric as total_revenue
    from orders o
    group by date_trunc('month', o.created_at)
    order by date_trunc('month', o.created_at) asc
  `)

  const salesByYear = await rows(`
    select
      to_char(date_trunc('year', o.created_at), 'YYYY') as year,
      count(*)::int as orders_count,
      coalesce(sum(o.total), 0)::numeric as total_revenue
    from orders o
    group by date_trunc('year', o.created_at)
    order by date_trunc('year', o.created_at) asc
  `)

  const customerSpend = await rows(`
    select
      u.id as user_id,
      coalesce(max(o.user_name), u.name) as name,
      coalesce(max(o.user_email), u.email) as email,
      count(distinct o.id)::int as orders_count,
      coalesce(sum(o.total), 0)::numeric as total_spent
    from users u
    left join orders o on o.user_id = u.id
    group by u.id
    order by total_spent desc, orders_count desc, name asc
  `)

  return {
    totals: {
      orders: agg?.total_orders ?? 0,
      customers: agg?.total_customers ?? 0,
      pending: agg?.pending ?? 0,
      confirmed: agg?.confirmed ?? 0,
      delivered: agg?.delivered ?? 0,
      revenueApproved: toNumber(agg?.revenue_approved),
      revenueTotal: toNumber(agg?.revenue_total),
      subtotalTotal: toNumber(agg?.subtotal_total),
      shippingTotal: toNumber(agg?.shipping_total),
    },
    mostSoldProduct: mostSold
      ? {
          productId: mostSold.product_id,
          name: mostSold.name,
          brand: mostSold.brand,
          slug: mostSold.slug,
          image: mostSold.image,
          totalQty: mostSold.total_qty,
          totalRevenue: toNumber(mostSold.total_revenue),
        }
      : null,
    topCustomer: topCustomer
      ? {
          userId: topCustomer.user_id,
          name: topCustomer.name,
          email: topCustomer.email,
          ordersCount: topCustomer.orders_count,
          totalSpent: toNumber(topCustomer.total_spent),
        }
      : null,
    lowStock,
    salesByMonth: salesByMonth.map((s) => ({
      month: s.month,
      ordersCount: s.orders_count,
      totalRevenue: toNumber(s.total_revenue),
    })),
    salesByYear: salesByYear.map((s) => ({
      year: s.year,
      ordersCount: s.orders_count,
      totalRevenue: toNumber(s.total_revenue),
    })),
    customerSpend: customerSpend.map((c) => ({
      userId: c.user_id,
      name: c.name,
      email: c.email,
      ordersCount: c.orders_count,
      totalSpent: toNumber(c.total_spent),
    })),
  }
}
