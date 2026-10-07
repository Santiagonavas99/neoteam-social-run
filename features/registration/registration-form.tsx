'use client'

import { Check } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { useActionState, useState } from 'react'
import { type RegistrationState, registerParticipant } from './actions'
import { CalendarButton } from './calendar-button'
import {
  CheckboxField,
  cardClass,
  Eyebrow,
  FormMessage,
  FormSection,
  linkClass,
  SelectField,
  SubmitButton,
  TextField,
} from './form-ui'
import { PassCard } from './pass-card'

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

export function RegistrationForm() {
  const [state, formAction, pending] = useActionState(registerParticipant, initialState)
  const [runningGroup, setRunningGroup] = useState('neoteam')
  const values = state.values
  const errors = state.errors

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
    // React resets a form after its action, which blanks selects; remounting applies the submitted values.
    <form key={state.attempt} action={formAction} className={cardClass}>
      <FormSection step="01" title="Sobre ti" hint="Lo necesario para identificar tu registro." />
      <div className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="firstName"
            label="Nombre"
            defaultValue={values?.firstName}
            required
            autoComplete="given-name"
            errors={errors?.firstName}
          />
          <TextField
            name="lastName"
            label="Apellido"
            defaultValue={values?.lastName}
            required
            autoComplete="family-name"
            errors={errors?.lastName}
          />
        </div>
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
            inputMode="tel"
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
            label="Género"
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

      <FormSection step="02" title="Tu comunidad" hint="Queremos saber con quién corres." />
      <div className="grid gap-5">
        <SelectField
          name="runningGroup"
          label="¿Con qué grupo corres?"
          value={runningGroup}
          onChange={(event) => setRunningGroup(event.target.value)}
          errors={errors?.runningGroup}
        >
          <option value="neoteam">NeoTeam</option>
          <option value="independiente">Independiente</option>
          <option value="otro">Otro grupo / crew</option>
        </SelectField>
        {runningGroup === 'otro' && (
          <TextField
            name="otherRunningGroup"
            label="Nombre de tu grupo"
            defaultValue={values?.otherRunningGroup}
            required
            placeholder="Escribe el nombre del crew"
            errors={errors?.otherRunningGroup}
          />
        )}
      </div>

      <FormSection
        step="03"
        title="Emergencia"
        hint="Solo lo usaremos si llegara a ser necesario."
      />
      <div className="mb-5 grid gap-5 sm:grid-cols-2">
        <TextField
          name="emergencyName"
          label="Nombre del contacto"
          defaultValue={values?.emergencyName}
          required
          autoComplete="off"
          errors={errors?.emergencyName}
        />
        <TextField
          name="emergencyPhone"
          label="Celular"
          type="tel"
          inputMode="tel"
          defaultValue={values?.emergencyPhone}
          required
          autoComplete="off"
          errors={errors?.emergencyPhone}
        />
      </div>

      <CheckboxField
        name="termsAccepted"
        defaultChecked={values?.termsAccepted === 'on'}
        required
        errors={errors?.termsAccepted}
      >
        Declaro que participaré bajo mi propia responsabilidad y acepto las condiciones del evento.
      </CheckboxField>
      <CheckboxField
        name="privacyAccepted"
        defaultChecked={values?.privacyAccepted === 'on'}
        required
        errors={errors?.privacyAccepted}
      >
        Acepto el tratamiento de mis datos para gestionar mi participación en Social Run NeoTeam.
      </CheckboxField>
      <CheckboxField
        name="marketingAccepted"
        defaultChecked={values?.marketingAccepted === 'on'}
        muted
      >
        Quiero recibir novedades de próximos eventos de NeoTeam. (Opcional)
      </CheckboxField>

      {state.message && <FormMessage>{state.message}</FormMessage>}
      <SubmitButton pending={pending} idle="Confirmar mi registro" busy="Registrando…" />
    </form>
  )
}
