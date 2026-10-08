'use client'

import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import Link from 'next/link'
import type { FormEvent, ReactNode } from 'react'
import { useActionState, useEffect, useRef, useState } from 'react'
import { type RegistrationState, registerParticipant } from './actions'
import { CalendarButton } from './calendar-button'
import {
  CheckboxField,
  cardClass,
  Eyebrow,
  FormMessage,
  linkClass,
  SelectField,
  SubmitButton,
  TextField,
} from './form-ui'
import { PassCard } from './pass-card'
import { RUNNING_GROUP_OPTIONS } from './running-groups'
import { Streamers } from './streamers'

const initialState: RegistrationState = { ok: false, message: '' }

export function SuccessCard({
  eyebrow,
  title,
  icon,
  children,
}: {
  eyebrow: string
  title: string
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <section className={cardClass} aria-live="polite">
      {icon}
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="my-5 text-[clamp(36px,5vw,64px)] leading-none font-bold tracking-[-0.06em] uppercase">
        {title}
      </h2>
      {children}
    </section>
  )
}

const registrationSteps = [
  {
    number: 1,
    label: 'Tus datos',
    title: 'Primero, hablemos de ti.',
    hint: 'Estos datos nos ayudan a identificar tu inscripción.',
  },
  {
    number: 2,
    label: 'Tu comunidad',
    title: '¿Con quién vas a correr?',
    hint: 'Ven con tu crew o por tu cuenta. Todos son bienvenidos.',
  },
  {
    number: 3,
    label: 'Confirmación',
    title: 'Ya casi estás dentro.',
    hint: 'Un contacto para emergencias y tus autorizaciones.',
  },
] as const

function stepForError(name: string): number {
  if (
    [
      'fullName',
      'firstName',
      'lastName',
      'documentType',
      'documentNumber',
      'email',
      'phone',
      'birthDate',
      'gender',
    ].includes(name)
  ) {
    return 1
  }
  if (name === 'runningGroup' || name === 'otherRunningGroup') return 2
  return 3
}

