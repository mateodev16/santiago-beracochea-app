import { useEffect, useMemo, useState } from 'react'
import {
  ApiError,
  bootstrap,
  deleteProduct,
  updateStock,
  useProducts,
  useStatus,
} from '../../lib/store'
import { formatPrice, type Product } from '../../data/products'
import AdminProductForm from './AdminProductForm'

export default function AdminProductTable() {
  const products = useProducts()
  const status = useStatus()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Product | null>(null)
  const [creating, setCreating] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    void bootstrap()
  }, [])

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase()
    const filtered = term
      ? products.filter(
          (product) =>
            product.name.toLowerCase().includes(term) ||
            product.brand.toLowerCase().includes(term) ||
            product.category.toLowerCase().includes(term),
        )
      : products
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name, 'es'))
  }, [products, query])

  const stats = useMemo(
    () => ({
      total: products.length,
      stock: products.reduce((acc, p) => acc + p.stock, 0),
      outOfStock: products.filter((p) => p.stock <= 0).length,
      inventory: products.reduce((acc, p) => acc + p.price * p.stock, 0),
    }),
    [products],
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Productos', value: String(stats.total) },
          { label: 'Unidades en stock', value: String(stats.stock) },
          { label: 'Sin stock', value: String(stats.outOfStock) },
          { label: 'Valor de inventario', value: formatPrice(stats.inventory) },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-semibold tracking-wide text-sb-muted uppercase">
              {card.label}
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-sb-blue-deeper">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>
      )}

      {creating || editing ? (
        <AdminProductForm
          product={editing}
          onDone={() => {
            setCreating(false)
            setEditing(null)
          }}
        />
      ) : null}

      {status.products === 'loading' && (
        <p className="text-sm text-sb-muted">Sincronizando catálogo con el servidor...</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre, marca o categoría"
          className="w-full max-w-sm rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sb-blue"
        />
        <button
          type="button"
          onClick={() => {
            setCreating(true)
            setEditing(null)
            setError('')
          }}
          className="rounded-xl bg-sb-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sb-blue-dark"
        >
          Nuevo producto
        </button>
        <span className="ml-auto text-sm text-sb-muted">
          {rows.length} de {products.length} productos
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/70 text-xs tracking-wide text-sb-muted uppercase">
            <tr>
              <th className="px-5 py-3 font-semibold">Producto</th>
              <th className="px-5 py-3 font-semibold">Categoría</th>
              <th className="px-5 py-3 font-semibold">Precio</th>
              <th className="px-5 py-3 font-semibold">Stock</th>
              <th className="px-5 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((product) => (
              <tr key={product.id} className="transition hover:bg-sb-cream/50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-12 w-12 rounded-lg bg-sb-cream object-contain p-1"
                    />
                    <div>
                      <p className="font-semibold text-sb-blue-deeper">{product.name}</p>
                      <p className="text-xs text-sb-muted">
                        {product.brand} · {product.unit}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-sb-muted">{product.category}</td>
                <td className="px-5 py-3 font-semibold text-sb-blue-deeper">
                  {formatPrice(product.price)}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={product.stock}
                      onChange={(event) => {
                        const next = Math.max(Number(event.target.value) || 0, 0)
                        updateStock(product.id, next).catch((err) =>
                          setError(err instanceof ApiError ? err.message : 'No pudimos actualizar el stock'),
                        )
                      }}
                      className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-sm outline-none focus:border-sb-blue"
                    />
                    {product.stock <= 0 && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                        Agotado
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <a
                      href={`/producto/${product.slug}`}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-sb-muted transition hover:border-sb-blue hover:text-sb-blue"
                    >
                      Ver
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(product)
                        setCreating(false)
                      }}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-sb-muted transition hover:border-sb-blue hover:text-sb-blue"
                    >
                      Editar
                    </button>
                    {confirmId === product.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            deleteProduct(product.id)
                              .then(() => setConfirmId(null))
                              .catch((err) =>
                                setError(
                                  err instanceof ApiError ? err.message : 'No pudimos eliminar el producto',
                                ),
                              )
                          }}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          className="rounded-lg px-2 py-1.5 text-xs font-semibold text-sb-muted"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmId(product.id)}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sb-muted">
                  No hay productos que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}