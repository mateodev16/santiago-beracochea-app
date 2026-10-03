import { useSyncExternalStore } from 'react'
import { api, ApiError, clearToken, setToken } from './api'
import { KEYS } from './types'
import { PRODUCTS, type Product } from '../data/products'
import type { AdminMetrics, CartLine, Order, OrderStatus, User } from './types'

const isBrowser = typeof window !== 'undefined'

const read = <T,>(key: string, fallback: T): T => {
  if (!isBrowser) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

const write = (key: string, value: unknown) => {
  if (!isBrowser) return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable */
  }
}

const seedProducts = (): Product[] => PRODUCTS.map((product) => ({ ...product }))

export type LoadState = 'idle' | 'loading' | 'ready' | 'error'

export interface StatusState {
  products: LoadState
  session: LoadState
  orders: LoadState
  metrics: LoadState
}

function createStore<T>(key: string | null, initial: () => T) {
  let snapshot: T = initial()
  // React exige que getServerSnapshot devuelva un valor estable: si cambia entre
  // llamadas entra en loop. Este es el estado con el que se pintó el HTML del
  // servidor, así que la hidratación coincide y después React pasa a get().
  const serverSnapshot: T = initial()
  const listeners = new Set<() => void>()

  const emit = () => {
    if (key) write(key, snapshot)
    listeners.forEach((listener) => listener())
  }

  return {
    hydrate: () => {
      snapshot = key ? read<T>(key, initial()) : initial()
    },
    get: (): T => snapshot,
    serverGet: (): T => serverSnapshot,
    set: (next: T) => {
      snapshot = next
      emit()
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      if (isBrowser) window.addEventListener('storage', listener)
      return () => {
        listeners.delete(listener)
        if (isBrowser) window.removeEventListener('storage', listener)
      }
    },
  }
}

export const cartStore = createStore<CartLine[]>(KEYS.cart, () => [])
export const productsStore = createStore<Product[]>(null, seedProducts)
export const ordersStore = createStore<Order[]>(null, () => [])
export const sessionStore = createStore<User | null>(null, () => null)
export const metricsStore = createStore<AdminMetrics | null>(null, () => null)
export const metricsErrorStore = createStore<string | null>(null, () => null)
export const statusStore = createStore<StatusState>(null, () => ({
  products: 'idle',
  session: 'idle',
  orders: 'idle',
  metrics: 'idle',
}))

const patchStatus = (patch: Partial<StatusState>) =>
  statusStore.set({ ...statusStore.get(), ...patch })

function useStore<T>(store: ReturnType<typeof createStore<T>>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.serverGet)
}

export const useCart = () => useStore(cartStore)
export const useProducts = () => useStore(productsStore)
export const useOrders = () => useStore(ordersStore)
export const useSession = () => useStore(sessionStore)
export const useMetrics = () => useStore(metricsStore)
export const useMetricsError = () => useStore(metricsErrorStore)
export const useStatus = () => useStore(statusStore)

// ── Bootstrap ──────────────────────────────────────────────────────────────────

export async function refreshProducts() {
  patchStatus({ products: 'loading' })
  try {
    const { items } = await api.products.list({ limit: 60, sort: 'relevancia' })
    productsStore.set(items)
    patchStatus({ products: 'ready' })
  } catch {
    productsStore.set(seedProducts())
    patchStatus({ products: 'error' })
  }
}

export async function refreshSession() {
  patchStatus({ session: 'loading' })
  try {
    const { user } = await api.auth.me()
    sessionStore.set(user)
    patchStatus({ session: 'ready' })
  } catch {
    sessionStore.set(null)
    patchStatus({ session: 'ready' })
  }
}

export async function refreshOrders() {  if (!sessionStore.get()) {
    ordersStore.set([])
    patchStatus({ orders: 'ready' })
    return
  }
  patchStatus({ orders: 'loading' })
  try {
    const { items } = await api.orders.list()
    ordersStore.set(items)
    patchStatus({ orders: 'ready' })
  } catch {
    ordersStore.set([])
    patchStatus({ orders: 'error' })
  }
}

export async function refreshMetrics() {
  const user = sessionStore.get()
  if (!user || user.role !== 'admin') {
    metricsStore.set(null)
    metricsErrorStore.set(null)
    patchStatus({ metrics: 'ready' })
    return
  }
  patchStatus({ metrics: 'loading' })
  try {
    const { metrics } = await api.metrics.report()
    metricsStore.set(metrics)
    metricsErrorStore.set(null)
    patchStatus({ metrics: 'ready' })
  } catch (err) {
    metricsStore.set(null)
    metricsErrorStore.set(err instanceof ApiError ? err.message : 'No pudimos cargar las métricas')
    patchStatus({ metrics: 'error' })
  }
}

