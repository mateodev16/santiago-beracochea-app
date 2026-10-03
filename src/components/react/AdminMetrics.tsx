import { useEffect, useMemo, useState } from 'react'
import { formatPrice } from '../../data/products'
import { refreshMetrics, useMetrics, useMetricsError, useSession, useStatus } from '../../lib/store'

const card =
  'rounded-2xl border border-slate-100 bg-white p-6 shadow-sm'
const label = 'text-[11px] font-semibold tracking-[0.15em] text-sb-muted uppercase'
const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

/** "2026-09" -> "septiembre 2026" */
const monthLabel = (month: string) => {
  const [year, monthNumber] = month.split('-')
  return `${MONTHS[Number(monthNumber) - 1] ?? monthNumber} ${year}`
}

const Bar = ({ value, max, tone = 'bg-sb-blue' }: { value: number; max: number; tone?: string }) => {
  const width = max > 0 ? Math.max((value / max) * 100, 2) : 0
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${tone}`} style={{ width: `${width}%` }} />
    </div>
  )
}

export default function AdminMetrics() {
  const metrics = useMetrics()
  const error = useMetricsError()
  const status = useStatus()
  const user = useSession()
  const [groupBy, setGroupBy] = useState<'month' | 'year'>('month')

  const loading = status.metrics === 'loading' || status.metrics === 'idle'

  useEffect(() => {
    void refreshMetrics()
  }, [user?.id])

  const chart = useMemo(() => {
    if (!metrics) return []
    const rows =
      groupBy === 'month'
        ? metrics.salesByMonth.map((row) => ({
            key: row.month,
            label: monthLabel(row.month),
            value: row.totalRevenue,
            orders: row.ordersCount,
          }))
        : metrics.salesByYear.map((row) => ({
            key: row.year,
            label: row.year,
            value: row.totalRevenue,
            orders: row.ordersCount,
          }))
    return rows.slice().reverse()
  }, [metrics, groupBy])

  const maxRevenue = useMemo(
    () => Math.max(...chart.map((row) => row.value), 0),
    [chart],
  )

  if (loading && !metrics) {
    return <p className="py-16 text-center text-sm text-sb-muted">Calculando métricas...</p>
  }

  if (error && !metrics) {
    return (
      <div className="rounded-2xl border border-red-100 bg-white p-10 text-center shadow-sm">
        <h2 className="font-display text-xl font-bold text-sb-blue-deeper">
          No pudimos cargar las métricas
        </h2>
        <p className="mt-2 text-sm text-sb-muted">{error}</p>
        <button
          type="button"
          onClick={() => void refreshMetrics()}
          className="mt-6 rounded-xl bg-sb-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sb-blue-dark"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (!metrics) return null

  const { totals } = metrics
  const spenders = metrics.customerSpend.filter((row) => row.ordersCount > 0)
  const maxSpent = Math.max(...spenders.map((row) => row.totalSpent), 0)
  const avgTicket = totals.orders > 0 ? totals.revenueApproved / totals.orders : 0

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={card}>
          <p className={label}>Ventas confirmadas</p>
          <p className="mt-2 font-display text-3xl font-bold text-sb-blue-deeper">
            {formatPrice(totals.revenueApproved)}
          </p>
          <p className="mt-1 text-xs text-sb-muted">
            Pendientes: {formatPrice(totals.revenueTotal - totals.revenueApproved)}
          </p>
        </div>
        <div className={card}>
          <p className={label}>Pedidos</p>
          <p className="mt-2 font-display text-3xl font-bold text-sb-blue-deeper">
            {totals.orders}
          </p>
          <p className="mt-1 text-xs text-sb-muted">
            {totals.pending} pendiente · {totals.confirmed} confirmado · {totals.delivered}{' '}
            entregado
          </p>
        </div>
        <div className={card}>
          <p className={label}>Ticket promedio</p>
          <p className="mt-2 font-display text-3xl font-bold text-sb-blue-deeper">
            {formatPrice(avgTicket)}
          </p>
          <p className="mt-1 text-xs text-sb-muted">Envío facturado {formatPrice(totals.shippingTotal)}</p>
        </div>
        <div className={card}>
          <p className={label}>Clientes que compraron</p>
          <p className="mt-2 font-display text-3xl font-bold text-sb-blue-deeper">
            {totals.customers}
          </p>
          <p className="mt-1 text-xs text-sb-muted">de {metrics.customerSpend.length} cuentas</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={card}>
          <p className={label}>Producto más vendido</p>
          {metrics.mostSoldProduct ? (
            <div className="mt-4 flex items-center gap-4">
              {metrics.mostSoldProduct.image && (
                <img
                  src={metrics.mostSoldProduct.image}
                  alt=""
                  className="h-16 w-16 rounded-xl object-cover"
                />
              )}
              <div className="min-w-0">
                <p className="truncate font-semibold text-sb-blue-deeper">
                  {metrics.mostSoldProduct.name}
                </p>
                <p className="text-xs text-sb-muted">{metrics.mostSoldProduct.brand}</p>
                <p className="mt-2 text-sm font-semibold text-sb-blue">
                  {metrics.mostSoldProduct.totalQty} unidades ·{' '}
                  {formatPrice(metrics.mostSoldProduct.totalRevenue)}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-sb-muted">Todavía no hay ventas registradas.</p>
          )}
        </div>

        <div className={card}>
          <p className={label}>Cliente que más compró</p>
          {metrics.topCustomer ? (
            <div className="mt-4">
              <p className="font-semibold text-sb-blue-deeper">{metrics.topCustomer.name}</p>
              <p className="text-xs text-sb-muted">{metrics.topCustomer.email}</p>
              <p className="mt-2 text-sm font-semibold text-sb-blue">
                {metrics.topCustomer.ordersCount} pedidos ·{' '}
                {formatPrice(metrics.topCustomer.totalSpent)}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-sb-muted">Todavía no hay compras registradas.</p>
          )}
        </div>
      </div>

      <div className={card}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className={label}>Ventas por {groupBy === 'month' ? 'mes' : 'año'}</p>
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            {(['month', 'year'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setGroupBy(option)}
                className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
                  groupBy === option
                    ? 'bg-white text-sb-blue shadow-sm'
                    : 'text-sb-muted hover:text-sb-blue'
                }`}
              >
                {option === 'month' ? 'Mensual' : 'Anual'}
              </button>
            ))}
          </div>
        </div>

        {chart.length === 0 ? (
          <p className="mt-4 text-sm text-sb-muted">Todavía no hay ventas registradas.</p>
        ) : (
          <ul className="mt-5 flex flex-col gap-4">
            {chart.map((row) => (
              <li key={row.key}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-semibold text-sb-blue-deeper capitalize">
                    {row.label}
                  </span>
                  <span className="text-xs text-sb-muted">
                    {row.orders} pedidos ·{' '}
                    <strong className="text-sb-blue">{formatPrice(row.value)}</strong>
                  </span>
                </div>
                <div className="mt-1.5">
                  <Bar value={row.value} max={maxRevenue} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={card}>
          <p className={label}>Productos con poco stock</p>
          {metrics.lowStock.length === 0 ? (
            <p className="mt-4 text-sm text-sb-muted">Todo el stock está por encima del mínimo.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {metrics.lowStock.map((product) => (
                <li
                  key={product.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-sb-blue-deeper">
                      {product.name}
                    </p>
                    <p className="text-xs text-sb-muted">
                      {product.brand} · {product.category}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                      product.stock === 0
                        ? 'bg-red-100 text-red-700'
                        : product.stock <= 5
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-sb-muted'
                    }`}
                  >
                    {product.stock} {product.unit}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={card}>
          <p className={label}>Cuánto compró cada cliente</p>
          {spenders.length === 0 ? (
            <p className="mt-4 text-sm text-sb-muted">Todavía no hay compras registradas.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-4">
              {spenders.map((row) => (
                <li key={row.userId}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-semibold text-sb-blue-deeper">
                      {row.name}
                    </span>
                    <span className="shrink-0 text-xs text-sb-muted">
                      <strong className="text-sb-blue">{formatPrice(row.totalSpent)}</strong> ·{' '}
                      {row.ordersCount} pedidos
                    </span>
                  </div>
                  <p className="truncate text-xs text-sb-muted">{row.email}</p>
                  <div className="mt-1.5">
                    <Bar value={row.totalSpent} max={maxSpent} tone="bg-sb-gold" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
