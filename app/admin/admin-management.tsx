"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AdminApi, AdminRow, AdminSection, FeedbackValue, Metrics, Resource } from "./admin-types";
import { brandTypes, participantStates, raffleStates } from "./admin-types";
import { Feedback, Logo, StatusBadge } from "./admin-ui";
import { RecordEditor } from "./record-editor";

export function AdminManagement({ token, callApi, section, navigate }: {
  token: string; callApi: AdminApi; section: Resource | "metrics"; navigate: (section: AdminSection) => void;
}) {
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [brands, setBrands] = useState<AdminRow[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackValue>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [editor, setEditor] = useState<AdminRow | null>(null);
  const [confirmation, setConfirmation] = useState<{ row: AdminRow; action: "delete" | "draw" } | null>(null);
  const requestId = useRef(0);
  const errorText = (error: unknown) => error instanceof Error ? error.message : "No pudimos completar la operación. Inténtalo de nuevo.";

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const [data, sponsors] = await Promise.all([
        callApi("adminData", {token, resource: section, operation: "list"}),
        section === "raffles" ? callApi("adminData", {token,resource:"brands",operation:"list"}) : Promise.resolve(null),
      ]);
      if (id !== requestId.current) return;
      setRows(data.rows ?? []);
      setMetrics(data.metrics ?? null);
      setBrands(sponsors?.rows ?? []);
    } catch (error) {
      if (id === requestId.current) setFeedback({kind:"error",text:errorText(error)});
    } finally { if (id === requestId.current) setLoading(false); }
  }, [callApi, section, token]);
  useEffect(() => { void load(); return () => { requestId.current++; }; }, [load]);

  async function save(row: AdminRow) {
    const values: Partial<AdminRow> = {...row};
    if (values.id?.startsWith("new-")) delete values.id;
    await callApi("adminData", {token,resource:section,operation:"save",values});
    setEditor(null);
    setFeedback({kind:"success",text:"Cambios guardados."});
    await load();
  }
  async function changeAttendance(row: AdminRow, next: string) {
    setBusy(row.id); setFeedback(null);
    try {
      await callApi("adminData", {token,resource:"participants",operation:"save",values:{id:row.id,status:next}});
      setRows(current => current.map(item => item.id === row.id ? {...item,status:next} : item));
      setFeedback({kind:"success",text:`${row.first_name}: ${participantStates[next]}.`});
    } catch (error) { setFeedback({kind:"error",text:errorText(error)}); }
    finally { setBusy(null); }
  }
  async function confirmAction() {
    if (!confirmation) return;
    setBusy(confirmation.row.id); setFeedback(null);
    try {
      const result = await callApi("adminData", {token,resource:section,operation:confirmation.action,id:confirmation.row.id});
      setFeedback({kind:"success",text:confirmation.action === "draw" ? `Sorteo completado. ${result.winners ?? "Los"} ganadores guardados.` : "Registro eliminado."});
      setConfirmation(null); setEditor(null); await load();
    } catch (error) { setFeedback({kind:"error",text:errorText(error)}); }
    finally { setBusy(null); }
  }
  function addRecord() {
    setFeedback(null);
    setEditor(section === "raffles" ? {id:`new-${Date.now()}`,name:"",prize:"",description:"",winner_count:1,requires_checkin:true,status:"draft"} : {id:`new-${Date.now()}`,name:"",slug:"",logo_url:"",instagram:"",active:true,show_on_home:true,sort_order:rows.length,type:"sponsor",invited:false});
  }
  const visible = rows.filter(row => {
    const text = [row.first_name,row.last_name,row.email,row.phone,row.name,row.document_number,row.registration_code,row.running_groups?.name,row.other_running_group].join(" ").toLocaleLowerCase();
    return text.includes(query.toLocaleLowerCase()) && (!status || row.status === status);
  });
  const newLabel = section === "brands" ? "Añadir marca" : section === "groups" ? "Añadir grupo" : "Crear rifa";

  return <section className="management-view" aria-busy={loading}>
    <div className="section-toolbar">
      {section === "metrics" ? <p className="muted">Resumen del evento</p> : <div className="list-filters"><label className="search-field"><span className="sr-only">Buscar {section === "participants" ? "participantes" : "registros"}</span><input type="search" placeholder={section === "participants" ? "Nombre, código, contacto…" : "Buscar por nombre…"} value={query} onChange={e => setQuery(e.target.value)} /></label>{section === "participants" && <label><span className="sr-only">Filtrar por estado</span><select value={status} onChange={e => setStatus(e.target.value)}><option value="">Todos los estados</option>{Object.entries(participantStates).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>}</div>}
      <div className="toolbar-actions"><button className="button button-secondary" onClick={() => {setFeedback(null); void load();}} disabled={loading || !!busy || !!editor}>{loading ? "Cargando…" : "↻ Actualizar"}</button>{section !== "metrics" && section !== "participants" && <button className="button" onClick={addRecord} disabled={!!editor || !!busy}>+ {newLabel}</button>}</div>
    </div>
    <Feedback value={feedback} />
    {confirmation && <section className="confirmation-panel" role="region" aria-label="Confirmar acción">
      <h2>{confirmation.action === "draw" ? "¿Todo listo para el sorteo?" : `¿Eliminar ${confirmation.row.name}?`}</h2>
      <p>{confirmation.action === "draw" ? `Se sortearán ${confirmation.row.winner_count} ganadores para “${confirmation.row.name}”. ${confirmation.row.requires_checkin ? "Participan quienes hayan hecho check-in." : "Participan los inscritos elegibles."} Los resultados se guardarán al confirmar.` : "Se eliminará este registro. Puedes cancelar y conservarlo."}</p>
      <div className="toolbar-actions"><button className="button button-secondary" autoFocus onClick={() => setConfirmation(null)} disabled={!!busy}>Cancelar</button><button className={`button ${confirmation.action === "delete" ? "button-danger" : ""}`} onClick={() => void confirmAction()} disabled={!!busy}>{busy ? "Procesando…" : confirmation.action === "draw" ? "Confirmar y sortear" : "Sí, eliminar"}</button></div>
    </section>}
    {editor?.id.startsWith("new-") && <RecordEditor key={editor.id} row={editor} resource={section as Resource} brands={brands} token={token} callApi={callApi} onSave={save} onCancel={() => setEditor(null)} />}
    {loading ? <div className="loading-state" role="status"><span className="loading-line" />Cargando {section === "metrics" ? "resumen" : "registros"}…</div> : section === "metrics" ? <>
      <div className="metric-grid">{([
        ["Inscritos",metrics?.registered,"Registros no cancelados"], ["Check-in",metrics?.checkedIn,"Asistencia confirmada"],
        ["Grupos",metrics?.groups,"Representados en registros"], ["Marcas",metrics?.brands,"Aliados activos"], ["Rifas",metrics?.raffles,"Premios configurados"],
      ] as const).map(([label,value,detail],index) => <article key={label}><span>{label}</span><strong>{value ?? "—"}</strong><small>{detail}</small><span className="metric-index" aria-hidden="true">0{index + 1}</span></article>)}</div>
      <section className="quick-access"><p className="section-label">EN MARCHA</p><h2>Gestiona el encuentro</h2><div>{([ ["participants","Participantes","Lista y check-in"], ["groups","Grupos","Comunidades invitadas"], ["brands","Marcas","Aliados y logos"], ["raffles","Rifas","Premios y sorteos"] ] as const).map(([id,title,detail]) => <button key={id} onClick={() => navigate(id)}><span><strong>{title}</strong><small>{detail}</small></span><span aria-hidden="true">↗</span></button>)}</div></section>
    </> : !visible.length ? <div className="empty-state"><span className="empty-number" aria-hidden="true">00</span><h2>{query || status ? "Sin coincidencias" : section === "participants" ? "La salida empieza aquí" : "Todo listo para empezar"}</h2><p>{query || status ? "Prueba otra búsqueda o cambia el filtro." : section === "participants" ? "Cuando lleguen las inscripciones, podrás encontrarlas y registrar su check-in aquí." : `Añade ${section === "brands" ? "tu primera marca" : section === "groups" ? "tu primer grupo" : "tu primera rifa"} para preparar el evento.`}</p>{query || status ? <button className="button button-secondary" onClick={() => {setQuery("");setStatus("");}}>Limpiar filtros</button> : section !== "participants" && !editor && <button className="button" onClick={addRecord}>{newLabel}</button>}</div> : section === "participants" ? <>
      <p className="result-count">{visible.length} de {rows.length} participantes</p>
      <div className="participants-table"><table><thead><tr><th>Participante</th><th>Código</th><th>Contacto</th><th>Grupo</th><th>Talla</th><th>Estado</th><th>Asistencia</th></tr></thead><tbody>{visible.map(row => <tr key={row.id}>
        <td data-label="Participante"><strong>{row.first_name} {row.last_name}</strong><small>{row.document_type} {row.document_number}</small></td>
        <td data-label="Código" className="mono-value">{row.registration_code || `#${row.registration_number}`}</td>
        <td data-label="Contacto"><span>{row.email}</span><small>{row.phone}</small></td>
        <td data-label="Grupo">{row.running_groups?.name || row.other_running_group || "Independiente"}</td>
        <td data-label="Talla">{row.shirt_size || "—"}</td>
        <td data-label="Estado"><StatusBadge status={row.status ?? "registered"} label={participantStates[row.status ?? "registered"] ?? row.status ?? "Inscrito"} /></td>
        <td data-label="Asistencia"><div className="attendance-actions">{row.status === "registered" && <button className="button button-small" onClick={() => void changeAttendance(row,"checked_in")} disabled={!!busy}>{busy === row.id ? "Guardando…" : "Check-in ✓"}</button>}<select aria-label={`Estado de ${row.first_name} ${row.last_name}`} value={row.status} onChange={e => void changeAttendance(row,e.target.value)} disabled={!!busy}>{Object.entries(participantStates).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></div></td>
      </tr>)}</tbody></table></div>
    </> : <div className="record-list">{visible.map(row => <article className="record" key={row.id}>
      <div className="record-summary">
        {section !== "raffles" && <Logo url={row.logo_url} name={row.name || "Sin nombre"} />}
        <div className="record-title"><h2>{row.name}</h2>{section === "raffles" ? <p>{row.prize}</p> : <p>{section === "brands" ? brandTypes[row.type ?? "invited"] : row.invited ? "Grupo invitado" : "Running crew"}</p>}</div>
        <div className="record-meta">{section === "raffles" ? <><StatusBadge status={row.status ?? "draft"} label={raffleStates[row.status ?? "draft"]} /><small>{row.winner_count} ganador{row.winner_count === 1 ? "" : "es"} · {row.requires_checkin ? "Con check-in" : "Sin check-in obligatorio"}</small><small>{brands.find(brand => brand.id === row.sponsor_brand_id)?.name || "Sin patrocinador"}</small></> : <><StatusBadge status={row.active ? "open" : "cancelled"} label={row.active ? "Activo" : "Inactivo"} /><small>{row.show_on_home ? "Visible en web" : "Oculto en web"}</small><small>{row.instagram || row.website || "Sin redes añadidas"}</small></>}</div>
        <div className="record-actions"><button className="button button-secondary" aria-expanded={editor?.id === row.id} onClick={() => {setFeedback(null);setEditor(editor?.id === row.id ? null : row);}} disabled={!!busy || (!!editor && editor.id !== row.id)}>Editar</button>{section === "raffles" && row.status === "open" && <button className="button" onClick={() => setConfirmation({row,action:"draw"})} disabled={!!busy || !!editor}>Sortear →</button>}</div>
      </div>
      {editor?.id === row.id && <RecordEditor row={editor} resource={section as Resource} brands={brands} token={token} callApi={callApi} onSave={save} onCancel={() => setEditor(null)} onDelete={() => setConfirmation({row,action:"delete"})} />}
    </article>)}</div>}
  </section>;
}

