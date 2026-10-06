"use client";

import { useActionState, useEffect, useState } from "react";
import { CheckinPass } from "@/app/registro/checkin-pass";
import { claimPass, type PassClaimState } from "./actions";

const initialState: PassClaimState = { ok: false, message: "" };
const PASS_STORAGE_KEY = "neoteam:social-run:pass:v1";

type SavedPass = {
  code: string;
  checkinToken: string;
  participantName?: string;
  savedAt?: string;
};

function readSavedPass(): SavedPass | null {
  try {
    const raw = window.localStorage.getItem(PASS_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<SavedPass>;
    if (
      typeof parsed.code !== "string" ||
      typeof parsed.checkinToken !== "string" ||
      !parsed.code ||
      !parsed.checkinToken
    ) {
      return null;
    }

    return {
      code: parsed.code,
      checkinToken: parsed.checkinToken,
      participantName:
        typeof parsed.participantName === "string"
          ? parsed.participantName
          : undefined,
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : undefined,
    };
  } catch {
    return null;
  }
}

export function PassForm() {
  const [state, formAction, pending] = useActionState(claimPass, initialState);
  const [savedPass, setSavedPass] = useState<SavedPass | null>(null);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    setSavedPass(readSavedPass());
    setStorageReady(true);
  }, []);

  function clearSavedPass() {
    try {
      window.localStorage.removeItem(PASS_STORAGE_KEY);
    } catch {
      // Nothing else to do when storage is unavailable.
    }
    setSavedPass(null);
  }

  if (state.ok && state.code) {
    return (
      <section className="pass-recovery-result">
        <p className="section-label">TU PASE</p>
        <h2>LISTO PARA EL 5K.</h2>
        <p>Guarda este QR para el check-in del Social Run.</p>
        <CheckinPass
          code={state.code}
          checkinToken={state.checkinToken}
          participantName={state.participantName}
        />
        <button
          type="button"
          className="text-link"
          onClick={() => window.location.reload()}
        >
          Buscar otro pase
        </button>
      </section>
    );
  }

  if (storageReady && savedPass) {
    return (
      <section className="pass-recovery-result saved-pass-result">
        <p className="section-label">TU PASE GUARDADO</p>
        <h2>LISTO PARA EL 5K.</h2>
        <p>
          Este pase está guardado en este dispositivo para que tengas tu QR a
          mano el día del evento.
        </p>
        <CheckinPass
          code={savedPass.code}
          checkinToken={savedPass.checkinToken}
          participantName={savedPass.participantName}
        />
        <button
          type="button"
          className="text-link"
          onClick={clearSavedPass}
        >
          Usar otro registro
        </button>
      </section>
    );
  }

  return (
    <form action={formAction} className="pass-recovery-form">
      <div>
        <p className="section-label">RECUPERAR PASE</p>
        <h2>
          YA ESTÁS INSCRITO.
          <br />
          TRAE TU QR.
        </h2>
        <p>Usa el mismo documento y correo con los que hiciste el registro.</p>
      </div>
      <label>
        Número de documento
        <input name="documentNumber" required autoComplete="off" inputMode="numeric" />
        {state.errors?.documentNumber?.[0] && (
          <small className="field-error">
            {state.errors.documentNumber[0]}
          </small>
        )}
      </label>
      <label>
        Correo
        <input name="email" type="email" required autoComplete="email" />
        {state.errors?.email?.[0] && (
          <small className="field-error">{state.errors.email[0]}</small>
        )}
      </label>
      {state.message && <p className="form-message">{state.message}</p>}
      <button className="button" disabled={pending}>
        {pending ? "Buscando…" : "Ver mi pase →"}
      </button>
    </form>
  );
}
