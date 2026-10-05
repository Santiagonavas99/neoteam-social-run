"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AdminApi, AdminRow, DynamicRow, DynamicType, FeedbackValue } from "./admin-types";
import { dynamicStates, dynamicTypes } from "./admin-types";
import { Feedback, StatusBadge } from "./admin-ui";

export function DynamicsManagement({ token, callApi }: { token: string; callApi: AdminApi }) {
  const [rows, setRows] = useState<DynamicRow[]>([]);
  const [brands, setBrands] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackValue>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [editor, setEditor] = useState<DynamicRow | null>(null);
  const [pending, setPending] = useState<{ row: DynamicRow; action: "delete" | "draw" } | null>(null);
  const [scanTarget, setScanTarget] = useState<DynamicRow | null>(null);
  const [scanCode, setScanCode] = useState("");
  const requestId = useRef(0);

  const errorText = (error: unknown) => error instanceof Error ? error.message : "No pudimos completar la operación.";

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const [dynamics, sponsors] = await Promise.all([
        callApi("dynamicData", { token, operation: "list" }),
        callApi("adminData", { token, resource: "brands", operation: "list" }),
      ]);
      if (id !== requestId.current) return;
      setRows(dynamics.dynamicRows ?? []);
      setBrands(sponsors.rows ?? []);
    } catch (error) {
      if (id === requestId.current) setFeedback({ kind: "error", text: errorText(error) });
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [callApi, token]);

  useEffect(() => {
    void load();
    return () => { requestId.current++; };
  }, [load]);

  async function save(row: DynamicRow) {
    const values: Partial<DynamicRow> = { ...row };
    if (values.id?.startsWith("new-")) delete values.id;
    await callApi("dynamicData", { token, operation: "save", values });
    setEditor(null);
    setFeedback({ kind: "success", text: "Dinámica guardada." });
    await load();
  }

  async function confirmAction() {
    if (!pending) return;
    setBusy(pending.row.id);
    setFeedback(null);
    try {
      const result = await callApi("dynamicData", { token, operation: pending.action, id: pending.row.id });
      if (pending.action === "draw") {
        const names = (result.winnerDetails ?? []).map((winner) => `${winner.firstName} ${winner.lastName}`).join(", ");
        setFeedback({ kind: "success", text: names ? `Sorteo completado: ${names}.` : `Sorteo completado. ${result.winners ?? 0} ganador(es).` });
      } else {
        setFeedback({ kind: "success", text: "Dinámica eliminada." });
      }
      setPending(null);
      setEditor(null);
      await load();
    } catch (error) {
      setFeedback({ kind: "error", text: errorText(error) });
    } finally {
      setBusy(null);
    }
  }

  async function registerParticipation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!scanTarget || !scanCode.trim()) return;
    setBusy(scanTarget.id);
    setFeedback(null);
    try {
      const result = await callApi("dynamicData", {
        token,
        operation: "complete",
        id: scanTarget.id,
        code: scanCode.trim(),
      });
      const participant = result.participant;
      const name = participant ? `${participant.firstName} ${participant.lastName}` : "Participante";
      const message = result.alreadyCompleted
        ? `${name} ya tenía esta dinámica registrada.`
        : scanTarget.type === "instant_win"
          ? result.won
            ? `¡${name} ganó! ${result.prize || scanTarget.prize || "Premio registrado"}.`
            : `${name} participó. Esta vez no hubo premio.`
          : `${name}: dinámica completada${scanTarget.points ? ` · +${scanTarget.points} pts` : ""}.`;
      setFeedback({ kind: "success", text: message });
      setScanCode("");
      await load();
    } catch (error) {
      setFeedback({ kind: "error", text: errorText(error) });
    } finally {
      setBusy(null);
    }
  }

  function addDynamic() {
    setFeedback(null);
    setEditor({
      id: `new-${Date.now()}`,
      name: "",
      description: "",
      type: "qr",
      status: "draft",
      sponsor_brand_id: null,
      points: 100,
      requires_checkin: true,
      prize: "",
      winner_count: 1,
      eligibility_dynamic_id: null,
      config: { win_probability: 0.1 },
    });
  }

  const visible = useMemo(() => rows.filter((row) => {
    const haystack = [row.name, row.description, dynamicTypes[row.type], row.prize].join(" ").toLocaleLowerCase();
    return haystack.includes(query.toLocaleLowerCase()) && (!typeFilter || row.type === typeFilter);
  }), [rows, query, typeFilter]);

  return <section className="management-view" aria-busy={loading}>
    <div className="section-toolbar">
      <div className="list-filters">
        <label className="search-field">
          <span className="sr-only">Buscar dinámicas</span>
          <input type="search" placeholder="Buscar dinámica…" value={query} onChange={e => setQuery(e.target.value)} />
        </label>
        <label>
          <span className="sr-only">Filtrar por tipo</span>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">Todos los tipos</option>
            {Object.entries(dynamicTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>
      <div className="toolbar-actions">
        <button className="button button-secondary" onClick={() => void load()} disabled={loading || !!busy || !!editor}>↻ Actualizar</button>
        <button className="button" onClick={addDynamic} disabled={!!editor || !!busy}>+ Crear dinámica</button>
      </div>
    </div>

    <Feedback value={feedback} />

    {pending && <section className="confirmation-panel" role="region" aria-label="Confirmar acción">
      <h2>{pending.action === "draw" ? "¿Lanzamos el sorteo?" : `¿Eliminar “${pending.row.name}”?`}</h2>
      <p>{pending.action === "draw"
        ? pending.row.eligibility_dynamic_id
          ? `Se elegirán ${pending.row.winner_count} ganador(es) entre quienes completaron la dinámica vinculada y cumplen los requisitos.`
          : `Se elegirán ${pending.row.winner_count} ganador(es) entre los participantes elegibles del evento.`
        : "Se borrará la dinámica y sus participaciones asociadas."}</p>
      <div className="toolbar-actions">
        <button className="button button-secondary" onClick={() => setPending(null)} disabled={!!busy}>Cancelar</button>
        <button className={pending.action === "delete" ? "button button-danger" : "button"} onClick={() => void confirmAction()} disabled={!!busy}>
          {busy ? "Procesando…" : pending.action === "draw" ? "Confirmar y sortear" : "Sí, eliminar"}
        </button>
      </div>
    </section>}

    {scanTarget && <form className="dynamic-scan-panel" onSubmit={registerParticipation}>
      <div>
        <p className="section-label">REGISTRAR PARTICIPACIÓN</p>
        <h2>{scanTarget.name}</h2>
        <p className="muted">Escanea el mismo QR del pase/Wallet del corredor o escribe su código NEO.</p>
      </div>
      <div className="dynamic-scan-controls">
        <input
          autoFocus
          value={scanCode}
          onChange={e => setScanCode(e.target.value)}
          placeholder="NEO-0001 o token del QR"
          autoComplete="off"
        />
        <button className="button" disabled={!scanCode.trim() || busy === scanTarget.id}>{busy === scanTarget.id ? "Registrando…" : "Registrar"}</button>
        <button type="button" className="button button-secondary" onClick={() => { setScanTarget(null); setScanCode(""); }}>Cerrar</button>
      </div>
    </form>}

    {editor?.id.startsWith("new-") && <DynamicEditor row={editor} brands={brands} dynamics={rows} onSave={save} onCancel={() => setEditor(null)} />}

    {loading ? <div className="loading-state" role="status"><span className="loading-line" />Cargando dinámicas…</div> :
      !visible.length ? <div className="empty-state">
        <span className="empty-number" aria-hidden="true">00</span>
        <h2>{query || typeFilter ? "Sin coincidencias" : "Crea la primera dinámica"}</h2>
        <p>{query || typeFilter ? "Prueba otra búsqueda o cambia el filtro." : "Sorteos, QR, checkpoints, retos, misiones, votaciones, instant win y puntos viven aquí."}</p>
        {!query && !typeFilter && !editor && <button className="button" onClick={addDynamic}>+ Crear dinámica</button>}
      </div> :
      <div className="record-list">{visible.map(row => <article className="record dynamic-record" key={row.id}>
        <div className="record-summary">
          <div className="dynamic-type-mark" aria-hidden="true">{dynamicTypeSymbol(row.type)}</div>
          <div className="record-title">
            <h2>{row.name}</h2>
            <p>{dynamicTypes[row.type]}{row.prize ? ` · ${row.prize}` : ""}</p>
          </div>
          <div className="record-meta">
            <StatusBadge status={row.status} label={dynamicStates[row.status]} />
            <small>{row.participations_count ?? 0} participaciones{row.winners_count ? ` · ${row.winners_count} ganador(es)` : ""}</small>
            <small>{row.requires_checkin ? "Requiere check-in" : "Sin check-in obligatorio"}{row.points ? ` · +${row.points} pts` : ""}</small>
            <small>{brands.find(brand => brand.id === row.sponsor_brand_id)?.name || "Sin patrocinador"}</small>
          </div>
          <div className="record-actions">
            <button className="button button-secondary" onClick={() => { setFeedback(null); setEditor(editor?.id === row.id ? null : row); }} disabled={!!busy || (!!editor && editor.id !== row.id)}>Editar</button>
            {row.status === "open" && row.type === "raffle" && <button className="button" onClick={() => setPending({ row, action: "draw" })} disabled={!!busy || !!editor}>Sortear →</button>}
            {row.status === "open" && row.type !== "raffle" && <button className="button" onClick={() => { setScanTarget(row); setScanCode(""); }} disabled={!!busy || !!editor}>Registrar QR →</button>}
          </div>
        </div>
        {editor?.id === row.id && <DynamicEditor row={editor} brands={brands} dynamics={rows} onSave={save} onCancel={() => setEditor(null)} onDelete={() => setPending({ row, action: "delete" })} />}
      </article>)}</div>}
  </section>;
}

function DynamicEditor({ row, brands, dynamics, onSave, onCancel, onDelete }: {
  row: DynamicRow;
  brands: AdminRow[];
  dynamics: DynamicRow[];
  onSave: (row: DynamicRow) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [values, setValues] = useState<DynamicRow>({ ...row, config: { ...(row.config ?? {}) } });
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackValue>(null);

  function update<K extends keyof DynamicRow>(key: K, value: DynamicRow[K]) {
    setValues(current => ({ ...current, [key]: value }));
  }

  function updateWinProbability(percent: number) {
    const safe = Math.max(0, Math.min(100, percent));
    setValues(current => ({ ...current, config: { ...(current.config ?? {}), win_probability: safe / 100 } }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      await onSave(values);
    } catch (error) {
      setFeedback({ kind: "error", text: error instanceof Error ? error.message : "No pudimos guardar la dinámica." });
    } finally {
      setBusy(false);
    }
  }

  const prizeBased = values.type === "raffle" || values.type === "instant_win";
  const probability = Math.round(Number(values.config?.win_probability ?? 0.1) * 100);

  return <form className="record-editor dynamic-editor" onSubmit={submit}>
    <div className="editor-heading">
      <h3>{row.id.startsWith("new-") ? "Nueva dinámica" : `Editar ${row.name}`}</h3>
      <span className="muted">Configura cómo participa la gente y qué desbloquea.</span>
    </div>
    <fieldset disabled={busy}>
      <div className="form-grid two">
        <label>Nombre<input autoFocus required maxLength={120} value={values.name} onChange={e => update("name", e.target.value)} /></label>
        <label>Tipo<select value={values.type} onChange={e => update("type", e.target.value as DynamicType)}>{Object.entries(dynamicTypes).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className="span-full">Descripción<textarea rows={3} value={values.description ?? ""} onChange={e => update("description", e.target.value)} placeholder="Qué debe hacer el corredor y cómo funciona la dinámica." /></label>
        <label>Estado<select value={values.status} onChange={e => update("status", e.target.value as DynamicRow["status"])}>{Object.entries(dynamicStates).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label>Puntos<input type="number" min={0} step={1} value={values.points} onChange={e => update("points", Math.max(0, Number(e.target.value)))} /></label>
        <label className="span-full">Marca patrocinadora<select value={values.sponsor_brand_id ?? ""} onChange={e => update("sponsor_brand_id", e.target.value || null)}><option value="">Sin patrocinador</option>{brands.filter(brand => brand.active || brand.id === values.sponsor_brand_id).map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
        {prizeBased && <>
          <label>Premio<input value={values.prize ?? ""} onChange={e => update("prize", e.target.value)} placeholder="Premio o beneficio" /></label>
          <label>{values.type === "instant_win" ? "Máximo de ganadores" : "Número de ganadores"}<input type="number" min={1} step={1} value={values.winner_count} onChange={e => update("winner_count", Math.max(1, Number(e.target.value)))} /></label>
        </>}
        {values.type === "raffle" && <label className="span-full">Participan quienes completaron<select value={values.eligibility_dynamic_id ?? ""} onChange={e => update("eligibility_dynamic_id", e.target.value || null)}><option value="">Todos los participantes elegibles del evento</option>{dynamics.filter(item => item.id !== values.id && item.type !== "raffle").map(item => <option key={item.id} value={item.id}>{item.name} · {dynamicTypes[item.type]}</option>)}</select><small>Así puedes hacer, por ejemplo, una rifa exclusiva para quienes visitaron un stand o completaron un reto.</small></label>}
        {values.type === "instant_win" && <label className="span-full">Probabilidad de ganar por escaneo<input type="number" min={0} max={100} step={1} value={probability} onChange={e => updateWinProbability(Number(e.target.value))} /><small>Se respeta también el máximo de ganadores definido arriba.</small></label>}
        <label className="check-label span-full"><input type="checkbox" checked={values.requires_checkin} onChange={e => update("requires_checkin", e.target.checked)} />Requiere check-in para participar</label>
      </div>
    </fieldset>
    <Feedback value={feedback} />
    <div className="editor-actions">
      <button className="button" disabled={busy}>{busy ? "Guardando…" : "Guardar dinámica"}</button>
      <button type="button" className="button button-secondary" onClick={onCancel} disabled={busy}>Cancelar</button>
      {onDelete && <button type="button" className="text-link danger-text" onClick={onDelete} disabled={busy}>Eliminar</button>}
    </div>
  </form>;
}

function dynamicTypeSymbol(type: DynamicType) {
  return ({
    raffle: "✦",
    qr: "⌁",
    checkpoint: "◎",
    challenge: "↗",
    trivia: "?",
    mission: "✓",
    voting: "◉",
    instant_win: "⚡",
    points: "+",
  } satisfies Record<DynamicType, string>)[type];
}
