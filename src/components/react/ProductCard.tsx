import { useState } from 'react'
import { addToCart, useCart } from '../../lib/store'
import { formatPrice, type Product } from '../../data/products'
import QuantitySelector from './QuantitySelector'

interface Props {
  product: Product
}

const BADGE_STYLES: Record<string, string> = {
  Destacado: 'bg-sb-blue text-white',
  Nuevo: 'bg-sb-gold text-sb-blue-deeper',
  'Top ventas': 'bg-emerald-600 text-white',
}

export default function ProductCard({ product }: Props) {
  const lines = useCart()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const inCart = lines.find((line) => line.productId === product.id)?.qty ?? 0
  const soldOut = product.stock <= 0

  const handleAdd = () => {
    addToCart(product, qty)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1500)
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <a href={`/producto/${product.slug}`} className="relative block aspect-square bg-sb-cream">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-contain p-6 transition duration-500 group-hover:scale-105"
        />
        {product.badge && (
          <span
            className={`absolute top-3 left-3 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide uppercase ${
              BADGE_STYLES[product.badge] ?? 'bg-slate-800 text-white'
            }`}
          >
            {product.badge}
          </span>
        )}
        {soldOut && (
          <span className="absolute inset-x-0 bottom-0 bg-slate-900/80 py-1.5 text-center text-xs font-semibold tracking-wide text-white uppercase">
            Sin stock
          </span>
        )}
      </a>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-sb-blue uppercase">
            {product.brand}
          </p>
          <h3 className="font-display text-lg leading-tight font-bold text-sb-blue-deeper">
            <a href={`/producto/${product.slug}`} className="hover:text-sb-blue">
              {product.name}
            </a>
          </h3>
        </div>

        <p className="line-clamp-2 text-sm text-sb-muted">{product.description}</p>

        <div className="mt-auto flex items-end justify-between gap-2">
          <div>
            <p className="font-display text-2xl font-bold text-sb-blue-deeper">
              {formatPrice(product.price)}
            </p>
            <p className="text-xs text-sb-muted">por {product.unit}</p>
          </div>
          <p className="text-right text-xs text-sb-muted">
            {product.category}
            <br />
            {product.stock} disp.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <QuantitySelector value={qty} onChange={setQty} size="sm" />
          <button
            type="button"
            onClick={handleAdd}
            disabled={soldOut}
            className="flex-1 rounded-xl bg-sb-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-sb-blue-dark disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {added ? 'Agregado' : 'Agregar'}
          </button>
        </div>

        {inCart > 0 && (
          <p className="text-xs font-medium text-emerald-600">
            {inCart} en el carrito
          </p>
        )}
      </div>
    </article>
  )
}