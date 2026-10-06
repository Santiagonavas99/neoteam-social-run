'use client'

import { ArrowLeft, ArrowUpRight, KeyRound, LoaderCircle, LogIn, LogOut } from 'lucide-react'
import Link from 'next/link'
import { type FormEvent, useCallback, useEffect, useState } from 'react'
import type { HomeFeatureCard } from '@/features/home/data'
import { AdminManagement } from './admin-management'
import type { AdminResponse, AdminSection } from './admin-types'
import { Feedback, sectionIcons } from './admin-ui'
import { LogoCarouselAdmin } from './logo-carousel-admin'

const ADMIN_SESSION_KEY = 'neoteam_admin_pin_session'

async function callAdminApi(action: string, payload: Record<string, unknown> = {}) {
  const connectionError = 'No pudimos conectar con el panel administrativo. Inténtalo de nuevo.'
  const json = JSON.stringify({ action, ...payload })
  const compressed = action === 'uploadAdminImage'
  const body = compressed
    ? await new Response(
        new Blob([json]).stream().pipeThrough(new CompressionStream('gzip')),
      ).blob()
    : json
  const response = await fetch('/api/admin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(compressed ? { 'Content-Encoding': 'gzip' } : {}),
    },
    body,
  }).catch(() => {
    throw new Error(connectionError)
  })

  const data = (await response.json().catch(() => {
    throw new Error(connectionError)
  })) as AdminResponse
  if (!response.ok) throw new Error(data.error || 'No pudimos completar la operación.')
  return data
}

function normalizePin(value: string) {
  return value.replace(/\D/g, '').slice(0, 6)
}

