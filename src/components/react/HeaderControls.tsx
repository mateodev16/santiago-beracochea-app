import { useState } from 'react'
import { cartCount, useCart, useSession } from '../../lib/store'
import { registerHref } from '../../lib/auth'
import { useLoginHref } from '../../lib/useLocationState'
import ShoppingCart from './ShoppingCart'

export default function HeaderControls() {
  const lines = useCart()
  const user = useSession()
  const loginHrefValue = useLoginHref()
  const [open, setOpen] = useState(false)

  const count = cartCount(lines)

return (
    <div className="flex shrink-0 items-center gap-3">
      {!user && (
        <a
          href={registerHref()}
          className="hidden text-sm font-semibold text-white/75 transition hover:text-sb-gold xl:block"
        >
          Crear cuenta
        </a>
      )}

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir carrito"
        className="relative grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="10" cy="20" r="1.4" />
          <circle cx="18" cy="20" r="1.4" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-sb-gold px-1 text-[11px] font-bold text-sb-blue-deeper">
            {count}
          </span>
        )}
      </button>

      {user ? (
        <div className="flex items-center gap-3">
          <a
            href={user.role === 'admin' ? '/admin' : '/perfil'}
            className="hidden text-sm font-semibold text-white transition hover:text-sb-gold xl:block"
          >
            {user.name}
          </a>
          <a
            href="/pedidos"
            className="hidden rounded-xl border border-white/25 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 lg:block"
          >
            Mis pedidos
          </a>
          <a
            href={user.role === 'admin' ? '/admin' : '/perfil'}
            className="rounded-xl bg-sb-gold px-4 py-2 text-sm font-semibold text-sb-blue-dark transition hover:bg-sb-gold-light"
          >
            {user.role === 'admin' ? 'Panel admin' : 'Mi cuenta'}
          </a>
        </div>
      ) : (
        <a
          href={loginHrefValue}
          className="rounded-xl bg-sb-gold px-4 py-2 text-sm font-semibold text-sb-blue-dark transition hover:bg-sb-gold-light"
        >
          Iniciar sesión
        </a>
      )}

      {open && <ShoppingCart open={open} onClose={() => setOpen(false)} />}
    </div>
  )
}