const toNumber = (value) => (value === null || value === undefined ? 0 : Number(value))

const toIso = (value) => (value instanceof Date ? value.toISOString() : value)

export const mapUser = (row) =>
  row && {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    phone: row.phone ?? '',
    city: row.city ?? '',
    address: row.address ?? '',
    createdAt: toIso(row.created_at),
  }

export const mapProduct = (row) =>
  row && {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    category: row.category,
    description: row.description ?? '',
    price: toNumber(row.price),
    unit: row.unit ?? '',
    image: row.image ?? '',
    badge: row.badge ?? undefined,
    stock: row.stock ?? 0,
    active: row.active,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  }

export const mapOrderItem = (row) => ({
  productId: row.product_id,
  slug: row.slug,
  name: row.name,
  brand: row.brand,
  image: row.image,
  price: toNumber(row.price),
  qty: row.qty,
})

export const mapOrder = (row, items) => ({
  id: row.id,
  code: row.code,
  userId: row.user_id,
  userName: row.user_name,
  userEmail: row.user_email,
  items: (items ?? []).map(mapOrderItem),
  subtotal: toNumber(row.subtotal),
  shipping: toNumber(row.shipping),
  total: toNumber(row.total),
  status: row.status,
  address: row.address ?? '',
  notes: row.notes ?? '',
  paymentMethod: row.payment_method ?? '',
  date: row.date,
  createdAt: toIso(row.created_at),
  updatedAt: toIso(row.updated_at),
})
