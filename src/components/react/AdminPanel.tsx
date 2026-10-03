import { useEffect, useState } from 'react'
import { bootstrap, useSession } from '../../lib/store'
import { useLoginHref } from '../../lib/useLocationState'
import AdminMetrics from './AdminMetrics'
import AdminOrders from './AdminOrders'
import AdminProductTable from './AdminProductTable'

interface Props {
  view: 'productos' | 'pedidos' | 'metricas'
}

export default function AdminPanel({ view }: Props) {
const user = useSession()
  // Los hooks se ejecutan siempre y arriba de los returns: llamarlos dentro de
  // una rama cambia el orden entre renders y React desmonta la isla.
  const loginHref = useLoginHref()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    bootstrap().finally(() => setReady(true))
  }, [])

  if (!ready) {
    return <p className="py-16 text-center text-sm text-sb-muted">Verificando permisos...</p>
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
        <h2 className="font-display text-xl font-bold text-sb-blue-deeper">
          Necesitás iniciar sesión
        </h2>
        <p className="mt-2 text-sm text-sb-muted">
          El panel administrativo requiere una cuenta con permisos de administrador.
        </p>
        <a
          href={loginHref}
          className="mt-6 inline-block rounded-xl bg-sb-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sb-blue-dark"
        >
          Iniciar sesión
        </a>
      </div>
    )
  }

  if (user.role !== 'admin') {
    return (
      <div className="rounded-2xl border border-red-100 bg-white p-10 text-center shadow-sm">
        <h2 className="font-display text-xl font-bold text-sb-blue-deeper">Acceso restringido</h2>
        <p className="mt-2 text-sm text-sb-muted">
          Tu cuenta no tiene permisos de administrador para ver esta sección.
        </p>
        <a
          href="/"
          className="mt-6 inline-block rounded-xl bg-sb-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sb-blue-dark"
        >
          Volver al inicio
        </a>
      </div>
    )
  }

  return (
    <>
      {view === 'productos' && <AdminProductTable />}
      {view === 'pedidos' && <AdminOrders />}
      {view === 'metricas' && <AdminMetrics />}
    </>
  )
}