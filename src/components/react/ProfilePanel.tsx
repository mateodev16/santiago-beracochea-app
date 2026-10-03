import { useEffect, useState } from 'react'
import {
  ApiError,
  bootstrap,
  logout,
  updateProfile,
  useOrders,
  useSession,
} from '../../lib/store'
import { useLoginHref } from '../../lib/useLocationState'

const inputClass =
  'w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sb-blue'
const labelClass = 'mb-1.5 block text-xs font-semibold text-sb-muted'

export default function ProfilePanel() {
  const user = useSession()
  const orders = useOrders()
  // Los hooks se ejecutan siempre y arriba de los returns: llamarlos dentro de
  // una rama cambia el orden entre renders y React desmonta la isla.
  const loginHref = useLoginHref()
  useEffect(() => {
    void bootstrap()
  }, [])
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
  })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // La sesión llega por API después del primer render, así que el inicializador
  // de useState nunca vio al usuario. Sin esto los campos quedan vacíos.
  useEffect(() => {
    if (!user) return
    setForm({
      name: user.name ?? '',
      phone: user.phone ?? '',
      address: user.address ?? '',
      city: user.city ?? '',
    })
  }, [user])

  if (!user) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
        <h2 className="font-display text-xl font-bold text-sb-blue-deeper">
          Iniciá sesión para ver tu perfil
        </h2>
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

  const totalSpent = orders
    .filter((order) => order.userId === user.id && order.status !== 'pendiente')
    .reduce((acc, order) => acc + order.total, 0)

  const update = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const submit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSaved(false)
    setSaving(true)
    try {
      await updateProfile({
        name: form.name.trim() || user.name,
        phone: form.phone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
      })
      setSaved(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos guardar el perfil')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="flex h-fit flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-sb-blue font-display text-2xl font-bold text-white uppercase">
          {user.name.slice(0, 2)}
        </span>
        <div>
          <p className="font-display text-lg font-bold text-sb-blue-deeper">{user.name}</p>
          <p className="text-sm text-sb-muted">{user.email}</p>
        </div>
        {user.role === 'admin' && (
          <span className="rounded-full bg-sb-blue/10 px-3 py-1 text-xs font-semibold text-sb-blue">
            Administrador
          </span>
        )}
        <dl className="mt-4 grid w-full grid-cols-2 gap-3 text-left">
          <div className="rounded-xl bg-sb-cream p-3">
            <dt className="text-[11px] text-sb-muted">Pedidos</dt>
            <dd className="font-display text-xl font-bold text-sb-blue-deeper">
              {orders.filter((o) => o.userId === user.id).length}
            </dd>
          </div>
          <div className="rounded-xl bg-sb-cream p-3">
            <dt className="text-[11px] text-sb-muted">Total comprado</dt>
            <dd className="font-display text-xl font-bold text-sb-blue-deeper">
              ${totalSpent.toLocaleString('es-UY')}
            </dd>
          </div>
        </dl>
        <a
          href="/pedidos"
          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-sb-blue transition hover:border-sb-blue"
        >
          Ver historial de pedidos
        </a>
        <button
          type="button"
          onClick={() => {
            logout()
            window.location.href = '/'
          }}
          className="w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-50"
        >
          Cerrar sesión
        </button>
      </aside>

      <form onSubmit={submit} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-bold text-sb-blue-deeper">Mis datos</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="profile-name">
              Nombre
            </label>
            <input
              id="profile-name"
              className={inputClass}
              value={form.name}
              onChange={(event) => update('name', event.target.value)}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="profile-email">
              Email
            </label>
            <input id="profile-email" className={`${inputClass} bg-slate-50`} value={user.email} readOnly />
          </div>
          <div>
            <label className={labelClass} htmlFor="profile-phone">
              Teléfono
            </label>
            <input
              id="profile-phone"
              className={inputClass}
              value={form.phone}
              onChange={(event) => update('phone', event.target.value)}
              placeholder="099 123 456"
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="profile-city">
              Ciudad
            </label>
            <input
              id="profile-city"
              className={inputClass}
              value={form.city}
              onChange={(event) => update('city', event.target.value)}
              placeholder="Montevideo"
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="profile-address">
              Dirección
            </label>
            <input
              id="profile-address"
              className={inputClass}
              value={form.address}
              onChange={(event) => update('address', event.target.value)}
              placeholder="Calle, número, apto"
            />
          </div>
        </div>

        {saved && (
          <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            Perfil actualizado.
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-5 rounded-xl bg-sb-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sb-blue-dark disabled:bg-slate-300"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}