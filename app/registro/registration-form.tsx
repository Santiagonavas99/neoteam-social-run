"use client";

import { useActionState, useEffect, useState } from "react";
import { registerParticipant, type RegistrationState, type RegistrationValues } from "./actions";
import { CheckinPass } from "./checkin-pass";

const initialState: RegistrationState = { ok: false, message: "" };
const initialValues: RegistrationValues = {
  firstName: "",
  lastName: "",
  documentType: "CC",
  documentNumber: "",
  email: "",
  phone: "",
  birthDate: "",
  runningGroup: "neoteam",
  otherRunningGroup: "",
  emergencyName: "",
  emergencyPhone: "",
  termsAccepted: false,
  privacyAccepted: false,
  marketingAccepted: false,
};

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <small className="field-error">{errors[0]}</small>;
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 10);
}

export function RegistrationForm() {
  const [state, formAction, pending] = useActionState(registerParticipant, initialState);
  const [values, setValues] = useState<RegistrationValues>(initialValues);

  useEffect(() => {
    if (!state.ok && state.values) setValues(state.values);
  }, [state]);

  function setField<K extends keyof RegistrationValues>(field: K, value: RegistrationValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  if (state.ok) {
    return (
      <div className="success-card success-card-pass">
        <span className="success-check">✓</span>
        <p className="section-label">REGISTRO CONFIRMADO</p>
        <h2>ESTÁS DENTRO.</h2>
        <p>Nos vemos el 18 de octubre en el Social Run del aniversario NeoTeam.</p>
        {state.code && <CheckinPass code={state.code} checkinToken={state.checkinToken} participantName={state.participantName} />}
        <small className="pass-help">Guarda esta pantalla. El QR será tu acceso rápido para el check-in y el código queda como respaldo.</small>
      </div>
    );
  }

  return (
    <form action={formAction} className="registration-form">
      <div className="form-section-title">
        <span>01</span>
        <div><strong>Sobre ti</strong><small>Lo necesario para identificar tu registro.</small></div>
      </div>
      <div className="form-grid two">
        <label>Nombre
          <input name="firstName" required autoComplete="given-name" value={values.firstName} onChange={(event) => setField("firstName", event.target.value)} />
          <FieldError errors={state.errors?.firstName} />
        </label>
        <label>Apellido
          <input name="lastName" required autoComplete="family-name" value={values.lastName} onChange={(event) => setField("lastName", event.target.value)} />
          <FieldError errors={state.errors?.lastName} />
        </label>
      </div>
      <div className="form-grid document-grid">
        <label>Tipo
          <select name="documentType" value={values.documentType} onChange={(event) => setField("documentType", event.target.value)}>
            <option value="CC">CC</option><option value="CE">CE</option><option value="TI">TI</option>
            <option value="PA">Pasaporte</option><option value="PPT">PPT</option><option value="OTRO">Otro</option>
          </select>
        </label>
        <label>Documento
          <input name="documentNumber" required inputMode="numeric" value={values.documentNumber} onChange={(event) => setField("documentNumber", event.target.value)} />
          <FieldError errors={state.errors?.documentNumber} />
        </label>
      </div>
      <div className="form-grid two">
        <label>Correo
          <input name="email" type="email" required autoComplete="email" value={values.email} onChange={(event) => setField("email", event.target.value)} />
          <FieldError errors={state.errors?.email} />
        </label>
        <label>WhatsApp
          <input
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            inputMode="numeric"
            minLength={10}
            maxLength={10}
            pattern="[0-9]{10}"
            title="Escribe exactamente 10 dígitos."
            value={values.phone}
            onChange={(event) => setField("phone", onlyDigits(event.target.value))}
          />
          <FieldError errors={state.errors?.phone} />
        </label>
      </div>
      <label>Fecha de nacimiento
        <input name="birthDate" type="date" required value={values.birthDate} onChange={(event) => setField("birthDate", event.target.value)} />
        <FieldError errors={state.errors?.birthDate} />
      </label>

      <div className="form-section-title spaced">
        <span>02</span>
        <div><strong>Tu comunidad</strong><small>Queremos saber con quién corres.</small></div>
      </div>
      <label>¿Con qué grupo corres?
        <select name="runningGroup" value={values.runningGroup} onChange={(event) => setField("runningGroup", event.target.value)}>
          <option value="neoteam">NeoTeam</option>
          <option value="independiente">Independiente</option>
          <option value="otro">Otro grupo / crew</option>
        </select>
        <FieldError errors={state.errors?.runningGroup} />
      </label>
      {values.runningGroup === "otro" && (
        <label>Nombre de tu grupo
          <input name="otherRunningGroup" required placeholder="Escribe el nombre del crew" value={values.otherRunningGroup} onChange={(event) => setField("otherRunningGroup", event.target.value)} />
          <FieldError errors={state.errors?.otherRunningGroup} />
        </label>
      )}

      <div className="form-section-title spaced">
        <span>03</span>
        <div><strong>Emergencia</strong><small>Solo lo usaremos si llegara a ser necesario.</small></div>
      </div>
      <div className="form-grid two">
        <label>Nombre del contacto
          <input name="emergencyName" required value={values.emergencyName} onChange={(event) => setField("emergencyName", event.target.value)} />
          <FieldError errors={state.errors?.emergencyName} />
        </label>
        <label>Celular
          <input
            name="emergencyPhone"
            type="tel"
            required
            inputMode="numeric"
            minLength={10}
            maxLength={10}
            pattern="[0-9]{10}"
            title="Escribe exactamente 10 dígitos."
            value={values.emergencyPhone}
            onChange={(event) => setField("emergencyPhone", onlyDigits(event.target.value))}
          />
          <FieldError errors={state.errors?.emergencyPhone} />
        </label>
      </div>

      <label className="checkbox-label">
        <input name="termsAccepted" type="checkbox" required checked={values.termsAccepted} onChange={(event) => setField("termsAccepted", event.target.checked)} />
        <span>Declaro que participaré bajo mi propia responsabilidad y acepto las condiciones del evento.</span>
      </label>
      <FieldError errors={state.errors?.termsAccepted} />

      <label className="checkbox-label">
        <input name="privacyAccepted" type="checkbox" required checked={values.privacyAccepted} onChange={(event) => setField("privacyAccepted", event.target.checked)} />
        <span>Acepto el tratamiento de mis datos para gestionar mi participación en Social Run NeoTeam.</span>
      </label>
      <FieldError errors={state.errors?.privacyAccepted} />

      <label className="checkbox-label optional-consent">
        <input name="marketingAccepted" type="checkbox" checked={values.marketingAccepted} onChange={(event) => setField("marketingAccepted", event.target.checked)} />
        <span>Quiero recibir novedades de próximos eventos de NeoTeam. (Opcional)</span>
      </label>

      {state.message && <p className="form-message">{state.message}</p>}
      <button className="button submit-button" type="submit" disabled={pending}>
        {pending ? "Registrando..." : "Confirmar mi registro"} <span>↗</span>
      </button>
    </form>
  );
}
