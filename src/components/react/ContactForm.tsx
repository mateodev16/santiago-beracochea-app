import { useState } from 'react'

interface ContactData {
  nombre: string
  empresa: string
  email: string
  consulta: string
}

type Field = keyof ContactData
type Errors = Partial<Record<Field, string>>

const EMPTY: ContactData = { nombre: '', empresa: '', email: '', consulta: '' }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const FIELD_CLASS =
  'w-full px-5 py-4 rounded-xl bg-slate-50/80 border border-slate-200/80 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sb-blue focus:bg-white transition duration-200'

const FIELD_ERROR_CLASS = 'border-red-300 focus:ring-red-400'

function validate(data: ContactData): Errors {
  const errors: Errors = {}

  if (!data.nombre.trim()) errors.nombre = 'Ingresá tu nombre.'
  if (!data.empresa.trim()) errors.empresa = 'Ingresá el nombre de tu empresa.'
  if (!data.email.trim()) errors.email = 'Ingresá tu email.'
  else if (!EMAIL_RE.test(data.email.trim())) errors.email = 'Revisá el formato del email.'
  if (!data.consulta.trim()) errors.consulta = 'Contanos qué necesitás.'

  return errors
}

export default function ContactForm() {
  const [formData, setFormData] = useState<ContactData>(EMPTY)
  const [errors, setErrors] = useState<Errors>({})
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const field = name as Field

    setSent(false)
    setFormData((prev) => ({ ...prev, [field]: value }))
    // El aviso se borra al tocar el campo: si no, queda señalando algo ya corregido.
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()

    const found = validate(formData)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSending(true)
    // Todavía no hay endpoint: el aviso confirma el envío pero los datos solo
    // quedan en la consola. Cuando exista, reemplazar esto por la llamada a la API.
    console.log('Consulta enviada:', formData)

    window.setTimeout(() => {
      setSending(false)
      setSent(true)
      setFormData(EMPTY)
      setErrors({})
    }, 700)
  }

  const describedBy = (field: Field) => (errors[field] ? `error-${field}` : undefined)

  return (
    <section
      id="contacto"
      className="bg-slate-50/50 py-16 px-4 flex flex-col items-center justify-center font-sans"
    >
      {/* Encabezado */}
      <div className="text-center mb-10 max-w-2xl">
        <span className="text-sb-blue font-bold text-xs tracking-widest uppercase mb-2 block">
          Contacto
        </span>
        <h2 className="text-4xl md:text-5xl font-display font-bold text-sb-blue-deeper mb-4 tracking-tight">
          ¿Trabajamos juntos?
        </h2>
        <p className="text-sb-muted text-base md:text-lg">
          Dejanos tu consulta y te contactamos a la brevedad.
        </p>
      </div>

      {/* Tarjeta del Formulario */}
      <div className="w-full max-w-3xl bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-100">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          {sent && (
            <p
              role="status"
              aria-live="polite"
              className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs text-white">
                ✓
              </span>
              Email enviado. Gracias por escribirnos, te respondemos dentro de las próximas 24
              horas.
            </p>
          )}

          {/* Fila 1: Nombre y Empresa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <input
                type="text"
                name="nombre"
                aria-label="Tu nombre"
                aria-invalid={Boolean(errors.nombre)}
                aria-describedby={describedBy('nombre')}
                placeholder="Tu nombre"
                value={formData.nombre}
                onChange={handleChange}
                className={`${FIELD_CLASS} ${errors.nombre ? FIELD_ERROR_CLASS : ''}`}
              />
              {errors.nombre && (
                <p id="error-nombre" className="mt-2 text-xs font-medium text-red-600">
                  {errors.nombre}
                </p>
              )}
            </div>

            <div>
              <input
                type="email"
                name="empresa"
                aria-label="Empresa o comercio"
                aria-invalid={Boolean(errors.empresa)}
                aria-describedby={describedBy('empresa')}
                placeholder="Empresa / Comercio"
                value={formData.empresa}
                onChange={handleChange}
                className={`${FIELD_CLASS} ${errors.empresa ? FIELD_ERROR_CLASS : ''}`}
              />
              {errors.empresa && (
                <p id="error-empresa" className="mt-2 text-xs font-medium text-red-600">
                  {errors.empresa}
                </p>
              )}
            </div>
          </div>

          {/* Fila 2: Email */}
          <div>
            <input
              type="email"
              name="email"
              aria-label="Tu email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={describedBy('email')}
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className={`${FIELD_CLASS} ${errors.email ? FIELD_ERROR_CLASS : ''}`}
            />
            {errors.email && (
              <p id="error-email" className="mt-2 text-xs font-medium text-red-600">
                {errors.email}
              </p>
            )}
          </div>

          {/* Fila 3: Consulta */}
          <div>
            <textarea
              name="consulta"
              aria-label="Tu consulta"
              aria-invalid={Boolean(errors.consulta)}
              aria-describedby={describedBy('consulta')}
              placeholder="Tu consulta..."
              rows={5}
              value={formData.consulta}
              onChange={handleChange}
              className={`${FIELD_CLASS} ${errors.consulta ? FIELD_ERROR_CLASS : ''}`}
            />
            {errors.consulta && (
              <p id="error-consulta" className="mt-2 text-xs font-medium text-red-600">
                {errors.consulta}
              </p>
            )}
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={sending}
            className="mt-2 w-full md:w-auto self-center px-10 py-4 rounded-xl bg-sb-blue text-white font-semibold text-sm tracking-wide uppercase shadow-sm shadow-sb-blue/20 transition-all duration-300 hover:bg-sb-blue-dark hover:scale-[1.02] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:hover:scale-100"
          >
            {sending ? 'Enviando...' : 'Enviar consulta'}
          </button>
        </form>
      </div>
    </section>
  )
}
