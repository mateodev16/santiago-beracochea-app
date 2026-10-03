import type { Product } from '../../data/products'

export type SortOption = 'relevancia' | 'precio-asc' | 'precio-desc' | 'nombre'

export interface FiltersState {
  query: string
  categories: string[]
  brands: string[]
  minPrice: number
  maxPrice: number
  onlyInStock: boolean
  sort: SortOption
}

export const EMPTY_FILTERS: FiltersState = {
  query: '',
  categories: [],
  brands: [],
  minPrice: 0,
  maxPrice: 0,
  onlyInStock: false,
  sort: 'relevancia',
}

export const priceBounds = (products: Product[]) => {
  const prices = products.map((p) => p.price)
  const min = prices.length ? Math.min(...prices) : 0
  const max = prices.length ? Math.max(...prices) : 0
  return { min: Math.floor(min), max: Math.ceil(max) }
}

export const uniqueCategories = (products: Product[]) =>
  [...new Set(products.map((p) => p.category))].sort()

export const uniqueBrands = (products: Product[]) =>
  [...new Set(products.map((p) => p.brand))].sort()

export function applyFilters(products: Product[], filters: FiltersState): Product[] {
  const query = filters.query.trim().toLowerCase()

  const filtered = products.filter((product) => {
    const matchesQuery =
      query.length === 0 ||
      product.name.toLowerCase().includes(query) ||
      product.brand.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query)

    const matchesCategory =
      filters.categories.length === 0 || filters.categories.includes(product.category)

    const matchesBrand = filters.brands.length === 0 || filters.brands.includes(product.brand)

    const matchesMin = filters.minPrice > 0 ? product.price >= filters.minPrice : true
    const matchesMax = filters.maxPrice > 0 ? product.price <= filters.maxPrice : true
    const matchesStock = filters.onlyInStock ? product.stock > 0 : true

    return (
      matchesQuery && matchesCategory && matchesBrand && matchesMin && matchesMax && matchesStock
    )
  })

  const sorted = [...filtered]
  switch (filters.sort) {
    case 'precio-asc':
      sorted.sort((a, b) => a.price - b.price)
      break
    case 'precio-desc':
      sorted.sort((a, b) => b.price - a.price)
      break
    case 'nombre':
      sorted.sort((a, b) => a.name.localeCompare(b.name, 'es'))
      break
    default:
      break
  }
  return sorted
}

interface Props {
  products: Product[]
  filters: FiltersState
  onChange: (next: FiltersState) => void
  resultCount: number
}

export default function ProductFilters({ products, filters, onChange, resultCount }: Props) {
  const categories = uniqueCategories(products)
  const brands = uniqueBrands(products)
  const bounds = priceBounds(products)

  const toggle = (key: 'categories' | 'brands', value: string) => {
    const current = filters[key]
    onChange({
      ...filters,
      [key]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    })
  }

  const checkboxClass =
    'h-4 w-4 rounded border-slate-300 text-sb-blue accent-sb-blue focus:ring-sb-blue'

  return (
    <aside className="flex h-fit flex-col gap-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:sticky lg:top-24">
      <div>
        <label
          htmlFor="filter-search"
          className="mb-2 block text-xs font-semibold tracking-wide text-sb-muted uppercase"
        >
          Buscar
        </label>
        <input
          id="filter-search"
          type="search"
          value={filters.query}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
          placeholder="Nombre, marca o descripción"
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sb-blue"
        />
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold tracking-wide text-sb-muted uppercase">
          Categorías
        </p>
        <div className="flex flex-col gap-2">
          {categories.map((category) => (
            <label key={category} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className={checkboxClass}
                checked={filters.categories.includes(category)}
                onChange={() => toggle('categories', category)}
              />
              {category}
            </label>
          ))}
        </div>
      </div>

      <div id="marcas">
        <p className="mb-3 text-xs font-semibold tracking-wide text-sb-muted uppercase">Marcas</p>
        <div className="flex flex-wrap gap-2">
          {brands.map((brand) => {
            const active = filters.brands.includes(brand)
            return (
              <button
                key={brand}
                type="button"
                onClick={() => toggle('brands', brand)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? 'border-sb-blue bg-sb-blue text-white'
                    : 'border-slate-200 text-sb-muted hover:border-sb-blue hover:text-sb-blue'
                }`}
              >
                {brand}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold tracking-wide text-sb-muted uppercase">
          Precio ({bounds.min} – {bounds.max})
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            aria-label="Precio mínimo"
            value={filters.minPrice || ''}
            placeholder={String(bounds.min)}
            onChange={(event) =>
              onChange({ ...filters, minPrice: Number(event.target.value) || 0 })
            }
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sb-blue"
          />
          <span className="text-sb-muted">—</span>
          <input
            type="number"
            min={0}
            aria-label="Precio máximo"
            value={filters.maxPrice || ''}
            placeholder={String(bounds.max)}
            onChange={(event) =>
              onChange({ ...filters, maxPrice: Number(event.target.value) || 0 })
            }
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sb-blue"
          />
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold tracking-wide text-sb-muted uppercase">
          Ordenar por
        </p>
        <select
          value={filters.sort}
          onChange={(event) => onChange({ ...filters, sort: event.target.value as SortOption })}
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-sb-blue"
        >
          <option value="relevancia">Relevancia</option>
          <option value="precio-asc">Menor precio</option>
          <option value="precio-desc">Mayor precio</option>
          <option value="nombre">Nombre A-Z</option>
        </select>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          className={checkboxClass}
          checked={filters.onlyInStock}
          onChange={() => onChange({ ...filters, onlyInStock: !filters.onlyInStock })}
        />
        Solo productos con stock
      </label>

      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
        <p className="text-sm text-sb-muted">
          <span className="font-semibold text-sb-blue-deeper">{resultCount}</span> productos
        </p>
        <button
          type="button"
          onClick={() => onChange({ ...EMPTY_FILTERS })}
          className="text-sm font-semibold text-sb-blue hover:underline"
        >
          Limpiar
        </button>
      </div>
    </aside>
  )
}