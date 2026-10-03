import bcrypt from 'bcryptjs'
import { config } from './config.js'
import { one } from './database.js'
import { findUserByEmail, insertUser } from './repositories/users.js'
import { countProductsTable, insertProduct } from './repositories/products.js'
import { readCatalog } from './utils/catalog.js'
import { uid } from './utils/ids.js'

export async function seedDatabase() {
  const products = await countProductsTable()
  if (products > 0) return { created: false, products }

  const catalog = readCatalog()
  let inserted = 0

  for (const item of catalog) {
    await insertProduct({
      id: item.id ?? uid(),
      slug: item.slug,
      name: item.name,
      brand: item.brand,
      category: item.category,
      description: item.description ?? '',
      price: item.price,
      unit: item.unit ?? '',
      image: item.image ?? '',
      badge: item.badge || null,
      stock: item.stock ?? 0,
      active: true,
      createdAt: item.createdAt ?? new Date().toISOString(),
    })
    inserted += 1
  }

  const admin = await findUserByEmail(config.adminEmail)
  if (!admin) {
    await insertUser({
      id: uid(),
      name: 'Administrador',
      email: config.adminEmail,
      passwordHash: bcrypt.hashSync(config.adminPassword, config.bcryptRounds),
      role: 'admin',
      phone: '099 123 456',
      city: 'Minas',
      address: 'Ituzaingo 668, Minas',
      createdAt: new Date().toISOString(),
    })
  }

  return { created: true, products: inserted }
}

export const tableReport = async () =>
  one(`
    select
      (select count(*)::int from users) as users,
      (select count(*)::int from products) as products,
      (select count(*)::int from orders) as orders,
      (select count(*)::int from order_items) as items
  `)
