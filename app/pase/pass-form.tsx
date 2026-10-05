"use client";

import { useActionState } from "react";
import { CheckinPass } from "@/app/registro/checkin-pass";
import { claimPass, type PassClaimState } from "./actions";

const initialState: PassClaimState = { ok: false, message: "" };

export function PassForm() {
  const [state, formAction, pending] = useActionState(claimPass, initialState);

  if (state.ok && state.code) {
    return <section className="pass-recovery-result">
      <p className="section-label">TU PASE</p>
      <h2>LISTO PARA EL 5K.</h2>
      <p>Guarda este QR para el check-in del Social Run.</p>
      <CheckinPass code={state.code} checkinToken={state.checkinToken} participantName={state.participantName} />
      <button type="button" className="text-link" onClick={() => window.location.reload()}>Buscar otro pase</button>
    </section>;
  }

  return <form action={formAction} className="pass-recovery-form">
    <div>
      <p className="section-label">RECUPERAR PASE</p>
      <h2>YA ESTÁS INSCRITO.<br />TRAE TU QR.</h2>
      <p>Usa el mismo documento y correo con los que hiciste el registro.</p>
    </div>
    <label>Número de documento
      <input name="documentNumber" required autoComplete="off" inputMode="numeric" />
      {state.errors?.documentNumber?.[0] && <small className="field-error">{state.errors.documentNumber[0]}</small>}
    </label>
    <label>Correo
      <input name="email" type="email" required autoComplete="email" />
      {state.errors?.email?.[0] && <small className="field-error">{state.errors.email[0]}</small>}
    </label>
    {state.message && <p className="form-message">{state.message}</p>}
    <button className="button" disabled={pending}>{pending ? "Buscando…" : "Ver mi pase →"}</button>
  </form>;
}
