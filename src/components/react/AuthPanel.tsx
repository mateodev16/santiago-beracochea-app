import { useEffect, useState } from 'react'
import { ApiError, login, logout, registerUser } from '../../lib/store'
import { loginHref, registerHref, safeNext } from '../../lib/auth'
import { useNextParam } from '../../lib/useLocationState'

interface Props {
  mode: 'login' | 'register'
}

const inputClass =
  'w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sb-blue'

interface PasswordInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: string
  visible: boolean
  onToggle: () => void
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete,
  visible,
  onToggle,
}: PasswordInputProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          className={`${inputClass} pr-24`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="••••••••"
          required
        />
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={visible}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="absolute top-1/2 right-1.5 flex -translate-y-1/2 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-sb-blue transition hover:bg-slate-100"
        >
          {visible ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M3 3l18 18" />
              <path d="M10.6 6.2A8.7 8.7 0 0 1 12 6c6 0 9.5 6 9.5 6a15.6 15.6 0 0 1-3.2 4.1" />
              <path d="M6.6 7.9A15.5 15.5 0 0 0 2.5 12S6 18 12 18a8.8 8.8 0 0 0 3.6-.8" />
              <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
          {visible ? 'Ocultar' : 'Ver'}
        </button>
      </div>
    </div>
  )
}

export default function AuthPanel({ mode }: Props) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    city: '',
  })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const next = useNextParam()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const emailFromRegister = params.get('email')
    if (mode === 'login' && emailFromRegister) {
      setForm((prev) => ({ ...prev, email: emailFromRegister }))
      setNotice('¡Cuenta creada! Iniciá sesión con tu correo.')
    }
    if (mode === 'login' && !emailFromRegister && safeNext(params.get('next'))) {
      setNotice('Iniciá sesión para continuar.')
    }
  }, [mode])

  const update = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const submit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (mode === 'register' && form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    try {
      const user =
        mode === 'login'
          ? await login(form.email.trim(), form.password)
          : await registerUser({
              name: form.name.trim(),
              email: form.email.trim(),
              password: form.password,
              phone: form.phone.trim(),
              city: form.city.trim(),
            })

      if (mode === 'register') {
        logout()
        const qs = next
          ? `?next=${encodeURIComponent(next)}`
          : `?email=${encodeURIComponent(form.email.trim())}`
        window.location.href = `/login${qs}`
        return
      }

      window.location.href = next ?? (user.role === 'admin' ? '/admin' : '/perfil')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos completar la operación')
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-[0_32px_80px_rgba(0,0,0,0.3)]">
      <div className="mb-6 text-center">
        <img
          src="/images/logo.png"
          alt="Santiago Beracochea"
          className="mx-auto mb-3 h-16 w-16 rounded-2xl"
        />
        <p className="text-[11px] font-bold tracking-[0.2em] text-sb-gold uppercase">
          Santiago Beracochea · Distribuidora
        </p>
      </div>

      <h1 className="font-display text-[28px] leading-tight font-bold text-sb-blue-deeper">
        {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
      </h1>
      <p className="mt-1.5 mb-7 text-sm text-sb-muted">
        {mode === 'login'
          ? 'Ingresá para realizar tus pedidos'
          : 'Registrate para hacer pedidos online'}
      </p>

      {notice && (
        <p className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-700">
          {notice}
        </p>
      )}

      <form onSubmit={submit} className="flex flex-col gap-4">
        {mode === 'register' && (
          <div>
            <label htmlFor="auth-name" className="mb-1.5 block text-xs font-semibold text-slate-700">
              Nombre completo
            </label>
            <input
              id="auth-name"
              className={inputClass}
              value={form.name}
              onChange={(event) => update('name', event.target.value)}
              placeholder="Tu nombre"
              required
            />
          </div>
        )}

        <div>
          <label htmlFor="auth-email" className="mb-1.5 block text-xs font-semibold text-slate-700">
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            className={inputClass}
            value={form.email}
            onChange={(event) => update('email', event.target.value)}
            placeholder="tu@email.com"
            required
          />
        </div>

        {mode === 'register' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="auth-phone"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Teléfono
              </label>
              <input
                id="auth-phone"
                className={inputClass}
                value={form.phone}
                onChange={(event) => update('phone', event.target.value)}
                placeholder="099 123 456"
              />
            </div>
            <div>
              <label
                htmlFor="auth-city"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Ciudad
              </label>
              <input
                id="auth-city"
                className={inputClass}
                value={form.city}
                onChange={(event) => update('city', event.target.value)}
                placeholder="Minas"
              />
            </div>
          </div>
        )}

        <PasswordInput
          id="auth-password"
          label="Contraseña"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          value={form.password}
          onChange={(value) => update('password', value)}
          visible={showPassword}
          onToggle={() => setShowPassword((prev) => !prev)}
        />

        {mode === 'register' && (
          <PasswordInput
            id="auth-confirm-password"
            label="Confirmar contraseña"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(value) => update('confirmPassword', value)}
            visible={showConfirm}
            onToggle={() => setShowConfirm((prev) => !prev)}
          />
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-sb-blue py-3.5 text-sm font-semibold text-white transition hover:bg-sb-blue-dark disabled:bg-slate-300"
        >
          {loading
            ? 'Un momento...'
            : mode === 'login'
              ? 'Ingresar'
              : 'Crear cuenta'}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-slate-400">
        {mode === 'login' ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}{' '}
        <a
          href={mode === 'login' ? registerHref(next ?? undefined) : loginHref(next ?? undefined)}
          className="font-semibold text-sb-blue hover:underline"
        >
          {mode === 'login' ? 'Registrate' : 'Iniciá sesión'}
        </a>
      </p>
    </div>
  )
}