let bootstrapPromise: Promise<void> | null = null

export function bootstrap(): Promise<void> {
  if (!isBrowser) return Promise.resolve()
  if (!bootstrapPromise) {
    cartStore.hydrate()
    bootstrapPromise = Promise.all([refreshProducts(), refreshSession()]).then(refreshOrders)
  }
  return bootstrapPromise
}

// ── Cart (client side) ─────────────────────────────────────────────────────────

export const MAX_QTY = 99

export function addToCart(product: Product, qty = 1) {
  const lines = cartStore.get()
  const existing = lines.find((line) => line.productId === product.id)

  if (existing) {
    setQty(product.id, existing.qty + qty)
    return
  }

  cartStore.set([
    ...lines,
    {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      image: product.image,
      price: product.price,
      unit: product.unit,
      qty: Math.min(Math.max(qty, 1), MAX_QTY),
    },
  ])
}

export function setQty(productId: string, qty: number) {
  const safe = Math.min(Math.max(Math.floor(qty) || 1, 1), MAX_QTY)
  cartStore.set(
    cartStore.get().map((line) => (line.productId === productId ? { ...line, qty: safe } : line)),
  )
}

export const removeFromCart = (productId: string) =>
  cartStore.set(cartStore.get().filter((line) => line.productId !== productId))

export const clearCart = () => cartStore.set([])

export const cartCount = (lines: CartLine[]) => lines.reduce((acc, line) => acc + line.qty, 0)

export const cartTotal = (lines: CartLine[]) =>
  lines.reduce((acc, line) => acc + line.price * line.qty, 0)

// ── Auth ───────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<User> {
  const { token, user } = await api.auth.login({ email: email.trim(), password })
  setToken(token)
  sessionStore.set(user)
  patchStatus({ session: 'ready' })
  await Promise.all([refreshOrders(), refreshMetrics()])
  return user
}

export async function registerUser(payload: {
  name: string
  email: string
  password: string
  phone?: string
  city?: string
  address?: string
}): Promise<User> {
  const { token, user } = await api.auth.register(payload)
  setToken(token)
  sessionStore.set(user)
  patchStatus({ session: 'ready' })
  await Promise.all([refreshOrders(), refreshMetrics()])
  return user
}

export function logout() {
  clearToken()
  sessionStore.set(null)
  ordersStore.set([])
  metricsStore.set(null)
  metricsErrorStore.set(null)
  patchStatus({ orders: 'ready', metrics: 'ready' })
}

export async function updateProfile(patch: {
  name?: string
  phone?: string
  city?: string
  address?: string
}) {
  const { user } = await api.auth.updateMe(patch)
  sessionStore.set(user)
  return user
}

// ── Products (admin) ───────────────────────────────────────────────────────────

export async function createProduct(input: Partial<Product>): Promise<Product> {
  const { product } = await api.products.create(input)
  productsStore.set([product, ...productsStore.get()])
  return product
}

export async function saveProduct(id: string, input: Partial<Product>): Promise<Product> {
  const { product } = await api.products.update(id, input)
  productsStore.set(productsStore.get().map((item) => (item.id === id ? product : item)))
  return product
}

export async function deleteProduct(id: string) {
  await api.products.remove(id)
  productsStore.set(productsStore.get().filter((item) => item.id !== id))
  cartStore.set(cartStore.get().filter((line) => line.productId !== id))
}

export async function updateStock(id: string, stock: number) {
  const { product } = await api.products.update(id, { stock })
  productsStore.set(productsStore.get().map((item) => (item.id === id ? product : item)))
}

// ── Orders ─────────────────────────────────────────────────────────────────────

export async function placeOrder(params: {
  address: string
  notes: string
  paymentMethod: string
  lines: CartLine[]
}): Promise<Order> {
  const { order } = await api.orders.create({
    items: params.lines.map((line) => ({ productId: line.productId, qty: line.qty })),
    address: params.address,
    notes: params.notes,
    paymentMethod: params.paymentMethod,
  })

  clearCart()
  ordersStore.set([order, ...ordersStore.get()])
  await refreshProducts()
  return order
}

export async function changeOrderStatus(id: string, status: OrderStatus) {
  const { order } = await api.orders.setStatus(id, status)
  ordersStore.set(ordersStore.get().map((item) => (item.id === id ? order : item)))
  return order
}

export const orderTotal = (order: Order) =>
  order.items.reduce((acc, item) => acc + item.price * item.qty, 0)

export const STATUS_STYLES: Record<OrderStatus, string> = {
  pendiente: 'bg-amber-100 text-amber-700',
  confirmado: 'bg-sb-blue/10 text-sb-blue',
  entregado: 'bg-emerald-100 text-emerald-700',
}

export { ApiError }