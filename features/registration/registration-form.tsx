'use client'

import { ArrowLeft, ArrowRight, Check, UsersRound } from 'lucide-react'
import Link from 'next/link'
import type { FormEvent, ReactNode } from 'react'
import { useActionState, useEffect, useRef, useState } from 'react'
import { type RegistrationState, registerParticipant } from './actions'
import { CalendarButton } from './calendar-button'
import { CommunityConnect } from './community-connect'
import {
  CheckboxField,
  cardClass,
  Eyebrow,
  FieldError,
  FormMessage,
  linkClass,
  SelectField,
  SubmitButton,
  TextField,
} from './form-ui'
import { splitFullName } from './full-name'
import { PassCard } from './pass-card'
import motion from './registration-motion.module.css'
import { RUNNING_GROUP_OPTIONS } from './running-groups'
import { Streamers } from './streamers'
import {
  isAllowedBirthDate,
  isEmailDomainValid,
  isNumericDocumentType,
  isValidDocumentNumber,
  MIN_BIRTH_DATE,
  maxBirthDate,
  normalizeColombianPhone,
} from './validation'

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

function controlError(
  control: HTMLInputElement | HTMLSelectElement,
  documentType: string,
): string | null {
  control.setCustomValidity('')
  const value = control.value.trim()
  if (control.name === 'fullName' && value && !splitFullName(value)) {
    control.setCustomValidity('Escribe tu nombre y al menos un apellido.')
  }
  if (control.name === 'documentNumber' && value && !isValidDocumentNumber(value, documentType)) {
    control.setCustomValidity(
      isNumericDocumentType(documentType)
        ? 'Escribe entre 5 y 30 dígitos, sin letras.'
        : 'Escribe entre 5 y 30 letras o números, sin espacios.',
    )
  }
  if (control.name === 'email' && value && !isEmailDomainValid(value)) {
    control.setCustomValidity('Revisa el dominio del correo (ejemplo: nombre@dominio.com).')
  }
  if (control.name === 'birthDate' && value && !isAllowedBirthDate(value)) {
    control.setCustomValidity('Selecciona una fecha real entre 1900 y hoy.')
  }
  if (
    (control.name === 'phone' || control.name === 'emergencyPhone') &&
    value &&
    !/^\d{10}$/.test(normalizeColombianPhone(value))
  ) {
    control.setCustomValidity('Escribe un teléfono de 10 dígitos.')
  }
  if (control.checkValidity()) return null
  if (control.validity.valueMissing) return 'Completa este campo antes de continuar.'
  if (control.validity.typeMismatch) return 'Escribe un correo válido.'
  return control.validationMessage || 'Revisa este dato.'
}

