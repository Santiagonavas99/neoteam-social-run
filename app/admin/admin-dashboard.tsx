"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { HomeFeatureCard } from "@/lib/home-features";
import { AdminManagement } from "./admin-management";

const ADMIN_SESSION_KEY = "neoteam_admin_pin_session";

type AdminApiResponse = {
  ok?: boolean;
  configured?: boolean;
  setupSecretReady?: boolean;
  valid?: boolean;
  token?: string;
  expiresAt?: string;
  cards?: HomeFeatureCard[];
  error?: string;
};

async function callAdminApi(action: string, payload: Record<string, unknown> = {}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !publishableKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en las variables de Vercel para esta preview.");
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/admin-pin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: publishableKey,
      Authorization: `Bearer ${publishableKey}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });

  const data = (await response.json().catch(() => ({}))) as AdminApiResponse;
  if (!response.ok) throw new Error(data.error || "No pudimos completar la operación.");
  return data;
}

function normalizePin(value: string) {
  return value.replace(/\D/g, "").slice(0, 6);
}

export function AdminDashboard() {
  const [authReady, setAuthReady] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [setupSecretReady, setSetupSecretReady] = useState<boolean | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [setupSecret, setSetupSecret] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [cards, setCards] = useState<HomeFeatureCard[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const stableCallAdminApi = useCallback(callAdminApi, []);
  const reportMessage = useCallback((value: string) => setMessage(value), []);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const status = await callAdminApi("status");
        if (!active) return;
        setConfigured(Boolean(status.configured));
        setSetupSecretReady(status.setupSecretReady ?? null);

        const storedToken = window.localStorage.getItem(ADMIN_SESSION_KEY);
        if (!storedToken) return;

        const validation = await callAdminApi("validate", { token: storedToken });
        if (!active) return;

        if (validation.valid) {
          setSessionToken(storedToken);
          setAuthenticated(true);
          await loadCards(storedToken);
        } else {
          window.localStorage.removeItem(ADMIN_SESSION_KEY);
        }
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : "No pudimos cargar el acceso administrativo.");
      } finally {
        if (active) setAuthReady(true);
      }
    }

    void bootstrap();
    return () => {
      active = false;
    };
  }, []);

  async function loadCards(token: string) {
    const data = await callAdminApi("listCards", { token });
    setCards((data.cards ?? []) as HomeFeatureCard[]);
  }

  function rememberSession(token: string) {
    window.localStorage.setItem(ADMIN_SESSION_KEY, token);
    setSessionToken(token);
    setAuthenticated(true);
  }

  async function setupPin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (pin.length !== 6) {
      setMessage("El PIN debe tener exactamente 6 dígitos.");
      return;
    }
    if (pin !== confirmPin) {
      setMessage("Los dos PIN no coinciden.");
      return;
    }

    setBusy(true);
    try {
      const data = await callAdminApi("setup", { pin, setupSecret });
      if (!data.token) throw new Error("No pudimos crear la sesión administrativa.");
      rememberSession(data.token);
      setConfigured(true);
      setPin("");
      setConfirmPin("");
      setSetupSecret("");
      await loadCards(data.token);
      setMessage("PIN configurado. Ya tienes acceso al panel.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos configurar el PIN.");
    } finally {
      setBusy(false);
    }
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (pin.length !== 6) {
      setMessage("Escribe tu PIN de 6 dígitos.");
      return;
    }

    setBusy(true);
    try {
      const data = await callAdminApi("login", { pin });
      if (!data.token) throw new Error("No pudimos crear la sesión administrativa.");
      rememberSession(data.token);
      setPin("");
      await loadCards(data.token);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos iniciar sesión.");
    } finally {
      setBusy(false);
    }
  }

  function updateCard(id: string | undefined, field: keyof HomeFeatureCard, value: string | number | boolean) {
    setCards((current) =>
      current.map((card) => (card.id === id ? { ...card, [field]: value } : card)),
    );
  }

  async function saveCards() {
    if (!sessionToken) return;
    setBusy(true);
    setMessage("");

    try {
      await callAdminApi("saveCards", { token: sessionToken, cards });
      setCards((current) => [...current].sort((a, b) => a.sort_order - b.sort_order));
      setMessage("Cambios guardados. La home ya está usando esta configuración.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudieron guardar los cambios.");
    } finally {
      setBusy(false);
    }
  }

  async function changePin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionToken) return;
    setMessage("");

    if (newPin.length !== 6) {
      setMessage("El nuevo PIN debe tener exactamente 6 dígitos.");
      return;
    }
    if (newPin !== confirmNewPin) {
      setMessage("Los dos PIN nuevos no coinciden.");
      return;
    }

    setBusy(true);
    try {
      if (currentPin.length !== 6) {
        setMessage("Escribe tu PIN actual de 6 dígitos.");
        return;
      }
      const data = await callAdminApi("changePin", { token: sessionToken, currentPin, newPin });
      if (!data.token) throw new Error("El PIN cambió, pero no pudimos renovar la sesión.");
      rememberSession(data.token);
      setNewPin("");
      setConfirmNewPin("");
      setCurrentPin("");
      setMessage("PIN actualizado. Las demás sesiones fueron cerradas.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos actualizar el PIN.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    const token = sessionToken;
    window.localStorage.removeItem(ADMIN_SESSION_KEY);
    setSessionToken(null);
    setAuthenticated(false);
    setCards([]);
    setMessage("");
    setPin("");

    if (token) {
      try {
        await callAdminApi("logout", { token });
      } catch {
        // La sesión local ya quedó cerrada aunque falle la revocación remota.
      }
    }
  }

  return (
    <main className="admin-page">
      <aside className="admin-sidebar">
        <div className="brand"><span className="brand-mark">N</span><span>NEOTEAM</span></div>
        <nav>
          <strong>Panel</strong>
          <span>Usa las pestañas de gestión para configurar el evento.</span>
        </nav>
        <small>{authenticated ? "Admin · Sesión con PIN" : "Admin · Social Run"}</small>
      </aside>

      <section className="admin-content">
        <p className="section-label">SOCIAL RUN · 18 OCT</p>
        <h1>Panel del evento</h1>

        {!authReady ? (
          <div className="admin-panel-card"><p>Cargando acceso…</p></div>
        ) : !authenticated && configured === false ? (
          <div className="admin-panel-card admin-login-card">
            <div>
              <p className="section-label">PRIMER ACCESO</p>
              <h2>Configura tu PIN</h2>
              <p>Crea un PIN de 6 dígitos. Por seguridad, el setup inicial también requiere una clave privada configurada por el responsable del proyecto en Supabase.</p>
              {setupSecretReady === false && (
                <p className="admin-feedback">El setup está bloqueado hasta que el responsable configure <code>ADMIN_SETUP_SECRET</code> en los secretos de Supabase.</p>
              )}
            </div>
            <form onSubmit={setupPin} className="admin-pin-form">
              <label>
                Clave privada de setup
                <input
                  type="password"
                  value={setupSecret}
                  onChange={(event) => setSetupSecret(event.target.value)}
                  autoComplete="off"
                  required
                />
              </label>
              <label>
                Nuevo PIN
                <input
                  type="password"
                  value={pin}
                  onChange={(event) => setPin(normalizePin(event.target.value))}
                  inputMode="numeric"
                  autoComplete="new-password"
                  placeholder="••••••"
                  minLength={6}
                  maxLength={6}
                  pattern="[0-9]{6}"
                  required
                />
              </label>
              <label>
                Repite el PIN
                <input
                  type="password"
                  value={confirmPin}
                  onChange={(event) => setConfirmPin(normalizePin(event.target.value))}
                  inputMode="numeric"
                  autoComplete="new-password"
                  placeholder="••••••"
                  minLength={6}
                  maxLength={6}
                  pattern="[0-9]{6}"
                  required
                />
              </label>
              <button className="button button-light" disabled={busy || setupSecretReady === false || !setupSecret || pin.length !== 6 || confirmPin.length !== 6}>Guardar PIN y entrar</button>
            </form>
            {message && <p className="admin-feedback">{message}</p>}
          </div>
        ) : !authenticated ? (
          <div className="admin-panel-card admin-login-card">
            <div>
              <p className="section-label">ACCESO ADMIN</p>
              <h2>Introduce tu PIN</h2>
              <p>Usa el PIN de 6 dígitos que configuraste para entrar al panel.</p>
            </div>
            <form onSubmit={login} className="admin-pin-login-form">
              <label>
                PIN
                <input
                  type="password"
                  value={pin}
                  onChange={(event) => setPin(normalizePin(event.target.value))}
                  inputMode="numeric"
                  autoComplete="current-password"
                  placeholder="••••••"
                  minLength={6}
                  maxLength={6}
                  pattern="[0-9]{6}"
                  autoFocus
                  required
                />
              </label>
              <button className="button button-light" disabled={busy || pin.length !== 6}>Entrar</button>
            </form>
            {message && <p className="admin-feedback">{message}</p>}
          </div>
        ) : (
          <>
            <div className="admin-topline">
              <p className="admin-note">Edita aquí los cuatro bloques que aparecen después de “El plan”. En móvil se muestran como carrusel horizontal.</p>
              <button className="text-link" onClick={signOut}>Cerrar sesión</button>
            </div>

            <section className="admin-panel-card admin-home-settings">
              <div className="admin-section-heading">
                <div>
                  <p className="section-label">CONTENIDO HOME</p>
                  <h2>Bloques del carrusel</h2>
                </div>
                <button className="button" onClick={saveCards} disabled={busy || !cards.length}>Guardar cambios</button>
              </div>

              <div className="admin-feature-list">
                {cards.map((card, index) => (
                  <article className="admin-feature-editor" key={card.id ?? card.slot}>
                    <div className="admin-feature-number">{String(index + 1).padStart(2, "0")}</div>
                    <div className="admin-feature-fields">
                      <label>
                        Título
                        <input value={card.title} onChange={(event) => updateCard(card.id, "title", event.target.value)} />
                      </label>
                      <label>
                        Descripción
                        <textarea value={card.description} onChange={(event) => updateCard(card.id, "description", event.target.value)} rows={3} />
                      </label>
                    </div>
                    <div className="admin-feature-options">
                      <label>
                        Orden
                        <input type="number" min="0" value={card.sort_order} onChange={(event) => updateCard(card.id, "sort_order", Number(event.target.value))} />
                      </label>
                      <label className="admin-toggle">
                        <input type="checkbox" checked={card.enabled} onChange={(event) => updateCard(card.id, "enabled", event.target.checked)} />
                        Visible
                      </label>
                    </div>
                  </article>
                ))}
              </div>

              {message && <p className="admin-feedback">{message}</p>}
            </section>

            <section className="admin-panel-card admin-security-settings">
              <div className="admin-section-heading">
                <div>
                  <p className="section-label">SEGURIDAD</p>
                  <h2>Cambiar PIN</h2>
                </div>
              </div>
              <form onSubmit={changePin} className="admin-pin-form admin-change-pin-form">
                <label>
                  PIN actual
                  <input
                    type="password"
                    value={currentPin}
                    onChange={(event) => setCurrentPin(normalizePin(event.target.value))}
                    inputMode="numeric"
                    autoComplete="current-password"
                    placeholder="••••••"
                    minLength={6}
                    maxLength={6}
                    pattern="[0-9]{6}"
                    required
                  />
                </label>
                <label>
                  Nuevo PIN
                  <input
                    type="password"
                    value={newPin}
                    onChange={(event) => setNewPin(normalizePin(event.target.value))}
                    inputMode="numeric"
                    autoComplete="new-password"
                    placeholder="••••••"
                    minLength={6}
                    maxLength={6}
                    pattern="[0-9]{6}"
                    required
                  />
                </label>
                <label>
                  Repite el nuevo PIN
                  <input
                    type="password"
                    value={confirmNewPin}
                    onChange={(event) => setConfirmNewPin(normalizePin(event.target.value))}
                    inputMode="numeric"
                    autoComplete="new-password"
                    placeholder="••••••"
                    minLength={6}
                    maxLength={6}
                    pattern="[0-9]{6}"
                    required
                  />
                </label>
                <button className="button" disabled={busy || currentPin.length !== 6 || newPin.length !== 6 || confirmNewPin.length !== 6}>Actualizar PIN</button>
              </form>
            </section>

            <AdminManagement token={sessionToken ?? ""} callApi={stableCallAdminApi} onMessage={reportMessage} />
          </>
        )}
      </section>
    </main>
  );
}
