import { useEffect, useState } from 'react'
import { cartCount, cartTotal, clearCart, removeFromCart, setQty, useCart, useSession } from '../../lib/store'
import { loginHref } from '../../lib/auth'
import { formatPrice } from '../../data/products'
import QuantitySelector from './QuantitySelector'

export const FREE_SHIPPING_THRESHOLD = 800

interface Props {
  variant?: 'drawer' | 'panel'
  open?: boolean
  onClose?: () => void
}

export default function ShoppingCart({ variant = 'drawer', open = false, onClose }: Props) {
  const lines = useCart()
  const session = useSession()
  const [visible, setVisible] = useState(open)

  useEffect(() => setVisible(open), [open])

  const count = cartCount(lines)
  const total = cartTotal(lines)
  const missing = Math.max(FREE_SHIPPING_THRESHOLD - total, 0)
  const progress = Math.min((total / FREE_SHIPPING_THRESHOLD) * 100, 100)

  const close = () => {
    setVisible(false)
    onClose?.()
  }

  const body = (
    <div className="flex flex-col gap-6">
      <div>
        <div className="mb-2 flex items-center justify-between text-xs font-semibold text-sb-muted">
          <span>
            {missing > 0
              ? `Te faltan ${formatPrice(missing)} para envío gratis`
              : 'Tenés envío gratis'}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-sb-gold transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {lines.length === 0 ? (
        <div className="py-10 text-center">
          <p className="font-display text-lg font-bold text-sb-blue-deeper">
            Tu carrito está vacío
          </p>
          <p className="mt-2 text-sm text-sb-muted">
            Agregá productos del catálogo para empezar tu pedido.
          </p>
          <a
            href="/catalogo"
            onClick={close}
            className="mt-6 inline-block rounded-xl bg-sb-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sb-blue-dark"
          >
            Ver catálogo
          </a>
        </div>
      ) : (
        <>
          <ul className="flex flex-col divide-y divide-slate-100">
            {lines.map((line) => (
              <li key={line.productId} className="flex gap-4 py-4">
                <a href={`/producto/${line.slug}`} onClick={close} className="shrink-0">
                  <img
                    src={line.image}
                    alt={line.name}
                    className="h-20 w-20 rounded-xl bg-sb-cream object-contain p-2"
                  />
                </a>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="text-[11px] font-semibold tracking-[0.15em] text-sb-blue uppercase">
                    {line.brand}
                  </p>
                  <a
                    href={`/producto/${line.slug}`}
                    onClick={close}
                    className="truncate font-display text-sm font-bold text-sb-blue-deeper hover:text-sb-blue"
                  >
                    {line.name}
                  </a>
                  <p className="text-xs text-sb-muted">
                    {formatPrice(line.price)} · {line.unit}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <QuantitySelector
                      value={line.qty}
                      onChange={(next) => setQty(line.productId, next)}
                      size="sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeFromCart(line.productId)}
                      className="text-xs font-semibold text-red-500 hover:underline"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
                <p className="shrink-0 font-display text-sm font-bold text-sb-blue-deeper">
                  {formatPrice(line.price * line.qty)}
                </p>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between text-sm text-sb-muted">
              <span>Productos ({count})</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-sb-muted">
              <span>Envío</span>
              <span>{missing > 0 ? 'A calcular' : 'Gratis'}</span>
            </div>
            <div className="flex items-center justify-between font-display text-xl font-bold text-sb-blue-deeper">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>

            <div className="flex flex-col gap-2">
              <a
                href={session ? '/checkout' : loginHref('/checkout')}
                onClick={() => session && close()}
                className="rounded-xl bg-sb-blue px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-sb-blue-dark"
              >
                {session ? 'Finalizar compra' : 'Iniciar sesión para comprar'}
              </a>
              <button
                type="button"
                onClick={clearCart}
                className="text-xs font-semibold text-sb-muted hover:text-red-500"
              >
                Vaciar carrito
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )

  if (variant === 'panel') {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">{body}</div>
    )
  }

  return (
    <>
      {visible && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Cerrar carrito"
            onClick={close}
            className="absolute inset-0 animate-fade-in bg-sb-blue-deeper/40"
          />
          <aside className="animate-fade-in relative flex h-full w-full max-w-md flex-col gap-4 bg-white p-6 shadow-2xl">
            <header className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-sb-blue-deeper">
                Tu carrito
                {count > 0 && (
                  <span className="ml-2 rounded-full bg-sb-gold px-2 py-0.5 text-xs font-semibold text-sb-blue-deeper">
                    {count}
                  </span>
                )}
              </h2>
              <button
                type="button"
                onClick={close}
                className="grid h-9 w-9 place-items-center rounded-lg text-sb-muted transition hover:bg-slate-100 hover:text-sb-blue-deeper"
              >
                ✕
              </button>
            </header>
            <div className="flex-1 overflow-y-auto">{body}</div>
          </aside>
        </div>
      )}
    </>
  )
}