export function RegistrationForm() {
  const [state, formAction, pending] = useActionState(registerParticipant, initialState)
  const [step, setStep] = useState(1)
  const [flow, setFlow] = useState<'forward' | 'back'>('forward')
  // No crew is assumed: selecting NeoTeam by default caused accidental affiliations.
  const [runningGroup, setRunningGroup] = useState('')
  const [participationMode, setParticipationMode] = useState<'solo' | 'crew' | ''>('')
  const [documentType, setDocumentType] = useState('CC')
  const [clientErrors, setClientErrors] = useState<Record<string, string[]>>({})
  const [editedSinceResponse, setEditedSinceResponse] = useState<string[]>([])
  const formRef = useRef<HTMLFormElement>(null)
  const values = state.values
  const errors = state.errors
  const fieldErrors = (name: string) =>
    clientErrors[name] ?? (editedSinceResponse.includes(name) ? undefined : errors?.[name])

  function clearFieldError(name: string) {
    setClientErrors((current) => {
      if (!(name in current)) return current
      const next = { ...current }
      delete next[name]
      return next
    })
    setEditedSinceResponse((current) => (current.includes(name) ? current : [...current, name]))
  }

  function chooseParticipation(mode: 'solo' | 'crew') {
    setParticipationMode(mode)
    if (mode === 'solo') setRunningGroup('independiente')
    else if (runningGroup === 'independiente') setRunningGroup('')
    clearFieldError('runningGroup')
  }

  useEffect(() => {
    if (!state.attempt || state.ok) return
    const selectedGroup = state.values?.runningGroup ?? ''
    setRunningGroup(selectedGroup)
    setParticipationMode(selectedGroup === 'independiente' ? 'solo' : selectedGroup ? 'crew' : '')
    setDocumentType(state.values?.documentType ?? 'CC')
    setClientErrors({})
    setEditedSinceResponse([])
    const firstFieldWithError = Object.keys(state.errors ?? {})[0]
    setStep(firstFieldWithError ? stepForError(firstFieldWithError) : 3)
  }, [state.attempt, state.ok, state.errors, state.values])

  function goToStep(next: number) {
    setFlow(next < step ? 'back' : 'forward')
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

  function validStep(number: number, focus = number === step) {
    const panel = formRef.current?.querySelector<HTMLElement>(
      `[data-registration-step="${number}"]`,
    )
    const controls = panel?.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select')
    const nextErrors: Record<string, string[]> = {}
    if (number === 2 && !participationMode) {
      nextErrors.runningGroup = ['Elige si vienes por tu cuenta o con un running crew.']
    }
    let firstInvalid: HTMLInputElement | HTMLSelectElement | undefined
    for (const control of Array.from(controls ?? [])) {
      const message = controlError(control, documentType)
      if (message) {
        nextErrors[control.name] = [message]
        if (!firstInvalid) firstInvalid = control
      }
    }
    setClientErrors((current) => ({
      ...Object.fromEntries(
        Object.entries(current).filter(([name]) => stepForError(name) !== number),
      ),
      ...nextErrors,
    }))
    if (focus) {
      if (firstInvalid) {
        firstInvalid.focus()
        firstInvalid.reportValidity()
      } else if (nextErrors.runningGroup) {
        panel?.querySelector<HTMLButtonElement>('[data-participation-choice]')?.focus()
      }
    }
    return Object.keys(nextErrors).length === 0
  }

  function continueToNext() {
    if (!validStep(step)) return
    goToStep(Math.min(3, step + 1))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    for (let number = 1; number <= 3; number += 1) {
      if (!validStep(number, number === step)) {
        event.preventDefault()
        if (number !== step) goToStep(number)
        return
      }
    }
  }

  if (state.ok) {
    return (
      <div className="min-w-0">
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
          <p className="m-0">
            Nos vemos el 18 de octubre en el Social Run del aniversario NeoTeam.
          </p>
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
        {state.pass && <CommunityConnect />}
      </div>
    )
  }

  return (
    // React resets the form after a server action. Remount with submitted values on retry.
    <form
      key={state.attempt}
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      onInputCapture={(event) => {
        const target = event.target
        if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) {
          if (target.name) clearFieldError(target.name)
        }
      }}
      noValidate
      className={`${cardClass} ${motion.form} scroll-mt-6`}
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
                number <= step
                  ? `${motion.progressBar} ${motion.progressBarFilled}`
                  : motion.progressBar
              }
            />
            <div
              className={
                number === step
                  ? `mt-3 min-w-0 font-bold text-neo-text ${motion.progressLabel} ${motion.progressLabelCurrent}`
                  : `mt-3 min-w-0 text-neo-text-secondary ${motion.progressLabel}`
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
          className={`mt-6 ${motion.panel}`}
          data-flow={flow}
          aria-labelledby={`registration-step-${number}`}
        >
          <div className={`mb-6 border-b border-neo-border pb-5 ${motion.panelIntro}`}>
            <h2
              id={`registration-step-${number}`}
              tabIndex={-1}
              className="mb-2 mt-0 text-[clamp(24px,4vw,34px)] font-bold leading-tight tracking-[-0.045em]"
            >
              {title}
            </h2>
            <p className="m-0 text-sm text-neo-text-secondary">{hint}</p>
          </div>
          {number === step &&
            (Object.keys(clientErrors).some((name) => stepForError(name) === number) ||
              Object.keys(errors ?? {}).some(
                (name) => stepForError(name) === number && !editedSinceResponse.includes(name),
              )) && <FormMessage>Revisa los campos marcados para continuar.</FormMessage>}
          {number === step && state.message && !Object.keys(errors ?? {}).length && (
            <FormMessage>{state.message}</FormMessage>
          )}

          {number === 1 && (
            <div className={`grid gap-5 ${motion.stepFields}`}>
              <TextField
                name="fullName"
                label="Nombre completo"
                defaultValue={
                  values?.fullName ??
                  [values?.firstName, values?.lastName].filter(Boolean).join(' ')
                }
                required
                autoComplete="name"
                onInput={(event) => event.currentTarget.setCustomValidity('')}
                errors={
                    fieldErrors('fullName') ?? fieldErrors('firstName') ?? fieldErrors('lastName')
                  }
              />
              <div className="grid grid-cols-[100px_minmax(0,1fr)] gap-5">
                <SelectField
                  name="documentType"
                  label="Tipo"
                  value={documentType}
                  onChange={(event) => {
                    setDocumentType(event.target.value)
                    clearFieldError('documentNumber')
                  }}
                  errors={fieldErrors('documentType')}
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
                  inputMode={isNumericDocumentType(documentType) ? 'numeric' : 'text'}
                  maxLength={30}
                  autoComplete="off"
                  placeholder={
                    isNumericDocumentType(documentType) ? 'Solo números' : 'Número de documento'
                  }
                  onInput={(event) => {
                    if (isNumericDocumentType(documentType)) {
                      event.currentTarget.value = event.currentTarget.value.replace(/\D/g, '')
                    }
                  }}
                  errors={fieldErrors('documentNumber')}
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
                  errors={fieldErrors('email')}
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
                  errors={fieldErrors('phone')}
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
                  min={MIN_BIRTH_DATE}
                  max={maxBirthDate()}
                  errors={fieldErrors('birthDate')}
                />
                <SelectField
                  name="gender"
                  label="Género de nacimiento"
                  defaultValue={values?.gender ?? ''}
                  required
                  errors={fieldErrors('gender')}
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
            <div className={`grid gap-5 ${motion.stepFields}`}>
              <fieldset className="m-0 min-w-0 border-0 p-0">
                <legend className="mb-3 text-sm font-semibold text-neo-text">
                  ¿Cómo quieres participar?
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    data-participation-choice
                    aria-pressed={participationMode === 'solo'}
                    onClick={() => chooseParticipation('solo')}
                    className={
                      'flex min-h-24 w-full flex-col items-start justify-center gap-1 rounded-control border p-4 text-left transition-colors ' +
                      (participationMode === 'solo'
                        ? 'border-neo-accent-text bg-neo-muted-bg'
                        : 'border-neo-border-strong bg-neo-surface hover:bg-neo-muted-bg')
                    }
                  >
                    <span className="text-base font-semibold text-neo-text">Voy por mi cuenta</span>
                    <span className="text-xs leading-relaxed text-neo-text-secondary">
                      No necesitas pertenecer a ningún grupo.
                    </span>
                  </button>
                  <button
                    type="button"
                    data-participation-choice
                    aria-pressed={participationMode === 'crew'}
                    onClick={() => chooseParticipation('crew')}
                    className={
                      'flex min-h-24 w-full flex-col items-start justify-center gap-1 rounded-control border p-4 text-left transition-colors ' +
                      (participationMode === 'crew'
                        ? 'border-neo-accent-text bg-neo-muted-bg'
                        : 'border-neo-border-strong bg-neo-surface hover:bg-neo-muted-bg')
                    }
                  >
                    <span className="flex items-center gap-2 text-base font-semibold text-neo-text">
                      <UsersRound aria-hidden className="size-4" />
                      Voy con mi running crew
                    </span>
                    <span className="text-xs leading-relaxed text-neo-text-secondary">
                      Elige tu grupo o agrega uno nuevo.
                    </span>
                  </button>
                </div>
                {!participationMode && (
                  <FieldError name="runningGroup" errors={fieldErrors('runningGroup')} />
                )}
              </fieldset>
              {participationMode === 'solo' && (
                <>
                  <input type="hidden" name="runningGroup" value="independiente" />
                  <p className="m-0 text-sm text-neo-text-secondary">
                    Perfecto. Puedes correr por tu cuenta y compartir la experiencia con todos.
                  </p>
                </>
              )}
              {participationMode === 'crew' && (
                <>
                  <SelectField
                    name="runningGroup"
                    label="Selecciona tu running crew"
                    value={runningGroup === 'independiente' ? '' : runningGroup}
                    onChange={(event) => {
                      setRunningGroup(event.target.value)
                      clearFieldError('runningGroup')
                    }}
                    required
                    errors={fieldErrors('runningGroup')}
                  >
                    <option value="" disabled>
                      Selecciona un grupo
                    </option>
                    {RUNNING_GROUP_OPTIONS.map((group) => (
                      <option key={group.value} value={group.value}>
                        {group.label}
                      </option>
                    ))}
                    <option value="otro">Mi crew no aparece en la lista</option>
                  </SelectField>
                  {runningGroup === 'otro' && (
                    <TextField
                      name="otherRunningGroup"
                      label="Nombre de tu running crew"
                      defaultValue={values?.otherRunningGroup}
                      maxLength={120}
                      required
                      placeholder="Escribe el nombre de tu grupo"
                      errors={fieldErrors('otherRunningGroup')}
                    />
                  )}
                </>
              )}
              <p className="m-0 text-xs leading-normal text-neo-text-secondary">
                La inscripción es individual, gratuita y abierta a todos los corredores.
              </p>
            </div>
          )}

          {number === 3 && (
            <div className={motion.stepFields}>
              <div className="mb-5 grid gap-5 sm:grid-cols-2">
                <TextField
                  name="emergencyName"
                  label="Nombre del contacto de emergencia"
                  defaultValue={values?.emergencyName}
                  required
                  autoComplete="off"
                  errors={fieldErrors('emergencyName')}
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
                  errors={fieldErrors('emergencyPhone')}
                />
              </div>
              <div className="border-t border-neo-border pt-3">
                <CheckboxField
                  name="termsAccepted"
                  defaultChecked={values?.termsAccepted === 'on'}
                  required
                  errors={fieldErrors('termsAccepted')}
                >
                  Declaro que he leído y acepto las condiciones de participación y conozco los
                  riesgos habituales de esta actividad deportiva.
                </CheckboxField>
                <p className="m-0 pl-8 text-xs leading-6 text-neo-text-secondary">
                  <Link
                    href="/legal/terminos"
                    className="font-semibold underline underline-offset-4"
                  >
                    Leer condiciones y riesgos de participación
                  </Link>
                </p>
                <CheckboxField
                  name="privacyAccepted"
                  defaultChecked={values?.privacyAccepted === 'on'}
                  required
                  errors={fieldErrors('privacyAccepted')}
                >
                  Autorizo el tratamiento de mis datos para gestionar mi participación en Social Run
                  NeoTeam conforme a las finalidades informadas.
                </CheckboxField>
                <p className="m-0 pl-8 text-xs leading-6 text-neo-text-secondary">
                  <Link
                    href="/legal/privacidad"
                    className="font-semibold underline underline-offset-4"
                  >
                    Leer política de tratamiento de datos
                  </Link>
                </p>
                <CheckboxField
                  name="marketingAccepted"
                  defaultChecked={values?.marketingAccepted === 'on'}
                  muted
                >
                  Quiero recibir novedades de próximos eventos de NeoTeam. (Opcional)
                </CheckboxField>
              </div>
            </div>
          )}
        </section>
      ))}

      <div
        key={step}
        className={`mt-7 grid gap-3 border-t border-neo-border pt-6 sm:grid-cols-2 sm:items-center ${motion.actions}`}
      >
        {step > 1 ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => goToStep(step - 1)}
            className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control border border-neo-border bg-neo-surface px-5 py-3 text-sm font-bold text-neo-text hover:bg-neo-muted-bg ${motion.backButton}`}
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
            className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-neo-accent px-5 py-3 text-sm font-bold text-neo-black hover:bg-neo-accent-hover ${motion.nextButton}`}
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