export function AdminDashboard() {
  const [authReady, setAuthReady] = useState(false)
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [setupSecretReady, setSetupSecretReady] = useState<boolean | null>(null)
  const [authenticated, setAuthenticated] = useState(false)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [setupSecret, setSetupSecret] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmNewPin, setConfirmNewPin] = useState('')
  const [currentPin, setCurrentPin] = useState('')
  const [cards, setCards] = useState<HomeFeatureCard[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const loadCards = useCallback(async (token: string) => {
    const data = await callAdminApi('listCards', { token })
    setCards((data.cards ?? []) as HomeFeatureCard[])
  }, [])
  const [section, setSection] = useState<AdminSection>('metrics')
  const [messageKind, setMessageKind] = useState<'success' | 'error'>('error')

  useEffect(() => {
    let active = true

    async function bootstrap() {
      try {
        const status = await callAdminApi('status')
        if (!active) return
        setConfigured(Boolean(status.configured))
        setSetupSecretReady(status.setupSecretReady ?? null)

        const storedToken = window.localStorage.getItem(ADMIN_SESSION_KEY)
        if (!storedToken) return

        const validation = await callAdminApi('validate', { token: storedToken })
        if (!active) return

        if (validation.valid) {
          setSessionToken(storedToken)
          setAuthenticated(true)
          await loadCards(storedToken)
        } else {
          window.localStorage.removeItem(ADMIN_SESSION_KEY)
        }
      } catch (error) {
        if (active)
          setMessage(
            error instanceof Error ? error.message : 'No pudimos cargar el acceso administrativo.',
          )
      } finally {
        if (active) setAuthReady(true)
      }
    }

    void bootstrap()
    return () => {
      active = false
    }
  }, [loadCards])

  function rememberSession(token: string) {
    window.localStorage.setItem(ADMIN_SESSION_KEY, token)
    setSessionToken(token)
    setAuthenticated(true)
  }

  async function setupPin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setMessageKind('error')

    if (pin.length !== 6) {
      setMessage('El PIN debe tener exactamente 6 dígitos.')
      return
    }
    if (pin !== confirmPin) {
      setMessage('Los dos PIN no coinciden.')
      return
    }

    setBusy(true)
    try {
      const data = await callAdminApi('setup', { pin, setupSecret })
      if (!data.token) throw new Error('No pudimos crear la sesión administrativa.')
      rememberSession(data.token)
      setConfigured(true)
      setPin('')
      setConfirmPin('')
      setSetupSecret('')
      await loadCards(data.token)
      setMessageKind('success')
      setMessage('PIN configurado. Ya tienes acceso al panel.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No pudimos configurar el PIN.')
    } finally {
      setBusy(false)
    }
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setMessageKind('error')

    if (pin.length !== 6) {
      setMessage('Escribe tu PIN de 6 dígitos.')
      return
    }

    setBusy(true)
    try {
      const data = await callAdminApi('login', { pin })
      if (!data.token) throw new Error('No pudimos crear la sesión administrativa.')
      rememberSession(data.token)
      setPin('')
      await loadCards(data.token)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No pudimos iniciar sesión.')
    } finally {
      setBusy(false)
    }
  }

  function updateCard(
    id: string | undefined,
    field: keyof HomeFeatureCard,
    value: string | number | boolean,
  ) {
    setCards((current) =>
      current.map((card) => (card.id === id ? { ...card, [field]: value } : card)),
    )
  }

  async function saveCards() {
    if (!sessionToken) return
    setBusy(true)
    setMessage('')
    setMessageKind('error')

    try {
      await callAdminApi('saveCards', { token: sessionToken, cards })
      setCards((current) => [...current].sort((a, b) => a.sort_order - b.sort_order))
      setMessageKind('success')
      setMessage('Cambios guardados. La home ya está usando esta configuración.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudieron guardar los cambios.')
    } finally {
      setBusy(false)
    }
  }

  async function changePin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!sessionToken) return
    setMessage('')
    setMessageKind('error')

    if (newPin.length !== 6) {
      setMessage('El nuevo PIN debe tener exactamente 6 dígitos.')
      return
    }
    if (newPin !== confirmNewPin) {
      setMessage('Los dos PIN nuevos no coinciden.')
      return
    }

    setBusy(true)
    try {
      if (currentPin.length !== 6) {
        setMessage('Escribe tu PIN actual de 6 dígitos.')
        return
      }
      const data = await callAdminApi('changePin', { token: sessionToken, currentPin, newPin })
      if (!data.token) throw new Error('El PIN cambió, pero no pudimos renovar la sesión.')
      rememberSession(data.token)
      setNewPin('')
      setConfirmNewPin('')
      setCurrentPin('')
      setMessageKind('success')
      setMessage('PIN actualizado. Las demás sesiones fueron cerradas.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No pudimos actualizar el PIN.')
    } finally {
      setBusy(false)
    }
  }

  async function signOut() {
    const token = sessionToken
    window.localStorage.removeItem(ADMIN_SESSION_KEY)
    setSessionToken(null)
    setAuthenticated(false)
    setCards([])
    setMessage('')
    setMessageKind('error')
    setPin('')

    if (token) {
      try {
        await callAdminApi('logout', { token })
      } catch {
        // La sesión local ya quedó cerrada aunque falle la revocación remota.
      }
    }
  }

  type NavigationItem = { id: AdminSection; label: string; description: string }
  const navigation: [NavigationItem, ...NavigationItem[]] = [
    { id: 'metrics', label: 'Overview', description: 'El pulso del Social Run, en un vistazo.' },
    {
      id: 'logos',
      label: 'Carrusel logos',
      description: 'Sube, ordena y publica los logos de la cinta horizontal de la Home.',
    },
    {
      id: 'participants',
      label: 'Participantes',
      description: 'Encuentra a cada corredor y gestiona su asistencia.',
    },
    { id: 'groups', label: 'Grupos', description: 'Las comunidades que corren con nosotros.' },
    { id: 'brands', label: 'Marcas', description: 'Los aliados que hacen parte del encuentro.' },
    { id: 'raffles', label: 'Rifas', description: 'Prepara los premios y gestiona cada sorteo.' },
    {
      id: 'security',
      label: 'Seguridad',
      description: 'Administra el acceso al panel del evento.',
    },
  ]
  function navigate(next: AdminSection) {
    setSection(next)
    setMessage('')
  }
  const feedback = message ? { kind: messageKind, text: message } : null
  const current = navigation.find((item) => item.id === section) ?? navigation[0]

  if (!authReady || !authenticated)
    return (
      <main className="admin-auth">
        <Link href="/" className="brand">
          <span className="brand-mark">N</span>NEOTEAM
        </Link>
        <section className="auth-card" aria-labelledby="login-title">
          <p className="section-label">SOCIAL RUN · ADMIN</p>
          <h1 id="login-title">Panel del evento</h1>
          {!authReady ? (
            <p className="loading-state flex items-center gap-2" role="status">
              <LoaderCircle aria-hidden className="size-4 shrink-0 motion-safe:animate-spin" />
              Comprobando acceso…
            </p>
          ) : configured === false ? (
            <>
              <p className="muted">
                Primer acceso. Usa tu clave de configuración y elige el PIN con el que entrarás al
                panel.
              </p>
              {setupSecretReady === false && (
                <Feedback
                  value={{
                    kind: 'error',
                    text: 'La configuración inicial aún no está disponible. Falta la clave privada en Supabase.',
                  }}
                />
              )}
              <form onSubmit={setupPin} className="stack-form">
                <label>
                  1. Clave de configuración
                  <input
                    type="password"
                    value={setupSecret}
                    onChange={(e) => setSetupSecret(e.target.value)}
                    autoComplete="off"
                    required
                  />
                  <small>Solo se utiliza en este primer acceso.</small>
                </label>
                <PinField label="2. Crea tu PIN" value={pin} onChange={setPin} />
                <PinField label="3. Confirma tu PIN" value={confirmPin} onChange={setConfirmPin} />
                <Feedback value={feedback} />
                <button
                  type="submit"
                  className="button full-width"
                  disabled={
                    busy ||
                    setupSecretReady === false ||
                    !setupSecret ||
                    pin.length !== 6 ||
                    confirmPin.length !== 6
                  }
                >
                  <LogIn aria-hidden className="size-4 shrink-0" />
                  {busy ? 'Configurando…' : 'Guardar PIN y entrar'}
                </button>
              </form>
            </>
          ) : (
            <>
              <p className="muted">Introduce tu PIN de 6 dígitos para continuar.</p>
              <form onSubmit={login} className="stack-form">
                <PinField label="PIN de acceso" value={pin} onChange={setPin} current autoFocus />
                <Feedback value={feedback} />
                <button
                  type="submit"
                  className="button full-width"
                  disabled={busy || pin.length !== 6}
                >
                  <LogIn aria-hidden className="size-4 shrink-0" />
                  {busy ? 'Entrando…' : 'Entrar'}
                </button>
              </form>
            </>
          )}
        </section>
        <Link href="/" className="text-link">
          <ArrowLeft aria-hidden className="size-4 shrink-0" />
          Volver al evento
        </Link>
      </main>
    )

  return (
    <main className="admin-page">
      <aside className="admin-sidebar">
        <Link href="/" className="brand">
          <span className="brand-mark">N</span>NEOTEAM
        </Link>
        <span className="sidebar-caption">SOCIAL RUN / 2026</span>
        <nav aria-label="Panel del evento">
          {navigation.map((item) => {
            const Icon = sectionIcons[item.id]
            return (
              <button
                type="button"
                key={item.id}
                aria-current={section === item.id ? 'page' : undefined}
                onClick={() => navigate(item.id)}
              >
                <Icon aria-hidden className="size-5 shrink-0" />
                {item.label}
              </button>
            )
          })}
        </nav>
        <button type="button" className="sidebar-signout flex items-center gap-2" onClick={signOut}>
          <LogOut aria-hidden className="size-4 shrink-0" />
          Cerrar sesión
        </button>
      </aside>
      <div className="admin-content">
        <div className="admin-topbar">
          <span>NEOTEAM / PANEL DEL EVENTO</span>
          <Link href="/" target="_blank" className="text-link">
            Ver página
            <ArrowUpRight aria-hidden className="size-4 shrink-0" />
          </Link>
        </div>
        <header className="admin-section-header">
          <div>
            <p className="section-label">SOCIAL RUN · 18 OCT</p>
            <h1>{current.label}</h1>
            <p className="muted">{current.description}</p>
          </div>
        </header>
        {section === 'logos' ? (
          <LogoCarouselAdmin token={sessionToken ?? ''} callApi={callAdminApi} />
        ) : section === 'home' ? (
          <section className="admin-surface">
            <div className="section-toolbar">
              <div>
                <h2>Bloques del carrusel</h2>
                <p className="muted">Los cambios se publican al guardar.</p>
              </div>
              <button
                type="button"
                className="button"
                onClick={saveCards}
                disabled={busy || !cards.length}
              >
                {busy ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
            <Feedback value={feedback} />
            <div className="home-editor-list">
              {cards.map((card, index) => (
                <article className="home-editor" key={card.id ?? card.slot}>
                  <span className="editor-number">{String(index + 1).padStart(2, '0')}</span>
                  <div className="home-editor-fields">
                    <label>
                      Título
                      <input
                        value={card.title}
                        onChange={(e) => updateCard(card.id, 'title', e.target.value)}
                      />
                    </label>
                    <label>
                      Descripción
                      <textarea
                        rows={2}
                        value={card.description}
                        onChange={(e) => updateCard(card.id, 'description', e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="home-editor-options">
                    <label>
                      Orden
                      <input
                        type="number"
                        min="0"
                        value={card.sort_order}
                        onChange={(e) => updateCard(card.id, 'sort_order', Number(e.target.value))}
                      />
                    </label>
                    <label className="check-label">
                      <input
                        type="checkbox"
                        checked={card.enabled}
                        onChange={(e) => updateCard(card.id, 'enabled', e.target.checked)}
                      />
                      Visible
                    </label>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : section === 'security' ? (
          <section className="admin-surface security-card">
            <h2 className="flex items-center gap-2">
              <KeyRound aria-hidden className="size-5 shrink-0" />
              Cambiar PIN
            </h2>
            <p className="muted">
              Al actualizarlo, se cerrarán las demás sesiones. Esta sesión seguirá activa.
            </p>
            <form onSubmit={changePin} className="stack-form">
              <PinField label="PIN actual" value={currentPin} onChange={setCurrentPin} current />
              <PinField label="Nuevo PIN" value={newPin} onChange={setNewPin} />
              <PinField
                label="Confirmar nuevo PIN"
                value={confirmNewPin}
                onChange={setConfirmNewPin}
              />
              <Feedback value={feedback} />
              <button
                type="submit"
                className="button"
                disabled={
                  busy ||
                  currentPin.length !== 6 ||
                  newPin.length !== 6 ||
                  confirmNewPin.length !== 6
                }
              >
                <KeyRound aria-hidden className="size-4 shrink-0" />
                {busy ? 'Actualizando…' : 'Actualizar PIN'}
              </button>
            </form>
          </section>
        ) : (
          <AdminManagement
            key={section}
            section={section}
            token={sessionToken ?? ''}
            callApi={callAdminApi}
            navigate={navigate}
          />
        )}
      </div>
    </main>
  )
}

function PinField({
  label,
  value,
  onChange,
  current = false,
  autoFocus = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  current?: boolean
  autoFocus?: boolean
}) {
  return (
    <label>
      {label}
      <input
        className="pin-input"
        type="password"
        value={value}
        onChange={(e) => onChange(normalizePin(e.target.value))}
        inputMode="numeric"
        autoComplete={current ? 'current-password' : 'new-password'}
        placeholder="••••••"
        minLength={6}
        maxLength={6}
        pattern="[0-9]{6}"
        required
        autoFocus={autoFocus}
      />
    </label>
  )
}
