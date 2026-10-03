"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { HomeFeatureCard } from "@/lib/home-features";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

const metrics = [
  ["REGISTRADOS", "—", "Métricas en la siguiente iteración"],
  ["CHECK-IN", "—", "Asistentes confirmados"],
  ["CREWS", "—", "Grupos representados"],
  ["RIFAS", "—", "Premios configurados"],
];

type AdminProfile = {
  display_name: string | null;
  role: "owner" | "admin" | "staff" | "checkin";
  active: boolean;
};

export function AdminDashboard() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [accessSent, setAccessSent] = useState(false);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [cards, setCards] = useState<HomeFeatureCard[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUserId(data.session?.user.id ?? null);
      setUserEmail(data.session?.user.email ?? "");
      setAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      setUserEmail(session?.user.email ?? "");
      setAuthReady(true);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setCards([]);
      return;
    }

    void loadAdminData(userId);
  }, [userId]);

  async function loadAdminData(currentUserId: string) {
    setBusy(true);
    setMessage("");

    const { data: adminProfile, error: profileError } = await supabase
      .from("admin_profiles")
      .select("display_name,role,active")
      .eq("user_id", currentUserId)
      .maybeSingle();

    if (profileError) {
      setMessage("No pudimos validar tu perfil administrativo.");
      setBusy(false);
      return;
    }

    const typedProfile = adminProfile as AdminProfile | null;
    setProfile(typedProfile);

    if (!typedProfile?.active || !["owner", "admin"].includes(typedProfile.role)) {
      setBusy(false);
      return;
    }

    const { data: featureCards, error: cardsError } = await supabase
      .from("home_feature_cards")
      .select("id,event_code,slot,title,description,enabled,sort_order")
      .eq("event_code", "SR26")
      .order("sort_order", { ascending: true });

    if (cardsError) {
      setMessage("No pudimos cargar los bloques de la home.");
      setBusy(false);
      return;
    }

    setCards((featureCards ?? []) as HomeFeatureCard[]);
    setBusy(false);
  }

  async function requestAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/admin`,
      },
    });

    if (error) {
      setMessage("No pudimos enviar el acceso. Revisa el correo e intenta de nuevo.");
    } else {
      setAccessSent(true);
      setMessage("Te enviamos un acceso por correo. Puedes usar el enlace o escribir el código recibido.");
    }

    setBusy(false);
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: "email",
    });

    if (error) {
      setMessage("Ese código no es válido o ya venció.");
    }

    setBusy(false);
  }

  function updateCard(id: string | undefined, field: keyof HomeFeatureCard, value: string | number | boolean) {
    setCards((current) =>
      current.map((card) => (card.id === id ? { ...card, [field]: value } : card)),
    );
  }

  async function saveCards() {
    setBusy(true);
    setMessage("");

    for (const card of cards) {
      if (!card.id) continue;

      const { error } = await supabase
        .from("home_feature_cards")
        .update({
          title: card.title.trim(),
          description: card.description.trim(),
          enabled: card.enabled,
          sort_order: card.sort_order,
        })
        .eq("id", card.id);

      if (error) {
        setMessage("No se pudieron guardar todos los cambios. Revisa tu acceso e intenta nuevamente.");
        setBusy(false);
        return;
      }
    }

    setCards((current) => [...current].sort((a, b) => a.sort_order - b.sort_order));
    setMessage("Cambios guardados. La home ya está usando esta configuración.");
    setBusy(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setCards([]);
    setMessage("");
  }

  const canEditHome = Boolean(profile?.active && ["owner", "admin"].includes(profile.role));

  return (
    <main className="admin-page">
      <aside className="admin-sidebar">
        <div className="brand"><span className="brand-mark">N</span><span>NEOTEAM</span></div>
        <nav>
          <strong>Overview</strong>
          <span>Contenido home</span>
          <span>Participantes</span>
          <span>Check-in</span>
          <span>Grupos</span>
          <span>Marcas</span>
          <span>Rifas</span>
        </nav>
        <small>{userEmail ? userEmail : "Admin · Social Run"}</small>
      </aside>

      <section className="admin-content">
        <p className="section-label">SOCIAL RUN · 18 OCT</p>
        <h1>Panel del evento</h1>

        {!authReady ? (
          <div className="admin-panel-card"><p>Cargando acceso…</p></div>
        ) : !userId ? (
          <div className="admin-panel-card admin-login-card">
            <div>
              <p className="section-label">ACCESO ADMIN</p>
              <h2>Entra con tu correo</h2>
              <p>El contenido editable está protegido por Supabase Auth y permisos de administrador.</p>
            </div>
            <form onSubmit={requestAccess} className="admin-login-form">
              <label>
                Correo
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="tu@correo.com" />
              </label>
              <button className="button" disabled={busy}>Enviar acceso</button>
            </form>
            {accessSent && (
              <form onSubmit={verifyCode} className="admin-login-form admin-otp-form">
                <label>
                  Código
                  <input value={otp} onChange={(event) => setOtp(event.target.value)} inputMode="numeric" autoComplete="one-time-code" placeholder="Código del correo" />
                </label>
                <button className="button button-light" disabled={busy || !otp.trim()}>Validar código</button>
              </form>
            )}
            {message && <p className="admin-feedback">{message}</p>}
          </div>
        ) : !canEditHome ? (
          <div className="admin-panel-card">
            <p className="section-label">ACCESO PENDIENTE</p>
            <h2>Tu cuenta todavía no tiene permisos de edición</h2>
            <p>La sesión está creada correctamente. Falta activar este usuario como owner o admin del evento.</p>
            <button className="text-link admin-signout" onClick={signOut}>Cerrar sesión</button>
            {message && <p className="admin-feedback">{message}</p>}
          </div>
        ) : (
          <>
            <div className="admin-topline">
              <p className="admin-note">Edita aquí los cuatro bloques que aparecen después de “El plan”. En móvil se muestran como carrusel horizontal.</p>
              <button className="text-link" onClick={signOut}>Cerrar sesión</button>
            </div>

            <div className="metric-grid">
              {metrics.map(([label, value, detail]) => (
                <article key={label}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>
              ))}
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
          </>
        )}
      </section>
    </main>
  );
}