export function RegistrationForm() {
  const [state, formAction, pending] = useActionState(registerParticipant, initialState)
  const [step, setStep] = useState(1)
  // No crew is assumed: selecting NeoTeam by default caused accidental affiliations.
  const [runningGroup, setRunningGroup] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const values = state.values
  const errors = state.errors

  useEffect(() => {
    if (!state.attempt || state.ok) return
    setRunningGroup(state.values?.runningGroup ?? '')
    const firstFieldWithError = Object.keys(state.errors ?? {})[0]
    setStep(firstFieldWithError ? stepForError(firstFieldWithError) : 3)
  }, [state.attempt, state.ok, state.errors, state.values])

  function goToStep(next: number) {
    setStep(next)
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      })
      const heading = formRef.current?.querySelector<HTMLElement>(`#registration-step-${next}`)
      heading?.focus({ preventScroll: true })
    })
  }

  function validStep(number: number) {
    const panel = formRef.current?.querySelector<HTMLElement>(
      `[data-registration-step="${number}"]`,
    )
    const controls = panel?.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select')
    const firstInvalid = Array.from(controls ?? []).find((control) => !control.checkValidity())
    if (!firstInvalid) return true
    firstInvalid.focus()
    firstInvalid.reportValidity()
    return false
  }

  function continueToNext() {
    if (!validStep(step)) return
    goToStep(Math.min(3, step + 1))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Explicit validation prevents browsers from trying to focus a required field
    // inside a hidden wizard panel, while the server remains the final authority.
    for (let number = 1; number <= 3; number += 1) {
      const panel = formRef.current?.querySelector<HTMLElement>(
        `[data-registration-step="${number}"]`,
      )
      const controls = panel?.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
        'input, select',
      )
      if (Array.from(controls ?? []).some((control) => !control.checkValidity())) {
        event.preventDefault()
        if (number === step) {
          validStep(number)
        } else {
          goToStep(number)
        }
        return
      }
    }
  }

  if (state.ok) {
    return (
      <SuccessCard
        eyebrow="Registro confirmado"
        title="Estás dentro."
        icon={
          <span className="mb-8 grid size-12 place-items-center rounded-lg bg-neo-accent-dark text-neo-white">
            <Check aria-hidden className="size-6" />
          </span>
        }
      >
        <Streamers />
        <p className="m-0">Nos vemos el 18 de octubre en el Social Run del aniversario NeoTeam.</p>
        {state.pass ? (
          <>
            {state.pass.emailed && (
              <p className="m-0 mt-2 text-sm text-neo-text-secondary">
                También te lo enviamos a tu correo.
              </p>
            )}
            <PassCard pass={state.pass} />
          </>
        ) : (
          <>
            {state.calendarUrl ? (
              <div className="mt-6">
                <CalendarButton href={state.calendarUrl} />
              </div>
            ) : null}
            <p className="mt-7 mb-3 border border-dashed border-neo-accent bg-neo-bg p-5 text-[28px] font-bold tracking-wide break-all">
              {state.code}
            </p>
            <p className="m-0 text-sm text-neo-text-secondary">
              Guarda este código. Tu QR de check-in estará en{' '}
              <Link href="/pase" className={linkClass}>
                Mi pase
              </Link>
            </p>
          </>
        )}
      </SuccessCard>
    )
  }

  return (
    // React resets the form after a server action. Remount with submitted values on retry.
    <form
      key={state.attempt}
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      noValidate
      className={`${cardClass} scroll-mt-6`}
    >
      <div className="flex items-center justify-between gap-4">
        <Eyebrow>INSCRIPCIÓN GRATUITA</Eyebrow>
        <span className="text-xs font-semibold tabular-nums text-neo-text-secondary">
          Paso {step} de 3
        </span>
      </div>

      <ol
        aria-label="Progreso de inscripción"
        className="m-0 mt-6 grid list-none grid-cols-3 gap-3 p-0 sm:gap-4"
      >
        {registrationSteps.map(({ number, label }) => (
          <li key={number} aria-current={step === number ? 'step' : undefined} className="min-w-0">
            <span
              aria-hidden
              className={
                'block h-1.5 w-full rounded-full ' +
                (number <= step ? 'bg-neo-accent-text' : 'bg-neo-border')
              }
            />
            <div
              className={
                'mt-3 min-w-0 ' +
                (number === step ? 'font-bold text-neo-text' : 'text-neo-text-secondary')
              }
            >
              <span className="block text-[11px] leading-snug sm:hidden">
                {number === 1 ? 'Datos' : number === 2 ? 'Crew' : 'Confirmar'}
              </span>
              <span className="hidden text-xs leading-snug sm:block">{label}</span>
            </div>
          </li>
        ))}
      </ol>

      {registrationSteps.map(({ number, title, hint }) => (
        <section
          key={number}
          data-registration-step={number}
          hidden={step !== number}
          className="mt-6"
          aria-labelledby={`registration-step-${number}`}
        >
          <div className="mb-6 border-b border-neo-border pb-5">
            <h2
              id={`registration-step-${number}`}
              tabIndex={-1}
              className="mb-2 mt-0 text-[clamp(24px,4vw,34px)] font-bold leading-tight tracking-[-0.045em]"
            >
              {title}
            </h2>
            <p className="m-0 text-sm text-neo-text-secondary">{hint}</p>
          </div>

          {number === 1 && (
            <div className="grid gap-5">
              <TextField
                name="fullName"
                label="Nombre completo"
                placeholder="Nombres y apellidos como aparecen en tu documento"
                defaultValue={
                  values?.fullName ??
                  [values?.firstName, values?.lastName].filter(Boolean).join(' ')
                }
                required
                autoComplete="name"
                pattern=".*\\S+\\s+\\S+.*"
                title="Escribe al menos un nombre y un apellido."
                errors={errors?.fullName ?? errors?.firstName ?? errors?.lastName}
              />
              <div className="grid grid-cols-[100px_minmax(0,1fr)] gap-5">
                <SelectField
                  name="documentType"
                  label="Tipo"
                  defaultValue={values?.documentType ?? 'CC'}
                  errors={errors?.documentType}
                >
                  <option value="CC">CC</option>
                  <option value="CE">CE</option>
                  <option value="TI">TI</option>
                  <option value="PA">Pasaporte</option>
                  <option value="PPT">PPT</option>
                  <option value="OTRO">Otro</option>
                </SelectField>
                <TextField
                  name="documentNumber"
                  label="Documento"
                  defaultValue={values?.documentNumber}
                  required
                  inputMode="numeric"
                  autoComplete="off"
                  errors={errors?.documentNumber}
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  name="email"
                  label="Correo"
                  type="email"
                  defaultValue={values?.email}
                  required
                  autoComplete="email"
                  errors={errors?.email}
                />
                <TextField
                  name="phone"
                  label="WhatsApp"
                  type="tel"
                  inputMode="numeric"
                  enterKeyHint="next"
                  defaultValue={values?.phone}
                  required
                  autoComplete="tel"
                  errors={errors?.phone}
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  name="birthDate"
                  label="Fecha de nacimiento"
                  type="date"
                  defaultValue={values?.birthDate}
                  required
                  autoComplete="bday"
                  errors={errors?.birthDate}
                />
                <SelectField
                  name="gender"
                  label="Género de nacimiento"
                  defaultValue={values?.gender ?? ''}
                  required
                  errors={errors?.gender}
                >
                  <option value="" disabled>
                    Selecciona
                  </option>
                  <option value="female">Mujer</option>
                  <option value="male">Hombre</option>
                </SelectField>
              </div>
            </div>
          )}

          {number === 2 && (
            <div className="grid gap-5">
              <div className="rounded-control border border-neo-accent-border bg-neo-accent-soft px-4 py-4">
                <p className="m-0 text-sm font-semibold text-neo-text">
                  No necesitas pertenecer a NeoTeam ni a otro grupo para participar.
                </p>
                <p className="m-0 mt-1 text-[13px] leading-normal text-neo-text-secondary">
                  Solo queremos saber con qué crew vas a asistir. Si corres por tu cuenta,
                  selecciona “Voy por mi cuenta”.
                </p>
              </div>
              <SelectField
                name="runningGroup"
                label="¿Con qué running crew participarás?"
                value={runningGroup}
                onChange={(event) => setRunningGroup(event.target.value)}
                required
                errors={errors?.runningGroup}
              >
                <option value="" disabled>
                  Selecciona tu opción
                </option>
                {RUNNING_GROUP_OPTIONS.map((group) => (
                  <option key={group.value} value={group.value}>
                    {group.label}
                  </option>
                ))}
                <option value="independiente">Voy por mi cuenta (sin crew)</option>
                <option value="otro">Mi crew no aparece en la lista</option>
              </SelectField>
              {runningGroup === 'otro' && (
                <TextField
                  name="otherRunningGroup"
                  label="¿Cómo se llama tu running crew?"
                  defaultValue={values?.otherRunningGroup}
                  required
                  placeholder="Escribe el nombre de tu grupo"
                  errors={errors?.otherRunningGroup}
                />
              )}
              <p className="m-0 text-xs leading-normal text-neo-text-secondary">
                Esta información solo nos ayuda a organizar a los crews invitados. Tu registro es
                individual y gratuito.
              </p>
            </div>
          )}

          {number === 3 && (
            <>
              <div className="mb-5 grid gap-5 sm:grid-cols-2">
                <TextField
                  name="emergencyName"
                  label="Nombre del contacto de emergencia"
                  defaultValue={values?.emergencyName}
                  required
                  autoComplete="off"
                  errors={errors?.emergencyName}
                />
                <TextField
                  name="emergencyPhone"
                  label="Celular de emergencia"
                  type="tel"
                  inputMode="numeric"
                  enterKeyHint="done"
                  defaultValue={values?.emergencyPhone}
                  required
                  autoComplete="off"
                  errors={errors?.emergencyPhone}
                />
              </div>
              <div className="border-t border-neo-border pt-3">
                <CheckboxField
                  name="termsAccepted"
                  defaultChecked={values?.termsAccepted === 'on'}
                  required
                  errors={errors?.termsAccepted}
                >
                  Declaro que participaré bajo mi propia responsabilidad y acepto las condiciones
                  del evento.
                </CheckboxField>
                <CheckboxField
                  name="privacyAccepted"
                  defaultChecked={values?.privacyAccepted === 'on'}
                  required
                  errors={errors?.privacyAccepted}
                >
                  Acepto el tratamiento de mis datos para gestionar mi participación en Social Run
                  NeoTeam.
                </CheckboxField>
                <CheckboxField
                  name="marketingAccepted"
                  defaultChecked={values?.marketingAccepted === 'on'}
                  muted
                >
                  Quiero recibir novedades de próximos eventos de NeoTeam. (Opcional)
                </CheckboxField>
              </div>
            </>
          )}
        </section>
      ))}

      {state.message && <FormMessage>{state.message}</FormMessage>}

      <div className="mt-7 grid gap-3 border-t border-neo-border pt-6 sm:grid-cols-2 sm:items-center">
        {step > 1 ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => goToStep(step - 1)}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control border border-neo-border bg-neo-surface px-5 py-3 text-sm font-bold text-neo-text transition-colors hover:bg-neo-muted-bg"
          >
            <ArrowLeft aria-hidden className="size-4" />
            Volver
          </button>
        ) : (
          <p className="m-0 text-xs text-neo-text-secondary">
            Tus datos se enviarán al confirmar el último paso.
          </p>
        )}
        {step < 3 ? (
          <button
            type="button"
            disabled={pending}
            onClick={continueToNext}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-neo-accent px-5 py-3 text-sm font-bold text-neo-black transition-colors hover:bg-neo-accent-hover"
          >
            Continuar
            <ArrowRight aria-hidden className="size-4" />
          </button>
        ) : (
          <div className="[&>button]:mt-0">
            <SubmitButton pending={pending} idle="Confirmar mi registro" busy="Registrando…" />
          </div>
        )}
      </div>
    </form>
  )
}
