"use client";

import { ChangeEvent, useCallback, useEffect, useState } from "react";

type Row = Record<string, any>;
type Metrics = { registered: number; checkedIn: number; groups: number; brands: number; raffles: number };
const sections = [
  ["participants", "Participantes"], ["groups", "Grupos"], ["brands", "Marcas"], ["raffles", "Rifas"], ["metrics", "Métricas"],
] as const;

export function AdminManagement({ token, callApi, onMessage }: {
  token: string;
  callApi: (action: string, payload?: Record<string, unknown>) => Promise<any>;
  onMessage: (message: string) => void;
}) {
  const [section, setSection] = useState<string>("participants");
  const [rows, setRows] = useState<Row[]>([]);
  const [brandOptions, setBrandOptions] = useState<Row[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const load = useCallback(async (current = section) => {
    setLoading(true);
    try {
      if (current === "metrics") {
        const result = await callApi("adminData", { token, resource: "metrics", operation: "list" });
        setMetrics(result.metrics);
      } else {
        if (current === "raffles") {
          const brands = await callApi("adminData", { token, resource: "brands", operation: "list" });
          setBrandOptions(brands.rows ?? []);
        }
        const result = await callApi("adminData", { token, resource: current, operation: "list" });
        setRows(result.rows ?? []);
      }
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "No pudimos cargar esta sección.");
    } finally { setLoading(false); }
  }, [callApi, onMessage, section, token]);

  useEffect(() => { void load(section); }, [section, load]);

  async function save(row: Row, resource = section) {
    try {
      const values = { ...row };
      if (String(values.id ?? "").startsWith("new-")) delete values.id;
      await callApi("adminData", { token, resource, operation: "save", values });
      onMessage("Cambios guardados.");
      await load(resource);
    } catch (error) { onMessage(error instanceof Error ? error.message : "No pudimos guardar los cambios."); }
  }

  async function remove(row: Row) {
    if (String(row.id ?? "").startsWith("new-")) {
      setRows(current => current.filter(item => item.id !== row.id));
      return;
    }
    if (!window.confirm(`¿Eliminar “${row.name}”?`)) return;
    try {
      await callApi("adminData", { token, resource: section, operation: "delete", id: row.id });
      await load();
      onMessage("Registro eliminado.");
    } catch (error) { onMessage(error instanceof Error ? error.message : "No pudimos eliminarlo."); }
  }

  async function uploadImage(event: ChangeEvent<HTMLInputElement>, row: Row) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { onMessage("La imagen debe pesar menos de 4 MB."); return; }
    const content = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    try {
      const result = await callApi("uploadAdminImage", { token, mime: file.type, content });
      setRows(current => current.map(item => item.id === row.id ? { ...item, logo_url: result.url } : item));
      onMessage("Imagen subida. Guarda la marca o el grupo para publicar el cambio.");
    } catch (error) { onMessage(error instanceof Error ? error.message : "No pudimos subir la imagen."); }
    event.target.value = "";
  }

  const filteredRows = rows.filter(row => `${row.first_name ?? ""} ${row.last_name ?? ""} ${row.email ?? ""} ${row.phone ?? ""} ${row.name ?? ""} ${row.document_number ?? ""}`.toLowerCase().includes(query.toLowerCase()));
  const cards = section === "brands" || section === "groups";

  return <section className="admin-panel-card admin-management">
    <div className="admin-section-heading"><div><p className="section-label">GESTIÓN DEL EVENTO</p><h2>Administra el Social Run</h2></div><button className="button" onClick={() => void load()} disabled={loading}>Actualizar</button></div>
    <div className="admin-module-tabs" role="tablist">
      {sections.map(([id, label]) => <button key={id} role="tab" aria-selected={section === id} className={section === id ? "active" : ""} onClick={() => { setQuery(""); setSection(id); }}>{label}</button>)}
    </div>
    {loading ? <p className="admin-empty">Cargando datos…</p> : section === "metrics" ? <div className="admin-live-metrics">
      {[["Inscritos", metrics?.registered], ["Check-in", metrics?.checkedIn], ["Grupos representados", metrics?.groups], ["Marcas activas", metrics?.brands], ["Rifas", metrics?.raffles]].map(([label, value]) => <article key={String(label)}><span>{label}</span><strong>{value ?? "—"}</strong></article>)}
      <p>Datos en tiempo real del evento conectado en Supabase.</p>
    </div> : <>
      <div className="admin-list-toolbar"><input aria-label="Buscar" placeholder={section === "participants" ? "Buscar nombre, correo, celular o documento" : "Buscar"} value={query} onChange={e => setQuery(e.target.value)} />
        {(section === "brands" || section === "groups") && <button className="button" onClick={() => setRows(current => [...current, { id: `new-${Date.now()}`, name: "", slug: "", logo_url: "", instagram: "", active: true, show_on_home: true, sort_order: current.length, type: "sponsor", invited: false }])}>Añadir {section === "brands" ? "marca" : "grupo"}</button>}
        {section === "raffles" && <button className="button" onClick={() => setRows(current => [...current, { id: `new-${Date.now()}`, name: "", prize: "", description: "", winner_count: 1, requires_checkin: true, status: "draft" }])}>Crear rifa</button>}
      </div>
      {!filteredRows.length ? <p className="admin-empty">{section === "participants" ? "Todavía no hay participantes registrados." : "No hay registros para mostrar. Puedes añadir uno con el botón de arriba."}</p> : <div className="admin-record-list">
        {filteredRows.map((row, index) => <article className="admin-record" key={row.id}>
          {section === "participants" ? <>
            <div className="admin-record-main"><strong>{row.first_name} {row.last_name}</strong><small>{row.registration_code || `Registro #${row.registration_number}`} · {row.email} · {row.phone}</small><small>{row.document_type} {row.document_number} · Talla {row.shirt_size || "—"}</small></div>
            <div className="admin-record-main"><small>Grupo: {row.running_groups?.name || row.other_running_group || "Independiente"}</small></div>
            <label className="admin-inline-field">Asistencia<select value={row.status} onChange={e => void save({ id: row.id, status: e.target.value })}><option value="registered">Inscrito</option><option value="checked_in">Check-in</option><option value="no_show">No asistió</option><option value="cancelled">Cancelado</option></select></label>
          </> : section === "raffles" ? <RaffleEditor row={row} brands={brandOptions} save={save} remove={remove} callApi={callApi} token={token} refresh={() => load()} /> : <>
            <div className="admin-record-main"><strong>{row.name || "Nuevo registro"}</strong>{row.logo_url && <img className="admin-logo-preview" src={row.logo_url} alt={`Logo ${row.name}`} />}<small>{cards ? (section === "brands" ? row.type : row.invited ? "Invitado" : "Grupo") : ""}</small></div>
            <div className="admin-record-form">
              <label>Nombre<input value={row.name} onChange={e => setRows(items => items.map((x,i) => i === index ? {...x,name:e.target.value} : x))} /></label>
              {section === "brands" && <label>Tipo<select value={row.type} onChange={e => setRows(items => items.map((x,i) => i===index?{...x,type:e.target.value}:x))}><option value="organizer">Organizador</option><option value="main_partner">Aliado principal</option><option value="sponsor">Patrocinador</option><option value="invited">Invitado</option></select></label>}
              <label>Instagram<input placeholder="@usuario" value={row.instagram ?? ""} onChange={e => setRows(items => items.map((x,i) => i===index?{...x,instagram:e.target.value}:x))} /></label>
              {section === "brands" && <label>Sitio web<input placeholder="https://" value={row.website ?? ""} onChange={e => setRows(items => items.map((x,i) => i===index?{...x,website:e.target.value}:x))} /></label>}
              <label>Logo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => void uploadImage(e,row)} /></label>
              <label className="admin-toggle"><input type="checkbox" checked={row.show_on_home} onChange={e => setRows(items => items.map((x,i) => i===index?{...x,show_on_home:e.target.checked}:x))} /> Mostrar en página</label>
              <label className="admin-toggle"><input type="checkbox" checked={row.active} onChange={e => setRows(items => items.map((x,i) => i===index?{...x,active:e.target.checked}:x))} /> Activo</label>
              <div className="admin-row-actions"><button className="button" onClick={() => void save(row)}>Guardar</button><button className="text-link" onClick={() => void remove(row)}>Eliminar</button></div>
            </div>
          </>}
        </article>)}
      </div>}
    </>}
  </section>;
}

