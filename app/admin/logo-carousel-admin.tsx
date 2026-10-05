"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from "react";
import type { AdminApi, FeedbackValue } from "./admin-types";
import { Feedback, Logo, StatusBadge } from "./admin-ui";

type LogoRow = {
  id: string;
  name: string;
  logo_url: string;
  link_url?: string | null;
  active: boolean;
  sort_order: number;
};

type LogoResponse = { ok?: boolean; rows?: LogoRow[]; error?: string };

async function callLogoApi(action: string, payload: Record<string, unknown>) {
  const response = await fetch("/api/admin/logos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = (await response.json().catch(() => ({}))) as LogoResponse;
  if (!response.ok) throw new Error(data.error || "No pudimos gestionar el carrusel de logos.");
  return data;
}

export function LogoCarouselAdmin({ token, callApi }: { token: string; callApi: AdminApi }) {
  const [rows, setRows] = useState<LogoRow[]>([]);
  const [editor, setEditor] = useState<LogoRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackValue>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const data = await callLogoApi("list", { token });
      if (id !== requestId.current) return;
      setRows(data.rows ?? []);
    } catch (error) {
      if (id === requestId.current) setFeedback({ kind: "error", text: error instanceof Error ? error.message : "No pudimos cargar los logos." });
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
    return () => { requestId.current++; };
  }, [load]);

  function addLogo() {
    setFeedback(null);
    setConfirmingId(null);
    setEditor({ id: `new-${Date.now()}`, name: "", logo_url: "", link_url: "", active: true, sort_order: rows.length });
  }

  async function save(values: LogoRow) {
    setBusy(true);
    setFeedback(null);
    try {
      const payload: Record<string, unknown> = {
        name: values.name,
        logo_url: values.logo_url,
        link_url: values.link_url || null,
        active: values.active,
        sort_order: values.sort_order,
      };
      if (!values.id.startsWith("new-")) payload.id = values.id;
      await callLogoApi("save", { token, values: payload });
      setEditor(null);
      setFeedback({ kind: "success", text: "Logo guardado. La cinta de la Home ya usa esta configuración." });
      await load();
    } catch (error) {
      setFeedback({ kind: "error", text: error instanceof Error ? error.message : "No pudimos guardar el logo." });
    } finally {
      setBusy(false);
    }
  }

  async function remove(row: LogoRow) {
    if (confirmingId !== row.id) {
      setConfirmingId(row.id);
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      await callLogoApi("delete", { token, id: row.id });
      setConfirmingId(null);
      if (editor?.id === row.id) setEditor(null);
      setFeedback({ kind: "success", text: `${row.name} eliminado del carrusel.` });
      await load();
    } catch (error) {
      setFeedback({ kind: "error", text: error instanceof Error ? error.message : "No pudimos eliminar el logo." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="management-view" aria-busy={loading}>
      <div className="section-toolbar">
        <div>
          <h2>Logos de la cinta</h2>
          <p className="muted">Sube cada logo una sola vez. La web duplica la lista automáticamente para crear el movimiento infinito.</p>
        </div>
        <div className="toolbar-actions">
          <button className="button button-secondary" onClick={() => void load()} disabled={loading || busy || !!editor}>{loading ? "Cargando…" : "↻ Actualizar"}</button>
          <button className="button" onClick={addLogo} disabled={busy || !!editor}>+ Añadir logo</button>
        </div>
      </div>

      <Feedback value={feedback} />

      {editor?.id.startsWith("new-") && (
        <LogoEditor row={editor} token={token} callApi={callApi} busy={busy} uploading={uploading} setUploading={setUploading} onSave={save} onCancel={() => setEditor(null)} />
      )}

      {loading ? (
        <div className="loading-state" role="status"><span className="loading-line" />Cargando logos…</div>
      ) : !rows.length ? (
        <div className="empty-state">
          <span className="empty-number" aria-hidden="true">00</span>
          <h2>Añade los logos del carrusel</h2>
          <p>Sube imágenes horizontales de marcas, aliados o patrocinadores. Se mostrarán en una cinta continua en la Home.</p>
          {!editor && <button className="button" onClick={addLogo}>+ Añadir primer logo</button>}
        </div>
      ) : (
        <div className="record-list">
          {rows.map((row) => (
            <article className="record" key={row.id}>
              <div className="record-summary">
                <Logo url={row.logo_url} name={row.name} />
                <div className="record-title"><h2>{row.name}</h2><p>Posición {row.sort_order}</p></div>
                <div className="record-meta">
                  <StatusBadge status={row.active ? "open" : "cancelled"} label={row.active ? "Visible" : "Oculto"} />
                  <small>{row.link_url || "Sin enlace"}</small>
                </div>
                <div className="record-actions">
                  <button className="button button-secondary" onClick={() => { setConfirmingId(null); setEditor(editor?.id === row.id ? null : row); }} disabled={busy || (!!editor && editor.id !== row.id)}>Editar</button>
                  <button className={confirmingId === row.id ? "button button-danger" : "text-link danger-text"} onClick={() => void remove(row)} disabled={busy || (!!editor && editor.id !== row.id)}>{confirmingId === row.id ? "Confirmar eliminar" : "Eliminar"}</button>
                </div>
              </div>
              {editor?.id === row.id && (
                <LogoEditor row={editor} token={token} callApi={callApi} busy={busy} uploading={uploading} setUploading={setUploading} onSave={save} onCancel={() => setEditor(null)} />
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function LogoEditor({ row, token, callApi, busy, uploading, setUploading, onSave, onCancel }: {
  row: LogoRow;
  token: string;
  callApi: AdminApi;
  busy: boolean;
  uploading: boolean;
  setUploading: (value: boolean) => void;
  onSave: (row: LogoRow) => Promise<void>;
  onCancel: () => void;
}) {
  const [values, setValues] = useState({ ...row });
  const [feedback, setFeedback] = useState<FeedbackValue>(null);

  function update<K extends keyof LogoRow>(key: K, value: LogoRow[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values.logo_url) {
      setFeedback({ kind: "error", text: "Sube una imagen antes de guardar el logo." });
      return;
    }
    await onSave(values);
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setFeedback({ kind: "error", text: "La imagen debe pesar menos de 4 MB." });
      input.value = "";
      return;
    }
    setUploading(true);
    setFeedback(null);
    try {
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
        reader.onerror = () => reject(new Error("No pudimos leer la imagen."));
        reader.readAsDataURL(file);
      });
      const result = await callApi("uploadAdminImage", { token, mime: file.type, content });
      if (!result.url) throw new Error("No pudimos obtener la imagen subida.");
      update("logo_url", result.url);
      setFeedback({ kind: "success", text: "Imagen subida. Guarda el logo para publicarlo." });
    } catch (error) {
      setFeedback({ kind: "error", text: error instanceof Error ? error.message : "No pudimos subir la imagen." });
    } finally {
      setUploading(false);
      input.value = "";
    }
  }

  return (
    <form className="record-editor" onSubmit={submit}>
      <div className="editor-heading"><h3>{row.id.startsWith("new-") ? "Nuevo logo" : `Editar ${row.name}`}</h3><span className="muted">Recomendado: logo horizontal en PNG o WEBP con fondo transparente.</span></div>
      <fieldset disabled={busy || uploading}>
        <legend className="sr-only">Datos del logo</legend>
        <div className="form-grid two">
          <label>Nombre<input autoFocus required maxLength={120} value={values.name} onChange={(event) => update("name", event.target.value)} /></label>
          <label>Orden<input type="number" step={1} value={values.sort_order} onChange={(event) => update("sort_order", Number(event.target.value))} /><small>Los números menores aparecen primero.</small></label>
          <label className="span-full">Enlace opcional<input type="url" placeholder="https://" value={values.link_url ?? ""} onChange={(event) => update("link_url", event.target.value)} /><small>Si lo dejas vacío, el logo no será clicable.</small></label>
          <label className="upload-field span-full">
            <Logo url={values.logo_url} name={values.name || "Logo"} />
            <span><strong>{uploading ? "Subiendo imagen…" : values.logo_url ? "Cambiar imagen" : "Añadir imagen"}</strong><small>PNG, JPG o WEBP · máximo 4 MB · preferiblemente horizontal</small><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void upload(event)} aria-label="Seleccionar logo" /></span>
          </label>
          <label className="check-label"><input type="checkbox" checked={values.active} onChange={(event) => update("active", event.target.checked)} />Mostrar en el carrusel</label>
        </div>
      </fieldset>
      <Feedback value={feedback} />
      <div className="editor-actions"><button className="button" disabled={busy || uploading}>{busy ? "Guardando…" : uploading ? "Subiendo imagen…" : "Guardar logo"}</button><button type="button" className="button button-secondary" onClick={onCancel} disabled={busy || uploading}>Cancelar</button></div>
    </form>
  );
}
