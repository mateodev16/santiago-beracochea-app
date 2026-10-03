import { useEffect, useMemo, useState } from 'react'
import { bootstrap, orderTotal, STATUS_STYLES, useOrders, useSession, useStatus } from '../../lib/store'
import { useLoginHref } from '../../lib/useLocationState'
import { formatPrice } from '../../data/products'
import type { Order, OrderStatus } from '../../lib/types'

interface Props {
  userId?: string
  showStatusFilter?: boolean
}

const STATUSES: OrderStatus[] = ['pendiente', 'confirmado', 'entregado']

export default function OrderHistory({ userId, showStatusFilter = true }: Props) {
const session = useSession()
  const allOrders = useOrders()
  const status = useStatus()
  // Los hooks se ejecutan siempre y arriba de los returns: llamarlos dentro de
  // una rama cambia el orden entre renders y React desmonta la isla.
  const loginHref = useLoginHref()
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'todas'>('todas')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    void bootstrap()
  }, [])

  const targetId = userId ?? session?.id

  const orders = useMemo(() => {
    if (!targetId) return []
    const mine = allOrders
      .filter((order) => order.userId === targetId)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
    return statusFilter === 'todas' ? mine : mine.filter((order) => order.status === statusFilter)
  }, [allOrders, targetId, statusFilter])

  if (!session) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
        <h2 className="font-display text-xl font-bold text-sb-blue-deeper">
          Iniciá sesión para ver tus pedidos
        </h2>
        <p className="mt-2 text-sm text-sb-muted">
          Tu historial de pedidos queda guardado en tu cuenta de Santiago Beracochea.
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

  return (
    <div className="flex flex-col gap-6">
      {showStatusFilter && (
        <div className="flex flex-wrap gap-2">
          {(['todas', ...STATUSES] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setStatusFilter(option)}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold capitalize transition ${
                statusFilter === option
                  ? 'border-sb-blue bg-sb-blue text-white'
                  : 'border-slate-200 text-sb-muted hover:border-sb-blue hover:text-sb-blue'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {status.orders === 'loading' && (
        <p className="text-sm text-sb-muted">Cargando tu historial...</p>
      )}

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <p className="font-display text-lg font-bold text-sb-blue-deeper">
            Todavía no tenés pedidos
          </p>
          <p className="mt-2 text-sm text-sb-muted">
            Cuando confirmes tu primera compra vas a ver el detalle acá.
          </p>
          <a
            href="/catalogo"
            className="mt-6 inline-block rounded-xl bg-sb-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sb-blue-dark"
          >
            Ver catálogo
          </a>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {orders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              expanded={expanded === order.id}
              onToggle={() => setExpanded(expanded === order.id ? null : order.id)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function OrderRow({
  order,
  expanded,
  onToggle,
}: {
  order: Order
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <li className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full flex-wrap items-center gap-4 px-6 py-4 text-left transition hover:bg-sb-cream"
      >
        <span className="font-display text-base font-bold text-sb-blue-deeper">{order.code}</span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[order.status]}`}
        >
          {order.status}
        </span>
        <span className="text-xs text-sb-muted">{order.date}</span>
        <span className="ml-auto text-xs text-sb-muted">
          {order.items.length} producto{order.items.length === 1 ? '' : 's'}
        </span>
        <span className="font-display text-base font-bold text-sb-blue">
          {formatPrice(order.total)}
        </span>
        <span className="text-sb-muted">{expanded ? '−' : '+'}</span>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-5">
          <ul className="flex flex-col gap-3">
            {order.items.map((item) => (
              <li key={item.productId} className="flex items-center gap-3 text-sm">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-sb-cream text-xs font-bold text-sb-blue">
                  {item.qty}
                </span>
                <span className="text-sb-muted">{item.brand}</span>
                <span className="font-semibold text-sb-blue-deeper">{item.name}</span>
                <span className="ml-auto font-semibold text-sb-blue-deeper">
                  {formatPrice(item.price * item.qty)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold tracking-wide text-sb-muted uppercase">
                Entrega
              </dt>
              <dd className="mt-1 text-sb-blue-deeper">{order.address}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-wide text-sb-muted uppercase">Pago</dt>
              <dd className="mt-1 text-sb-blue-deeper">{order.paymentMethod}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-wide text-sb-muted uppercase">
                Notas
              </dt>
              <dd className="mt-1 text-sb-blue-deeper">{order.notes || '—'}</dd>
            </div>
          </dl>

          <p className="mt-4 text-right font-display text-lg font-bold text-sb-blue-deeper">
            Total {formatPrice(orderTotal(order))}
          </p>
        </div>
      )}
    </li>
  )
}