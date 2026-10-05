// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers });
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function requireSession(token: unknown) {
  if (typeof token !== "string" || token.length < 32) return null;
  const tokenHash = await sha256(token);
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("admin_pin_sessions")
    .select("id,expires_at")
    .eq("token_hash", tokenHash)
    .gt("expires_at", now)
    .maybeSingle();
  if (error || !data) return null;
  await supabase.from("admin_pin_sessions").update({ last_seen_at: now }).eq("id", data.id);
  return data;
}

function normalizeScannedValue(value: unknown) {
  if (typeof value !== "string") return "";
  let result = value.trim();
  if (result.toUpperCase().startsWith("NEOTEAM-SR26:")) result = result.slice("NEOTEAM-SR26:".length).trim();
  return result;
}

function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function participantPayload(row: any) {
  return {
    id: row.id,
    code: row.registration_code,
    firstName: row.first_name,
    lastName: row.last_name,
    status: row.status,
    checkedInAt: row.checked_in_at,
    group: row.running_groups?.name || row.other_running_group || "Independiente",
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const session = await requireSession(body?.token);
    if (!session) return json({ error: "Sesión no válida." }, 401);

    const value = normalizeScannedValue(body?.code);
    if (!value) return json({ error: "Escanea un QR o escribe un código." }, 400);

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id")
      .eq("code", "SR26")
      .single();
    if (eventError) throw eventError;

    let query = supabase
      .from("registrations")
      .select("id,registration_code,first_name,last_name,status,checked_in_at,other_running_group,running_groups(name)")
      .eq("event_id", event.id);

    query = validUuid(value)
      ? query.eq("checkin_token", value)
      : query.eq("registration_code", value.toUpperCase());

    const { data: registration, error } = await query.maybeSingle();
    if (error) throw error;
    if (!registration) return json({ error: "No encontramos un participante con ese QR o código." }, 404);
    if (registration.status === "cancelled") {
      return json({ error: "Este registro está cancelado.", participant: participantPayload(registration) }, 409);
    }
    if (registration.status === "checked_in") {
      return json({ ok: true, alreadyCheckedIn: true, participant: participantPayload(registration) });
    }

    const checkedInAt = new Date().toISOString();
    const { data: updated, error: updateError } = await supabase
      .from("registrations")
      .update({ status: "checked_in", checked_in_at: checkedInAt })
      .eq("id", registration.id)
      .select("id,registration_code,first_name,last_name,status,checked_in_at,other_running_group,running_groups(name)")
      .single();
    if (updateError) throw updateError;

    return json({ ok: true, alreadyCheckedIn: false, participant: participantPayload(updated) });
  } catch (error) {
    console.error("admin-checkin", error);
    return json({ error: "No pudimos completar el check-in." }, 500);
  }
});
