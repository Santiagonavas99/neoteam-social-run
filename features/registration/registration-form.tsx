'use client'

import { ArrowRight, Check, CircleAlert, LoaderCircle } from 'lucide-react'
import Link from 'next/link'
import { useActionState, useState } from 'react'
import { type RegistrationState, registerParticipant } from './actions'
import { PassCard } from './pass-card'

const initialState: RegistrationState = { ok: false, message: '' }

export function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null
  return (
    <small className="field-error inline-flex items-start gap-1">
      <CircleAlert aria-hidden className="mt-px size-3.5 shrink-0" />
      {errors[0]}
    </small>
  )
}

export function RegistrationForm() {
  const [state, formAction, pending] = useActionState(registerParticipant, initialState)
  const [runningGroup, setRunningGroup] = useState('neoteam')
  const values = state.values

  if (state.ok) {
    return (
      <div className="success-card">
        <span className="success-check">
          <Check aria-hidden className="size-6" />
        </span>
        <p className="section-label">REGISTRO CONFIRMADO</p>
        <h2>ESTÁS DENTRO.</h2>
        <p>Nos vemos el 18 de octubre en el Social Run del aniversario NeoTeam.</p>
        {state.pass ? (
          <PassCard pass={state.pass} />
        ) : (
          <>
            <strong>{state.code}</strong>
            <small>
              Guarda este código. Tu QR de check-in estará en{' '}
              <Link href="/pase" className="text-link">
                Mi pase
              </Link>
              .
            </small>
          </>
        )}
      </div>
    )
  }

  return (
    // React resets a form after its action, which blanks selects; remounting applies the submitted values.
    <form key={state.attempt} action={formAction} className="registration-form">
      <div className="form-section-title">
        <span>01</span>
        <div>
          <strong>Sobre ti</strong>
          <small>Lo necesario para identificar tu registro.</small>
        </div>
      </div>
      <div className="form-grid two">
        <label>
          Nombre
          <input
            name="firstName"
            defaultValue={values?.firstName}
            required
            autoComplete="given-name"
          />
          <FieldError errors={state.errors?.firstName} />
        </label>
        <label>
          Apellido
          <input
            name="lastName"
            defaultValue={values?.lastName}
            required
            autoComplete="family-name"
          />
          <FieldError errors={state.errors?.lastName} />
        </label>
      </div>
      <div className="form-grid document-grid">
        <label>
          Tipo
          <select name="documentType" defaultValue={values?.documentType ?? 'CC'}>
            <option value="CC">CC</option>
            <option value="CE">CE</option>
            <option value="TI">TI</option>
            <option value="PA">Pasaporte</option>
            <option value="PPT">PPT</option>
            <option value="OTRO">Otro</option>
          </select>
        </label>
        <label>
          Documento
          <input
            name="documentNumber"
            defaultValue={values?.documentNumber}
            required
            inputMode="numeric"
          />
          <FieldError errors={state.errors?.documentNumber} />
        </label>
      </div>
      <div className="form-grid two">
        <label>
          Correo
          <input
            name="email"
            defaultValue={values?.email}
            type="email"
            required
            autoComplete="email"
          />
          <FieldError errors={state.errors?.email} />
        </label>
        <label>
          WhatsApp
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            required
            autoComplete="tel"
            defaultValue={values?.phone}
          />
          <FieldError errors={state.errors?.phone} />
        </label>
      </div>
      <label>
        Fecha de nacimiento
        <input name="birthDate" defaultValue={values?.birthDate} type="date" required />
        <FieldError errors={state.errors?.birthDate} />
      </label>

      <div className="form-section-title spaced">
        <span>02</span>
        <div>
          <strong>Tu comunidad</strong>
          <small>Queremos saber con quién corres.</small>
        </div>
      </div>
      <label>
        ¿Con qué grupo corres?
        <select
          name="runningGroup"
          value={runningGroup}
          onChange={(event) => setRunningGroup(event.target.value)}
        >
          <option value="neoteam">NeoTeam</option>
          <option value="independiente">Independiente</option>
          <option value="otro">Otro grupo / crew</option>
        </select>
        <FieldError errors={state.errors?.runningGroup} />
      </label>
      {runningGroup === 'otro' && (
        <label>
          Nombre de tu grupo
          <input
            name="otherRunningGroup"
            defaultValue={values?.otherRunningGroup}
            required
            placeholder="Escribe el nombre del crew"
          />
          <FieldError errors={state.errors?.otherRunningGroup} />
        </label>
      )}

      <div className="form-section-title spaced">
        <span>03</span>
        <div>
          <strong>Emergencia</strong>
          <small>Solo lo usaremos si llegara a ser necesario.</small>
        </div>
      </div>
      <div className="form-grid two">
        <label>
          Nombre del contacto
          <input name="emergencyName" defaultValue={values?.emergencyName} required />
          <FieldError errors={state.errors?.emergencyName} />
        </label>
        <label>
          Celular
          <input
            name="emergencyPhone"
            type="tel"
            inputMode="tel"
            required
            defaultValue={values?.emergencyPhone}
          />
          <FieldError errors={state.errors?.emergencyPhone} />
        </label>
      </div>

      <label className="checkbox-label">
        <input
          name="termsAccepted"
          type="checkbox"
          defaultChecked={values?.termsAccepted === 'on'}
          required
        />
        <span>
          Declaro que participaré bajo mi propia responsabilidad y acepto las condiciones del
          evento.
        </span>
      </label>
      <FieldError errors={state.errors?.termsAccepted} />

      <label className="checkbox-label">
        <input
          name="privacyAccepted"
          type="checkbox"
          defaultChecked={values?.privacyAccepted === 'on'}
          required
        />
        <span>
          Acepto el tratamiento de mis datos para gestionar mi participación en Social Run NeoTeam.
        </span>
      </label>
      <FieldError errors={state.errors?.privacyAccepted} />

      <label className="checkbox-label optional-consent">
        <input
          name="marketingAccepted"
          type="checkbox"
          defaultChecked={values?.marketingAccepted === 'on'}
        />
        <span>Quiero recibir novedades de próximos eventos de NeoTeam. (Opcional)</span>
      </label>

      {state.message && (
        <p className="form-message flex items-start gap-2">
          <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {state.message}
        </p>
      )}
      <button className="button submit-button" type="submit" disabled={pending}>
        {pending ? 'Registrando…' : 'Confirmar mi registro'}
        {pending ? (
          <LoaderCircle aria-hidden className="size-4 shrink-0 motion-safe:animate-spin" />
        ) : (
          <ArrowRight aria-hidden className="size-4 shrink-0" />
        )}
      </button>
    </form>
  )
}
