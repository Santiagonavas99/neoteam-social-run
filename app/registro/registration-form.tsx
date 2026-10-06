'use client'

import { useActionState, useState } from 'react'
import { type RegistrationState, registerParticipant } from './actions'

const initialState: RegistrationState = { ok: false, message: '' }

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null
  return <small className="field-error">{errors[0]}</small>
}

export function RegistrationForm() {
  const [state, formAction, pending] = useActionState(registerParticipant, initialState)
  const [runningGroup, setRunningGroup] = useState('neoteam')

  if (state.ok) {
    return (
      <div className="success-card">
        <span className="success-check">✓</span>
        <p className="section-label">REGISTRO CONFIRMADO</p>
        <h2>ESTÁS DENTRO.</h2>
        <p>Nos vemos el 18 de octubre en el Social Run del aniversario NeoTeam.</p>
        <strong>{state.code}</strong>
        <small>Guarda este código. Lo usaremos más adelante para check-in y rifas.</small>
      </div>
    )
  }

  return (
    <form action={formAction} className="registration-form">
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
          <input name="firstName" required autoComplete="given-name" />
          <FieldError errors={state.errors?.firstName} />
        </label>
        <label>
          Apellido
          <input name="lastName" required autoComplete="family-name" />
          <FieldError errors={state.errors?.lastName} />
        </label>
      </div>
      <div className="form-grid document-grid">
        <label>
          Tipo
          <select name="documentType" defaultValue="CC">
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
          <input name="documentNumber" required inputMode="numeric" />
          <FieldError errors={state.errors?.documentNumber} />
        </label>
      </div>
      <div className="form-grid two">
        <label>
          Correo
          <input name="email" type="email" required autoComplete="email" />
          <FieldError errors={state.errors?.email} />
        </label>
        <label>
          WhatsApp
          <input name="phone" type="tel" required autoComplete="tel" />
          <FieldError errors={state.errors?.phone} />
        </label>
      </div>
      <label>
        Fecha de nacimiento
        <input name="birthDate" type="date" required />
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
          <input name="otherRunningGroup" required placeholder="Escribe el nombre del crew" />
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
          <input name="emergencyName" required />
          <FieldError errors={state.errors?.emergencyName} />
        </label>
        <label>
          Celular
          <input name="emergencyPhone" type="tel" required />
          <FieldError errors={state.errors?.emergencyPhone} />
        </label>
      </div>

      <label className="checkbox-label">
        <input name="termsAccepted" type="checkbox" required />
        <span>
          Declaro que participaré bajo mi propia responsabilidad y acepto las condiciones del
          evento.
        </span>
      </label>
      <FieldError errors={state.errors?.termsAccepted} />

      <label className="checkbox-label">
        <input name="privacyAccepted" type="checkbox" required />
        <span>
          Acepto el tratamiento de mis datos para gestionar mi participación en Social Run NeoTeam.
        </span>
      </label>
      <FieldError errors={state.errors?.privacyAccepted} />

      <label className="checkbox-label optional-consent">
        <input name="marketingAccepted" type="checkbox" />
        <span>Quiero recibir novedades de próximos eventos de NeoTeam. (Opcional)</span>
      </label>

      {state.message && <p className="form-message">{state.message}</p>}
      <button className="button submit-button" type="submit" disabled={pending}>
        {pending ? 'Registrando...' : 'Confirmar mi registro'} <span>↗</span>
      </button>
    </form>
  )
}
