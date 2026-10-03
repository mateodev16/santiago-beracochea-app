import { useState } from 'react'
import { api } from '../../lib/api'
import { ApiError, createProduct, saveProduct, useProducts } from '../../lib/store'
import { CATEGORIES, type Product } from '../../data/products'

interface Props {
  product?: Product | null
  onDone?: () => void
}

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
  image: product?.image ?? '',
  badge: product?.badge ?? '',
})

export default function AdminProductForm({ product = null, onDone }: Props) {
  const products = useProducts()
  const [form, setForm] = useState<FormState>(toForm(product))
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const categories = [...new Set([...CATEGORIES, ...products.map((p) => p.category)])]

  const update = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setError('')
    setUploading(true)
    try {
      const { image } = await api.images.upload(file)
      setForm((prev) => ({ ...prev, image: image.url }))
      setSaved(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos subir la imagen')
    } finally {
      setUploading(false)
    }
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
          <label className={labelClass} htmlFor="product-image-file">
            Imagen
          </label>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              {form.image ? (
                <img
                  src={form.image}
                  alt="Vista previa"
                  className="h-20 w-20 rounded-xl bg-sb-cream object-contain p-2"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-sb-cream text-center text-[10px] font-semibold text-sb-muted">
                  Sin imagen
                </div>
              )}
              <div className="flex w-full flex-col gap-2">
                <input
                  id="product-image-file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif"
                  disabled={uploading}
                  onChange={handleFile}
                  className="block w-full text-sm text-sb-muted disabled:opacity-60 file:mr-3 file:rounded-xl file:border-0 file:bg-sb-blue file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-sb-blue-deeper"
                />
                <input
                  className={inputClass}
                  placeholder="https://... o /images/products/..."
                  value={form.image}
                  onChange={(event) => update('image', event.target.value)}
                />
                <p className="text-xs text-sb-muted">
                  {uploading
                    ? 'Subiendo imagen...'
                    : 'Subí un archivo (PNG, JPEG, WebP o AVIF, hasta 2 MB) o pegá una URL.'}
                </p>
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