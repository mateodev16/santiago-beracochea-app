import { useEffect, useMemo, useState } from 'react'
import ProductCard from './ProductCard'
import ProductFilters, {
  applyFilters,
  EMPTY_FILTERS,
  uniqueBrands,
  uniqueCategories,
  type FiltersState,
} from './ProductFilters'
import { bootstrap, useProducts, useStatus } from '../../lib/store'

/** Compara categorías sin depender de acentos ni mayúsculas: "Panadería" = "panaderia". */
const normalizeLabel = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

export default function CatalogExplorer() {
  const products = useProducts()
  const status = useStatus()
  const [filters, setFilters] = useState<FiltersState>(EMPTY_FILTERS)

  useEffect(() => {
    void bootstrap()
  }, [])

  // La home y las secciones enlazan a /catalogo?categoria=X o ?marca=X. Astro
  // no nos da la query en el render del servidor, así que arrancamos sin filtros
  // (igual que el HTML ya enviado) y aplicamos la URL recién después del mount.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const read = (...keys: string[]) =>
      keys
        .map((key) => params.get(key))
        .filter((value): value is string => Boolean(value))
        .map((value) => value.trim())
        .filter((value) => value.length > 0)

    const matchKnown = (values: string[], known: string[]) => {
      const matched = values.filter((value) =>
        known.some((option) => normalizeLabel(option) === normalizeLabel(value)),
      )
      return matched.length > 0 ? matched : null
    }

    const categories = matchKnown(
      read('categoria', 'category'),
      uniqueCategories(products),
    )
    const brands = matchKnown(read('marca', 'brand'), uniqueBrands(products))

    if (!categories && !brands) return

    setFilters((prev) => ({
      ...prev,
      categories: categories ?? prev.categories,
      brands: brands ?? prev.brands,
    }))
  }, [products])

  const results = useMemo(() => applyFilters(products, filters), [products, filters])

  const activeChips: string[] = [
    ...filters.categories.map((c) => `Categoría: ${c}`),
    ...filters.brands.map((b) => `Marca: ${b}`),
    ...(filters.minPrice > 0 ? [`Desde $${filters.minPrice}`] : []),
    ...(filters.maxPrice > 0 ? [`Hasta $${filters.maxPrice}`] : []),
    ...(filters.onlyInStock ? ['Solo con stock'] : []),
  ]

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <ProductFilters
        products={products}
        filters={filters}
        onChange={setFilters}
        resultCount={results.length}
      />

      <div>
        {status.products === 'loading' && (
          <p className="mb-6 rounded-xl bg-sb-cream px-4 py-3 text-sm text-sb-muted">
            Sincronizando catálogo con el servidor...
          </p>
        )}

        {activeChips.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {activeChips.map((chip) => (
              <span
                key={chip}
                className="rounded-full bg-sb-cream px-3 py-1 text-xs font-medium text-sb-blue"
              >
                {chip}
              </span>
            ))}
          </div>
        )}

        {results.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 py-20 text-center">
            <p className="font-display text-xl font-bold text-sb-blue-deeper">
              No encontramos productos
            </p>
            <p className="mt-2 text-sm text-sb-muted">
              Probá ajustando los filtros o buscá con otros términos.
            </p>
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="mt-6 rounded-xl bg-sb-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sb-blue-dark"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}