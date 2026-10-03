import catalog from './catalog.json'

export interface Product {
  id: string
  slug: string
  name: string
  brand: string
  category: string
  description: string
  price: number
  unit: string
  image: string
  badge?: string
  stock: number
}

export const CATEGORIES = [
  'Panadería',
  'Pastas',
  'Dietética',
  'Limpieza',
  'Salud',
  'Bebidas',
  'Almacén',
] as const

export const PRODUCTS: Product[] = catalog as Product[]

export const getProductBySlug = (slug: string): Product | undefined =>
  PRODUCTS.find((p) => p.slug === slug)

export const formatPrice = (value: number): string =>
  new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)