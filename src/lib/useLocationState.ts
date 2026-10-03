import { useEffect, useState } from 'react'
import { isProtectedPath, loginHref, safeNext } from './auth'

interface LocationState {
  pathname: string
  search: string
  /** El path normalizado que exige sesión. */
  protectedPath: string | null
}

const EMPTY: LocationState = { pathname: '', search: '', protectedPath: null }

/**
 * `window` no existe durante el render en servidor, así que arrancamos siempre
 * con valores vacíos (idénticos al HTML ya enviado) y recién después del mount
 * leemos la URL real. Evita el warning de hidratación por markup distinto.
 */
export function useLocationState(): LocationState {
  const [state, setState] = useState<LocationState>(EMPTY)

  useEffect(() => {
    const { pathname, search } = window.location
    setState({
      pathname,
      search,
      protectedPath: isProtectedPath(pathname) ? pathname : null,
    })
  }, [])

  return state
}

/** El destino guardado en ?next=, ya validado contra open redirects. */
export function useNextParam(): string | null {
  const { search } = useLocationState()
  if (!search) return null
  return safeNext(new URLSearchParams(search).get('next'))
}

/**
 * href de "Iniciar sesión" que vuelve a la página actual. En servidor (y en el
 * primer render del cliente) devuelve `/login` pelado; recién después del mount
 * agrega `?next=`, de modo que el HTML hidratado coincida siempre.
 */
export function useLoginHref(fallback?: string): string {
  const { pathname, search } = useLocationState()
  const next = pathname ? `${pathname}${search}` : fallback
  return loginHref(next)
}
