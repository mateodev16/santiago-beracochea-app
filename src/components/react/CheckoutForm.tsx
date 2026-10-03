import { useEffect, useState } from 'react'
import {
  ApiError,
  cartTotal,
  placeOrder,
  useCart,
  useSession,
} from '../../lib/store'
import { useLoginHref } from '../../lib/useLocationState'
import { formatPrice } from '../../data/products'
import type { Order } from '../../lib/types'
import ShoppingCart from './ShoppingCart'

const SHIPPING_COST = 150

const PAYMENT_METHODS = [
  { id: 'transferencia', label: 'Transferencia bancaria' },
  { id: 'efectivo', label: 'Efectivo contra entrega' },
  { id: 'credito', label: 'Tarjeta de crédito' },
]

const inputClass =
  'w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sb-blue'

const labelClass = 'mb-1.5 block text-xs font-semibold text-sb-muted'

export default function CheckoutForm() {
  const lines = useCart()
  const user = useSession()
  // Los hooks se ejecutan siempre y arriba de los returns: llamarlos dentro de
  // una rama cambia el orden entre renders y React desmonta la isla.
  const loginHref = useLoginHref()
  const [placed, setPlaced] = useState<Order | null>(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    phone: '',
    address: '',
    city: '',
    paymentMethod: 'transferencia',
    notes: '',
  })

  // La sesión llega por API después del primer render, así que el inicializador
  // de useState nunca vio al usuario. Sin esto los campos quedan vacíos.
  useEffect(() => {
    if (!user) return
    setForm((prev) => ({
      ...prev,
      phone: user.phone ?? '',
      address: user.address ?? '',
      city: user.city ?? '',
    }))
  }, [user])

  const subtotal = cartTotal(lines)
  const shipping = lines.length === 0 ? 0 : subtotal >= 800 ? 0 : SHIPPING_COST
  const total = subtotal + shipping

  const update = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  if (placed) {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-8 text-center">
        <p className="text-4xl">✓</p>
        <h2 className="mt-4 font-display text-2xl font-bold text-sb-blue-deeper">
          ¡Pedido confirmado!
        </h2>
        <p className="mt-2 text-sm text-sb-muted">
          Tu pedido <span className="font-semibold text-sb-blue">{placed.code}</span> por{' '}
          {formatPrice(placed.total)} fue registrado. Te contactamos para coordinar la entrega.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a
            href="/pedidos"
            className="rounded-xl bg-sb-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sb-blue-dark"
          >
            Ver mis pedidos
          </a>
          <a
            href="/catalogo"
            className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-semibold text-sb-blue-deeper transition hover:border-sb-blue"
          >
            Seguir comprando
          </a>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
        <h2 className="font-display text-xl font-bold text-sb-blue-deeper">
          Necesitás una cuenta para confirmar
        </h2>
        <p className="mt-2 text-sm text-sb-muted">
          Iniciá sesión o creá tu cuenta para ver el resumen y finalizar el pedido.
        </p>
        <div className="mt-6 flex justify-center gap-3">
<a
            href={loginHref}
            className="rounded-xl bg-sb-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sb-blue-dark"
          >
            Iniciar sesión
          </a>
          <a
            href="/registro"
            className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-semibold text-sb-blue-deeper transition hover:border-sb-blue"
          >
            Crear cuenta
          </a>
        </div>
      </div>
    )
  }

  if (lines.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
        <h2 className="font-display text-xl font-bold text-sb-blue-deeper">
          No hay productos en el carrito
        </h2>
        <p className="mt-2 text-sm text-sb-muted">
          Elegí productos del catálogo para poder completar tu pedido.
        </p>
        <a
          href="/catalogo"
          className="mt-6 inline-block rounded-xl bg-sb-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sb-blue-dark"
        >
          Ir al catálogo
        </a>
      </div>
    )
  }

  const submit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!form.phone.trim() || !form.address.trim() || !form.city.trim()) {
      setError('Completá teléfono, dirección y ciudad para coordinar la entrega.')
      return
    }

    setSubmitting(true)
    try {
      const order = await placeOrder({
        lines,
        address: `${form.address}, ${form.city}`,
        paymentMethod: form.paymentMethod,
        notes: form.notes,
      })
      setPlaced(order)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos registrar el pedido')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <form onSubmit={submit} className="flex flex-col gap-6">
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold text-sb-blue-deeper">
            1. Datos de contacto
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="checkout-name">
                Nombre
              </label>
              <input id="checkout-name" className={`${inputClass} bg-slate-50`} value={user.name} readOnly />
            </div>
            <div>
              <label className={labelClass} htmlFor="checkout-phone">
                Teléfono
              </label>
              <input
                id="checkout-phone"
                className={inputClass}
                value={form.phone}
                onChange={(event) => update('phone', event.target.value)}
                placeholder="099 123 456"
                required
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold text-sb-blue-deeper">2. Entrega</h2>
          <div className="mt-4 grid gap-4">
            <div>
              <label className={labelClass} htmlFor="checkout-address">
                Dirección
              </label>
              <input
                id="checkout-address"
                className={inputClass}
                value={form.address}
                onChange={(event) => update('address', event.target.value)}
                placeholder="Calle, número, apto"
                required
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="checkout-city">
                Ciudad o barrio
              </label>
              <input
                id="checkout-city"
                className={inputClass}
                value={form.city}
                onChange={(event) => update('city', event.target.value)}
                placeholder="Montevideo"
                required
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="checkout-notes">
                Notas para el pedido (opcional)
              </label>
              <textarea
                id="checkout-notes"
                rows={3}
                className={inputClass}
                value={form.notes}
                onChange={(event) => update('notes', event.target.value)}
                placeholder="Horario de entrega, referencias, etc."
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold text-sb-blue-deeper">3. Pago</h2>
          <div className="mt-4 flex flex-col gap-3">
            {PAYMENT_METHODS.map((method) => (
              <label
                key={method.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm transition ${
                  form.paymentMethod === method.id
                    ? 'border-sb-blue bg-sb-cream text-sb-blue-deeper'
                    : 'border-slate-200 text-sb-muted hover:border-sb-blue'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  className="accent-sb-blue"
                  checked={form.paymentMethod === method.id}
                  onChange={() => update('paymentMethod', method.id)}
                />
                {method.label}
              </label>
            ))}
          </div>
        </section>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-sb-blue py-3.5 text-sm font-semibold text-white transition hover:bg-sb-blue-dark disabled:bg-slate-300"
        >
          {submitting ? 'Registrando pedido...' : `Confirmar pedido · ${formatPrice(total)}`}
        </button>
      </form>

      <div className="flex flex-col gap-4">
        <ShoppingCart variant="panel" />
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex justify-between text-sm text-sb-muted">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm text-sb-muted">
            <span>Envío</span>
            <span>{shipping === 0 ? 'Gratis' : formatPrice(shipping)}</span>
          </div>
          <div className="mt-4 flex justify-between border-t border-slate-100 pt-4 font-display text-xl font-bold text-sb-blue-deeper">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}