function RaffleEditor({ row, brands, save, remove, callApi, token, refresh }: any) {
  const [values, setValues] = useState(row);
  async function draw() {
    try { await callApi("adminData", { token, resource: "raffles", operation: "draw", id: row.id }); await refresh(); }
    catch (error) { alert(error instanceof Error ? error.message : "No pudimos sortear."); }
  }
  const field = (key: string, label: string) => <label>{label}<input value={values[key] ?? ""} onChange={e => setValues({...values,[key]:e.target.value})} /></label>;
  return <div className="admin-record-form"><strong>{row.name || "Nueva rifa"}</strong>{field("name","Nombre de la rifa")}{field("prize","Premio")}{field("description","Descripción")}
    <label>Ganadores<input type="number" min="1" value={values.winner_count ?? 1} onChange={e => setValues({...values,winner_count:Number(e.target.value)})} /></label>
    <label>Estado<select value={values.status ?? "draft"} onChange={e => setValues({...values,status:e.target.value})}><option value="draft">Borrador</option><option value="open">Abierta</option><option value="drawn">Sorteada</option><option value="cancelled">Cancelada</option></select></label>
    <label>Marca patrocinadora<select value={values.sponsor_brand_id ?? ""} onChange={e => setValues({...values,sponsor_brand_id:e.target.value || null})}><option value="">Sin patrocinador</option>{brands.filter((brand: Row) => brand.active).map((brand: Row) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
    <label className="admin-toggle"><input type="checkbox" checked={Boolean(values.requires_checkin)} onChange={e => setValues({...values,requires_checkin:e.target.checked})} /> Requiere check-in</label>
    <div className="admin-row-actions"><button className="button" onClick={() => void save(values,"raffles")}>Guardar rifa</button>{row.id && !String(row.id).startsWith("new-") && values.status === "open" && <button className="button" onClick={() => void draw()}>Sortear ganadores</button>}<button className="text-link" onClick={() => void remove(row)}>Eliminar</button></div>
  </div>;
}
