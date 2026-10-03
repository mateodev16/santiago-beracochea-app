import { useState } from 'react'
import { addToCart, useCart, useSession } from '../../lib/store'
import { formatPrice, type Product } from '../../data/products'
import QuantitySelector from './QuantitySelector'

interface Props {
  product: Product
}

export default function ProductPurchase({ product }: Props) {
  const lines = useCart()
  const user = useSession()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const inCart = lines.find((line) => line.productId === product.id)?.qty ?? 0
  const soldOut = product.stock <= 0

  const handleAdd = () => {
    addToCart(product, qty)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1800)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-3">
        <p className="font-display text-4xl font-bold text-sb-blue-deeper">
          {formatPrice(product.price)}
        </p>
        <p className="text-sm text-sb-muted">por {product.unit}</p>
      </div>

      <p className="text-sm text-sb-muted">
        {soldOut ? (
          <span className="font-semibold text-red-500">Sin stock por el momento</span>
        ) : (
          <>
            <span className="font-semibold text-emerald-600">{product.stock} unidades</span>{' '}
            disponibles para entrega inmediata
          </>
        )}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <QuantitySelector value={qty} onChange={setQty} max={Math.max(product.stock, 1)} />
        <button
          type="button"
          onClick={handleAdd}
          disabled={soldOut}
          className="flex-1 rounded-xl bg-sb-blue px-6 py-3 text-sm font-semibold text-white transition hover:bg-sb-blue-dark disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {added ? 'Agregado al carrito' : 'Agregar al carrito'}
        </button>
      </div>

      {inCart > 0 && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Ya tenés {inCart} de este producto en el carrito.{' '}
          <a href="/checkout" className="underline">
            Finalizar compra
          </a>
        </p>
      )}

      <a
        href="/checkout"
        className={`rounded-xl border border-sb-blue px-6 py-3 text-center text-sm font-semibold text-sb-blue transition ${
          soldOut ? 'pointer-events-none opacity-40' : 'hover:bg-sb-cream'
        }`}
      >
        Ir al checkout
      </a>

      {!user && (
        <p className="rounded-xl bg-sb-cream px-4 py-3 text-xs text-sb-muted">
          Podés agregar productos al carrito como invitado.{' '}
          <a href="/login" className="font-semibold text-sb-blue hover:underline">
            Iniciá sesión
          </a>{' '}
          para completar el pedido.
        </p>
      )}
    </div>
  )
}