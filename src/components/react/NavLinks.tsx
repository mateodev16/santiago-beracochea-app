import { useLocationState } from '../../lib/useLocationState'

interface Props {
  variant?: 'desktop' | 'mobile'
}

const LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/#marcas-portafolio', label: 'Marcas' },
  { href: '/catalogo', label: 'Productos' },
  { href: '/#contacto', label: 'Contacto' },
]

export default function NavLinks({ variant = 'desktop' }: Props) {
  const { pathname } = useLocationState()

  // Los links con ancla (Marcas) no se marcan como activos para no competir con
  // "Inicio", que apunta a la misma ruta sin ancla.
  const isActive = (href: string) => !href.includes('#') && pathname === href

  return (
    <nav
      className={
        variant === 'desktop'
          ? 'hidden flex-1 items-center justify-center gap-6 lg:flex'
          : 'flex gap-5 overflow-x-auto border-t border-white/10 px-6 py-2 lg:hidden'
      }
      aria-label="Principal"
    >
      {LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          aria-current={isActive(link.href) ? 'page' : undefined}
          className={
            variant === 'desktop'
              ? [
                  'text-sm font-semibold transition',
                  isActive(link.href) ? 'text-sb-gold' : 'text-white/75 hover:text-sb-gold',
                ].join(' ')
              : 'text-xs font-semibold whitespace-nowrap text-white/85 hover:text-sb-gold'
          }
        >
          {link.label}
        </a>
      ))}
    </nav>
  )
}