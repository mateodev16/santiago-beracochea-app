export type UserRole = 'user' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  phone?: string
  address?: string
  city?: string
  createdAt?: string
}

export interface CartLine {
  productId: string
  slug: string
  name: string
  brand: string
  image: string
  price: number
  unit: string
  qty: number
}

export interface OrderItem {
  productId: string
  name: string
  brand: string
  qty: number
  price: number
}

export type OrderStatus = 'pendiente' | 'confirmado' | 'entregado'

export interface Order {
  id: string
  code: string
  userId: string
  userName: string
  userEmail: string
  items: OrderItem[]
  subtotal?: number
  shipping?: number
  total: number
  status: OrderStatus
  date: string
  address: string
  notes: string
  paymentMethod: string
  createdAt?: string
  updatedAt?: string
}

export interface AdminMetrics {
  totals: {
    orders: number
    customers: number
    pending: number
    confirmed: number
    delivered: number
    revenueApproved: number
    revenueTotal: number
    subtotalTotal: number
    shippingTotal: number
  }
  mostSoldProduct: {
    productId: string | null
    name: string
    brand: string
    slug: string
    image: string
    totalQty: number
    totalRevenue: number
  } | null
  topCustomer: {
    userId: string | null
    name: string
    email: string
    ordersCount: number
    totalSpent: number
  } | null
  lowStock: {
    id: string
    name: string
    brand: string
    slug: string
    category: string
    price: number
    unit: string
    stock: number
    active: boolean
    image: string
  }[]
  salesByMonth: { month: string; ordersCount: number; totalRevenue: number }[]
  salesByYear: { year: string; ordersCount: number; totalRevenue: number }[]
  customerSpend: {
    userId: string
    name: string
    email: string
    ordersCount: number
    totalSpent: number
  }[]
}

export const KEYS = {
  cart: 'sb_cart',
} as const