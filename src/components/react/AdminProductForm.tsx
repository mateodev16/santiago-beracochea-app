import { useState } from 'react'
import { ApiError, createProduct, saveProduct, useProducts } from '../../lib/store'
import { CATEGORIES, type Product } from '../../data/products'

interface Props {
  product?: Product | null
  onDone?: () => void
}

const IMAGE_OPTIONS = [
  '/images/products/fleischmann.png',
  '/images/products/adria.png',
  '/images/products/prix.png',
  '/images/products/sucralight.png',
  '/images/products/prime.png',
  'https://placehold.co/600x600/E5E7EB/1A2480?text=Imagen+URL',
]

const inputClass =
  'w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sb-blue'
const labelClass = 'mb-1.5 block text-xs font-semibold text-sb-muted'

type FormState = {
  name: string
  brand: string
  category: string
  description: string
  price: string
  unit: string
  stock: string
  image: string
  badge: string
}

const toForm = (product?: Product | null): FormState => ({
  name: product?.name ?? '',
  brand: product?.brand ?? '',
  category: product?.category ?? CATEGORIES[0],
  description: product?.description ?? '',
  price: product ? String(product.price) : '',
  unit: product?.unit ?? '',
  stock: product ? String(product.stock) : '',
  image: product?.image ?? IMAGE_OPTIONS[0],
  badge: product?.badge ?? '',
})

export default function AdminProductForm({ product = null, onDone }: Props) {
  const products = useProducts()
  const [form, setForm] = useState<FormState>(toForm(product))
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const categories = [...new Set([...CATEGORIES, ...products.map((p) => p.category)])]

  const update = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const submit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const price = Number(form.price)
    const stock = Number(form.stock)

    if (!form.name.trim() || !form.brand.trim()) {
      setError('El nombre y la marca son obligatorios.')
      return
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError('El precio debe ser un número mayor a 0.')
      return
    }
    if (!Number.isFinite(stock) || stock < 0) {
      setError('El stock debe ser 0 o mayor.')
      return
    }

    const payload = {
      name: form.name.trim(),
      brand: form.brand.trim(),
      category: form.category,
      description: form.description.trim(),
      price,
      unit: form.unit.trim() || 'unidad',
      stock,
      image: form.image,
      badge: form.badge.trim() || undefined,
    }

    setSaving(true)
    try {
      if (product) {
        await saveProduct(product.id, payload)
      } else {
        await createProduct(payload)
        setForm(toForm())
      }
      setSaved(true)
      onDone?.()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos guardar el producto')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-sb-blue-deeper">
          {product ? `Editar: ${product.name}` : 'Nuevo producto'}
        </h2>
        {product && onDone && (
          <button
            type="button"
            onClick={onDone}
            className="text-sm font-semibold text-sb-muted hover:text-sb-blue"
          >
            Cerrar
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="product-name">
            Nombre
          </label>
          <input
            id="product-name"
            className={inputClass}
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
            placeholder="Levadura Instantánea"
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="product-brand">
            Marca
          </label>
          <input
            id="product-brand"
            className={inputClass}
            value={form.brand}
            onChange={(event) => update('brand', event.target.value)}
            placeholder="Fleischmann"
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="product-category">
            Categoría
          </label>
          <select
            id="product-category"
            className={inputClass}
            value={form.category}
            onChange={(event) => update('category', event.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="product-price">
            Precio (UYU)
          </label>
          <input
            id="product-price"
            type="number"
            min={0}
            className={inputClass}
            value={form.price}
            onChange={(event) => update('price', event.target.value)}
            placeholder="150"
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="product-unit">
            Presentación
          </label>
          <input
            id="product-unit"
            className={inputClass}
            value={form.unit}
            onChange={(event) => update('unit', event.target.value)}
            placeholder="500 g"
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="product-stock">
            Stock
          </label>
          <input
            id="product-stock"
            type="number"
            min={0}
            className={inputClass}
            value={form.stock}
            onChange={(event) => update('stock', event.target.value)}
            placeholder="50"
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="product-badge">
            Badge (opcional)
          </label>
          <select
            id="product-badge"
            className={inputClass}
            value={form.badge}
            onChange={(event) => update('badge', event.target.value)}
          >
            <option value="">Sin badge</option>
            <option value="Destacado">Destacado</option>
            <option value="Nuevo">Nuevo</option>
            <option value="Top ventas">Top ventas</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="product-image">
            Imagen
          </label>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <img
                src={form.image}
                alt="Vista previa"
                className="h-20 w-20 rounded-xl bg-sb-cream object-contain p-2"
                onError={(event) => {
                  const target = event.currentTarget as HTMLImageElement
                  if (!target.dataset.fallback) {
                    target.dataset.fallback = 'true'
                    target.src = '/images/products/prix.png'
                  }
                }}
              />
              <div className="flex w-full flex-col gap-2">
                <select
                  id="product-image"
                  className={inputClass}
                  value={IMAGE_OPTIONS.includes(form.image) ? form.image : ''}
                  onChange={(event) => update('image', event.target.value)}
                >
                  <option value="">URL personalizada</option>
                  {IMAGE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option.split('/').pop()}
                    </option>
                  ))}
                </select>
                <input
                  className={inputClass}
                  placeholder="https://... o /images/products/..."
                  value={IMAGE_OPTIONS.includes(form.image) ? '' : form.image}
                  onChange={(event) => update('image', event.target.value)}
                />
              </div>
            </div>
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="product-description">
            Descripción
          </label>
          <textarea
            id="product-description"
            rows={3}
            className={inputClass}
            value={form.description}
            onChange={(event) => update('description', event.target.value)}
            placeholder="Detalle del producto, contenido, presentaciones..."
          />
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
      {saved && (
        <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Producto guardado correctamente.
        </p>
      )}

      <div className="mt-5 flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-sb-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sb-blue-dark disabled:bg-slate-300"
        >
          {saving
            ? 'Guardando...'
            : product
              ? 'Guardar cambios'
              : 'Crear producto'}
        </button>
        {product && onDone && (
          <button
            type="button"
            onClick={onDone}
            className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-semibold text-sb-muted transition hover:border-sb-blue hover:text-sb-blue"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}