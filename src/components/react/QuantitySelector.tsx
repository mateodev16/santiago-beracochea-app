import { MAX_QTY } from '../../lib/store'

interface Props {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  size?: 'sm' | 'md'
  label?: string
}

export default function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = MAX_QTY,
  size = 'md',
  label = 'Cantidad',
}: Props) {
  const clamp = (n: number) => Math.min(Math.max(n, min), max)
  const box = size === 'sm' ? 'h-8 w-8 text-sm' : 'h-10 w-10'
  const input = size === 'sm' ? 'h-8 w-10 text-sm' : 'h-10 w-12'

  return (
    <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        aria-label={`Disminuir ${label.toLowerCase()}`}
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        className={`${box} grid place-items-center rounded-l-xl font-semibold text-sb-blue transition hover:bg-sb-cream disabled:cursor-not-allowed disabled:text-slate-300`}
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        aria-label={label}
        value={value}
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value.replace(/\D/g, ''), 10)
          onChange(Number.isNaN(parsed) ? min : clamp(parsed))
        }}
        className={`${input} border-x border-slate-200 text-center font-semibold text-sb-blue-deeper outline-none focus:bg-sb-cream`}
      />
      <button
        type="button"
        aria-label={`Aumentar ${label.toLowerCase()}`}
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        className={`${box} grid place-items-center rounded-r-xl font-semibold text-sb-blue transition hover:bg-sb-cream disabled:cursor-not-allowed disabled:text-slate-300`}
      >
        +
      </button>
    </div>
  )
}