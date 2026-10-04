"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import type { AdminApi, AdminRow, FeedbackValue, Resource } from "./admin-types";
import { brandTypes, raffleStates } from "./admin-types";
import { Feedback, Logo } from "./admin-ui";

export function RecordEditor({row,resource,brands,token,callApi,onSave,onCancel,onDelete}: {
  row:AdminRow; resource:Resource; brands:AdminRow[]; token:string; callApi:AdminApi;
  onSave:(row:AdminRow)=>Promise<void>; onCancel:()=>void; onDelete?:()=>void;
}) {
  const [values,setValues] = useState({...row});
  const [busy,setBusy] = useState(false);
  const [uploading,setUploading] = useState(false);
  const [feedback,setFeedback] = useState<FeedbackValue>(null);
  const raffle = resource === "raffles";
  function update<K extends keyof AdminRow>(key:K,value:AdminRow[K]) {setValues(current => ({...current,[key]:value}));}
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setFeedback(null);
    try {await onSave(values);} catch(error) {setFeedback({kind:"error",text:error instanceof Error ? error.message : "No pudimos guardar los cambios."});} finally {setBusy(false);}
  }
  async function upload(event:ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {setFeedback({kind:"error",text:"La imagen debe pesar menos de 4 MB."}); input.value="";return;}
    setUploading(true);setFeedback(null);
    try {
      const content = await new Promise<string>((resolve,reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
        reader.onerror = () => reject(new Error("No pudimos leer la imagen. Intenta seleccionar el archivo otra vez.")); reader.readAsDataURL(file);
      });
      const result = await callApi("uploadAdminImage",{token,mime:file.type,content});
      if (!result.url) throw new Error("No pudimos obtener la imagen subida.");
      update("logo_url",result.url); setFeedback({kind:"success",text:"Imagen subida. Guarda los cambios para publicarla."});
    } catch(error) {setFeedback({kind:"error",text:error instanceof Error ? error.message : "No pudimos subir la imagen."});}
    finally {setUploading(false);input.value="";}
  }
  return <form className="record-editor" onSubmit={submit}>
    <div className="editor-heading"><h3>{row.id.startsWith("new-") ? `Nuev${resource === "groups" ? "o grupo" : resource === "brands" ? "a marca" : "a rifa"}` : `Editar ${row.name}`}</h3><span className="muted">Los cambios se publican al guardar.</span></div>
    <fieldset disabled={busy || uploading}><legend className="sr-only">Datos del registro</legend>
      <div className="form-grid two">
        <label>Nombre<input autoFocus value={values.name ?? ""} required maxLength={120} onChange={e => update("name",e.target.value)} /></label>
        {resource === "brands" && <label>Tipo<select value={values.type ?? "invited"} onChange={e => update("type",e.target.value)}>{Object.entries(brandTypes).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>}
        {raffle ? <><label>Premio<input value={values.prize ?? ""} required onChange={e => update("prize",e.target.value)} /></label><label className="span-full">Descripción<textarea rows={2} value={values.description ?? ""} onChange={e => update("description",e.target.value)} /></label><label>Número de ganadores<input type="number" min={1} step={1} required value={values.winner_count ?? 1} onChange={e => update("winner_count",Number(e.target.value))} /></label><label>Estado<select value={values.status ?? "draft"} onChange={e => update("status",e.target.value)}>{Object.entries(raffleStates).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label><label className="span-full">Marca patrocinadora<select value={values.sponsor_brand_id ?? ""} onChange={e => update("sponsor_brand_id",e.target.value || null)}><option value="">Sin patrocinador</option>{brands.filter(brand => brand.active || brand.id === values.sponsor_brand_id).map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label><label className="check-label span-full"><input type="checkbox" checked={Boolean(values.requires_checkin)} onChange={e => update("requires_checkin",e.target.checked)} />Requiere check-in para participar</label></> : <>
          <label>Instagram<input placeholder="@usuario" value={values.instagram ?? ""} onChange={e => update("instagram",e.target.value)} /></label>
          {resource === "brands" && <label>Sitio web<input placeholder="https://" value={values.website ?? ""} onChange={e => update("website",e.target.value)} /></label>}
          <label className="upload-field span-full"><Logo url={values.logo_url} name={values.name || "Logo"} /><span><strong>{uploading ? "Subiendo imagen…" : values.logo_url ? "Cambiar logo" : "Añadir logo"}</strong><small>PNG, JPG o WEBP · máximo 4 MB</small><input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => void upload(e)} aria-label="Seleccionar logo" /></span></label>
          <label className="check-label"><input type="checkbox" checked={Boolean(values.show_on_home)} onChange={e => update("show_on_home",e.target.checked)} />Mostrar en página</label><label className="check-label"><input type="checkbox" checked={Boolean(values.active)} onChange={e => update("active",e.target.checked)} />Activo</label>
        </>}
      </div>
    </fieldset>
    <Feedback value={feedback} />
    <div className="editor-actions"><button className="button" disabled={busy || uploading}>{busy ? "Guardando…" : uploading ? "Subiendo imagen…" : "Guardar cambios"}</button><button type="button" className="button button-secondary" onClick={onCancel} disabled={busy || uploading}>Cancelar</button>{onDelete && <button type="button" className="text-link danger-text" onClick={onDelete} disabled={busy || uploading}>Eliminar</button>}</div>
  </form>;
}

