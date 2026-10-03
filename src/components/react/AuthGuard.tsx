import { useEffect, useState } from 'react'
import { loginHref } from '../../lib/auth'
import { useLocationState } from '../../lib/useLocationState'
import { bootstrap, useSession, useStatus } from '../../lib/store'

/**
 * Resuelve la sesión y, si la ruta pide login y no hay sesión, manda a
 * /login con ?next= para devolver al usuario al mismo lugar.
 *
 * No envuelve a `<slot />`: Astro pasa los hijos de una isla hidratada como
 * HTML estático dentro de `<astro-slot>` y no como props de React, así que al
 * hidratar React los borraría del DOM. Por eso va como hermano del contenido y
 * renderiza `null`.
 *
 * El contenido se sirve igual en servidor: la página ya llega al HTML y los
 * datos viajan por la API con su propio control de permisos, así que acá solo
 * se evita la navegación a una vista inútil.
 */
export default function AuthGuard() {
  const user = useSession()
  const status = useStatus()
  const { protectedPath } = useLocationState()
  const [redirecting, setRedirecting] = useState(false)

  const resolved = status.session === 'ready' || status.session === 'error'

  useEffect(() => {
    void bootstrap()
  }, [])

  useEffect(() => {
    if (!resolved || user || !protectedPath || redirecting) return

    setRedirecting(true)
    window.location.href = loginHref(protectedPath)
  }, [resolved, user, protectedPath, redirecting])

  return null
}
