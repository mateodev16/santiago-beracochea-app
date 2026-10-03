import { useEffect, useMemo, useState } from 'react'
import {
  ApiError,
  bootstrap,
  changeOrderStatus,
  orderTotal,
  refreshOrders,
  STATUS_STYLES,
  useOrders,
  useStatus,
} from '../../lib/store'
import { formatPrice } from '../../data/products'
import type { Order, OrderStatus } from '../../lib/types'

const STATUSES: OrderStatus[] = ['pendiente', 'confirmado', 'entregado']

const PAYMENT_LABELS: Record<string, string> = {
  transferencia: 'Transferencia',
  efectivo: 'Efectivo',
  credito: 'Tarjeta',
}

export default function AdminOrders() {
  const orders = useOrders()
  const status = useStatus()
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<OrderStatus | 'todas'>('todas')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    void bootstrap().then(() => refreshOrders())
  }, [])

  const sorted = useMemo(
    () =>
      [...orders].sort((a, b) =>
        String(b.createdAt ?? b.date).localeCompare(String(a.createdAt ?? a.date)),
      ),
    [orders],
  )

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return sorted.filter((order) => {
      const matchesStatus = filter === 'todas' || order.status === filter
      const matchesTerm =
        term.length === 0 ||
        order.code.toLowerCase().includes(term) ||
        order.userName.toLowerCase().includes(term) ||
        order.userEmail.toLowerCase().includes(term)
      return matchesStatus && matchesTerm
    })
  }, [sorted, filter, search])

  const stats = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter((order) => order.status === 'pendiente').length,
      delivered: orders.filter((order) => order.status === 'entregado').length,
      revenue: orders
        .filter((order) => order.status !== 'pendiente')
        .reduce((acc, order) => acc + orderTotal(order), 0),
      customers: new Set(orders.map((order) => order.userId)).size,
    }),
    [orders],
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Pedidos de clientes', value: String(stats.total) },
          { label: 'Pendientes', value: String(stats.pending) },
          { label: 'Entregados', value: String(stats.delivered) },
          { label: 'Facturado', value: formatPrice(stats.revenue) },
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

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por código, cliente o email"
          className="w-full max-w-sm rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sb-blue"
        />
        <div className="flex flex-wrap gap-2">
          {(['todas', ...STATUSES] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold capitalize transition ${
                filter === option
                  ? 'border-sb-blue bg-sb-blue text-white'
                  : 'border-slate-200 text-sb-muted hover:border-sb-blue hover:text-sb-blue'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <span className="ml-auto text-sm text-sb-muted">
          {visible.length} de {orders.length} pedidos · {stats.customers} clientes
        </span>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>
      )}

      {status.orders === 'loading' && (
        <p className="text-sm text-sb-muted">Cargando pedidos de clientes...</p>
      )}

      {status.orders === 'error' && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold">No pudimos cargar los pedidos desde el servidor.</p>
          <p className="mt-1">
            Revisá que la API esté corriendo en el puerto 3001 y que tu sesión sea de administrador.
          </p>
          <button
            type="button"
            onClick={() => void refreshOrders()}
            className="mt-2 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
          >
            Reintentar
          </button>
        </div>
      )}

      {visible.length === 0 && status.orders !== 'error' ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <p className="font-display text-lg font-bold text-sb-blue-deeper">
            {orders.length === 0
              ? 'Todavía no hay pedidos de clientes'
              : 'Ningún pedido coincide con el filtro'}
          </p>
          <p className="mt-2 text-sm text-sb-muted">
            {orders.length === 0
              ? 'Cada compra que confirme un cliente aparece acá automáticamente.'
              : 'Probá con otro término o cambiá el estado seleccionado.'}
          </p>
        </div>
      ) : null}

      {visible.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-xs tracking-wide text-sb-muted uppercase">
              <tr>
                <th className="px-5 py-3 font-semibold">Código</th>
                <th className="px-5 py-3 font-semibold">Cliente</th>
                <th className="px-5 py-3 font-semibold">Fecha</th>
                <th className="px-5 py-3 font-semibold">Total</th>
                <th className="px-5 py-3 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  expanded={expanded === order.id}
                  onToggle={() => setExpanded(expanded === order.id ? null : order.id)}
                  onStatusChange={(next) =>
                    changeOrderStatus(order.id, next).catch((err) =>
                      setError(
                        err instanceof ApiError ? err.message : 'No pudimos actualizar el pedido',
                      ),
                    )}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function OrderRow({
  order,
  expanded,
  onToggle,
  onStatusChange,
}: {
  order: Order
  expanded: boolean
  onToggle: () => void
  onStatusChange: (status: OrderStatus) => void
}) {
  return (
    <>
      <tr className="transition hover:bg-sb-cream/50">
        <td className="px-5 py-3">
          <button
            type="button"
            onClick={onToggle}
            className="font-display font-semibold text-sb-blue-deeper hover:text-sb-blue"
          >
            {order.code}
          </button>
        </td>
        <td className="px-5 py-3">
          <p className="font-semibold text-sb-blue-deeper">{order.userName}</p>
          <p className="text-xs text-sb-muted">{order.userEmail}</p>
        </td>
        <td className="px-5 py-3 whitespace-nowrap text-sb-muted">{order.date}</td>
        <td className="px-5 py-3 font-semibold text-sb-blue-deeper">
          {formatPrice(order.total)}
        </td>
        <td className="px-5 py-3">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[order.status]}`}
            >
              {order.status}
            </span>
            <select
              aria-label={`Cambiar estado de ${order.code}`}
              value={order.status}
              onChange={(event) => onStatusChange(event.target.value as OrderStatus)}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none focus:border-sb-blue"
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-50/70">
          <td colSpan={5} className="px-5 py-4">
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <ul className="flex flex-col gap-2">
                {order.items.map((item) => (
                  <li key={item.productId} className="flex items-center gap-3 text-sm">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-xs font-bold text-sb-blue">
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

              <dl className="flex flex-col gap-2 text-sm">
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 text-xs font-semibold tracking-wide text-sb-muted uppercase">
                    Entrega
                  </dt>
                  <dd className="text-sb-blue-deeper">{order.address}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 text-xs font-semibold tracking-wide text-sb-muted uppercase">
                    Pago
                  </dt>
                  <dd className="text-sb-blue-deeper">
                    {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 text-xs font-semibold tracking-wide text-sb-muted uppercase">
                    Notas
                  </dt>
                  <dd className="text-sb-blue-deeper">{order.notes || '—'}</dd>
                </div>
              </dl>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}