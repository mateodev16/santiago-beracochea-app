import { useState } from 'react'
import { PRODUCTS } from '../../data/products'

interface BrandInfo {
  name: string
  category: string
  initial: string
  bgColor: string
  logo?: string
}

// Logotipos en public/images/brands. Si una marca no está en este mapa, o el
// archivo no se puede cargar, la tarjeta muestra la inicial con su color.
const LOGO_BY_BRAND: Record<string, string> = {
  Fleischmann: '/images/brands/fleischmann.png',
  Adria: '/images/brands/adria.png',
  Sucralight: '/images/brands/sucralight.png',
  PRIME: '/images/brands/prime.jpg',
  Prix: '/images/brands/prix.jpg',
  ALUR: '/images/brands/alur.jpg',
}

const BG_BY_BRAND: Record<string, string> = {
  Fleischmann: 'bg-[#00429d]',
  Adria: 'bg-[#c8000a]',
  Sucralight: 'bg-[#e5ab00]',
  PRIME: 'bg-[#476070]',
  Prix: 'bg-[#0072b2]',
  ALUR: 'bg-[#0f766e]',
}

// Paleta de respaldo para las marcas que no tengan color asignado.
const FALLBACK_BG = [
  'bg-sb-blue',
  'bg-sb-blue-dark',
  'bg-sb-blue-deeper',
  'bg-slate-600',
  'bg-slate-700',
]

const brandInfo = (name: string, index: number): BrandInfo => ({
  name,
  category: PRODUCTS.find((p) => p.brand === name)?.category ?? '',
  initial: name.charAt(0).toUpperCase(),
  bgColor: BG_BY_BRAND[name] ?? FALLBACK_BG[index % FALLBACK_BG.length],
  logo: LOGO_BY_BRAND[name],
})

export default function BrandsSection() {
  const brands = [...new Set(PRODUCTS.map((p) => p.brand))].map(brandInfo)
  const [brokenLogos, setBrokenLogos] = useState<string[]>([])

  const logoFor = (brand: BrandInfo) =>
    brand.logo && !brokenLogos.includes(brand.name) ? brand.logo : undefined

  const markBroken = (name: string) => setBrokenLogos((prev) => [...prev, name])

  return (
    <section
      id="marcas-portafolio"
      // scroll-mt deja aire para que el header sticky no tape el título al
      // llegar con el ancla desde la navbar.
      className="scroll-mt-24 bg-slate-50/50 py-16 px-4 flex flex-col items-center justify-center font-sans"
    >
      {/* Encabezado */}
      <div className="text-center mb-12 max-w-2xl">
        <span className="text-sb-blue font-bold text-xs tracking-widest uppercase mb-2 block">
          Nuestro Portafolio
        </span>
        <h2 className="text-4xl md:text-5xl font-display font-bold text-sb-blue-deeper tracking-tight">
          Marcas que distribuimos
        </h2>
      </div>

      {/* Grid de Marcas */}
      <div className="w-full max-w-6xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
        {brands.map((brand) => {
          const logo = logoFor(brand)

          return (
            <a
              key={brand.name}
              href={`/catalogo?marca=${encodeURIComponent(brand.name)}`}
              className="bg-white rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg shadow-slate-200/50 border border-slate-100 transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl"
            >
              {/* Logotipo de la marca, o la inicial si no hay imagen */}
              {logo ? (
                <div className="w-20 h-20 mb-4 flex items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-white p-2">
                  <img
                    src={logo}
                    alt={`Logo de ${brand.name}`}
                    loading="lazy"
                    className="w-full h-full object-contain"
                    onError={() => markBroken(brand.name)}
                  />
                </div>
              ) : (
                <div
                  className={`w-20 h-20 mb-4 rounded-xl ${brand.bgColor} text-white font-bold text-lg flex items-center justify-center`}
                >
                  {brand.initial}
                </div>
              )}

              {/* Nombre de la Marca */}
              <h3 className="font-bold text-sb-blue-deeper text-sm md:text-base leading-snug">
                {brand.name}
              </h3>

              {/* Categoría */}
              <span className="text-xs text-sb-muted mt-1">{brand.category}</span>
            </a>
          )
        })}
      </div>
    </section>
  )
}