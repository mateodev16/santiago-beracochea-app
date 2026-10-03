import { one, query, rows, uniqueViolation } from '../database.js'
import { mapProduct } from '../mappers.js'
import { ApiError } from '../utils/errors.js'
import { slugify, uid } from '../utils/ids.js'

const ORDER_BY = {
  'precio-asc': 'price asc',
  'precio-desc': 'price desc',
  nombre: 'name asc',
  default: 'badge desc nulls last, name asc',
}

export const buildProductFilters = (queryParams) => {
  const clauses = ['active = true']
  const values = []

  const categories = String(queryParams.category ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
  if (categories.length) {
    values.push(categories)
    clauses.push(`lower(category) = any($${values.length})`)
  }

  const brands = String(queryParams.brand ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
  if (brands.length) {
    values.push(brands)
    clauses.push(`lower(brand) = any($${values.length})`)
  }

  if (queryParams.minPrice !== undefined) {
    values.push(queryParams.minPrice)
    clauses.push(`price >= $${values.length}`)
  }

  if (queryParams.maxPrice !== undefined) {
    values.push(queryParams.maxPrice)
    clauses.push(`price <= $${values.length}`)
  }

  if (queryParams.inStock) clauses.push('stock > 0')

  const search = String(queryParams.search ?? '').trim().toLowerCase()
  if (search) {
    values.push(`%${search}%`)
    clauses.push(
      `(name ilike $${values.length} or brand ilike $${values.length} or description ilike $${values.length})`,
    )
  }

  return { where: clauses.join(' and '), values }
}

export const countProducts = async (queryParams) => {
  const { where, values } = buildProductFilters(queryParams)
  const row = await one(`select count(*)::int as total from products where ${where}`, values)
  return row?.total ?? 0
}

export const listProducts = async (queryParams) => {
  const { where, values } = buildProductFilters(queryParams)
  const order = ORDER_BY[queryParams.sort] ?? ORDER_BY.default
  const limit = queryParams.limit ?? 50
  const offset = ((queryParams.page ?? 1) - 1) * limit

  const result = await rows(
    `select * from products where ${where} order by ${order} limit $${values.length + 1} offset $${values.length + 2}`,
    [...values, limit, offset],
  )
  return result.map(mapProduct)
}

export const listAllProducts = async () =>
  rows('select * from products order by created_at asc').then((result) => result.map(mapProduct))

export const listCategories = async () => {
  const result = await rows(
    `select category as name, count(*)::int as count
     from products where active = true
     group by category order by category asc`,
  )
  return result
}

export const findProduct = async (idOrSlug) =>
  mapProduct(await one('select * from products where id = $1 or slug = $1', [idOrSlug]))

export const insertProduct = async (input) => {
  const slug = slugify(input.slug ?? input.name)
  const product = {
    id: input.id ?? uid(),
    slug,
    name: input.name,
    brand: input.brand,
    category: input.category,
    description: input.description ?? '',
    price: input.price,
    unit: input.unit ?? '',
    image: input.image ?? '',
    badge: input.badge || null,
    stock: input.stock ?? 0,
    active: input.active ?? true,
    createdAt: input.createdAt ?? null,
  }

  try {
    const row = await one(
      `insert into products
         (id, slug, name, brand, category, description, price, unit, image, badge, stock, active, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, coalesce($13, now()), now())
       returning *`,
      [
        product.id,
        product.slug,
        product.name,
        product.brand,
        product.category,
        product.description,
        product.price,
        product.unit,
        product.image,
        product.badge,
        product.stock,
        product.active,
        product.createdAt,
      ],
    )
    return mapProduct(row)
  } catch (error) {
    if (uniqueViolation(error)) throw ApiError.conflict('Ya existe un producto con ese nombre')
    throw error
  }
}

export const updateProduct = async (id, input) => {
  const columns = {
    name: 'name',
    brand: 'brand',
    category: 'category',
    description: 'description',
    price: 'price',
    unit: 'unit',
    image: 'image',
    badge: 'badge',
    stock: 'stock',
    active: 'active',
  }

  const entries = Object.entries(input).filter(([key]) => key in columns)
  const sets = entries.map(([key], index) => `${columns[key]} = $${index + 1}`)
  const values = entries.map(([, value]) => (value === '' ? null : value))

  if (input.slug) {
    values.push(slugify(input.slug))
    sets.push(`slug = $${values.length}`)
  }
  sets.push('updated_at = now()')

  try {
    const row = await one(
      `update products set ${sets.join(', ')} where id = $${values.length + 1} returning *`,
      [...values, id],
    )
    if (!row) throw ApiError.notFound('Producto no encontrado')
    return mapProduct(row)
  } catch (error) {
    if (uniqueViolation(error)) throw ApiError.conflict('Ya existe un producto con ese nombre')
    throw error
  }
}

export const deleteProduct = async (id) => {
  const row = await one('delete from products where id = $1 returning *', [id])
  if (!row) throw ApiError.notFound('Producto no encontrado')
  return mapProduct(row)
}

export const countProductsTable = async () => {
  const row = await one('select count(*)::int as total from products')
  return row?.total ?? 0
}

export const decrementStock = async (client, productId, qty) => {
  const { rowCount } = await client.query(
    'update products set stock = greatest(stock - $2, 0), updated_at = now() where id = $1',
    [productId, qty],
  )
  return rowCount
}
