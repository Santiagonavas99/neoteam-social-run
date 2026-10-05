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

function text(value: unknown, max = 180) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === "claim") {
      const code = text(body?.code, 40).toUpperCase();
      const documentNumber = text(body?.documentNumber, 40);
      const email = text(body?.email, 180).toLowerCase();
      if (!documentNumber || !email) return json({ error: "Datos incompletos." }, 400);

      const { data: event, error: eventError } = await supabase
        .from("events")
        .select("id")
        .eq("code", "SR26")
        .single();
      if (eventError) throw eventError;

      let query = supabase
        .from("registrations")
        .select("registration_code,checkin_token,first_name,last_name,email,document_number,status")
        .eq("event_id", event.id)
        .eq("document_number", documentNumber);
      if (code) query = query.eq("registration_code", code);

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      if (!data || String(data.email).trim().toLowerCase() !== email) {
        return json({ error: "No pudimos validar el registro." }, 404);
      }
      if (data.status === "cancelled") return json({ error: "Este registro fue cancelado." }, 410);

      return json({
        ok: true,
        code: data.registration_code,
        checkinToken: data.checkin_token,
        firstName: data.first_name,
        lastName: data.last_name,
        status: data.status,
      });
    }

    if (action === "pass") {
      const token = text(body?.token, 80);
      if (!validUuid(token)) return json({ error: "Pase no válido." }, 400);
      const { data, error } = await supabase
        .from("registrations")
        .select("registration_code,checkin_token,first_name,last_name,status")
        .eq("checkin_token", token)
        .maybeSingle();
      if (error) throw error;
      if (!data) return json({ error: "Pase no encontrado." }, 404);
      if (data.status === "cancelled") return json({ error: "Este registro fue cancelado." }, 410);

      return json({
        ok: true,
        code: data.registration_code,
        checkinToken: data.checkin_token,
        firstName: data.first_name,
        lastName: data.last_name,
        status: data.status,
      });
    }

    return json({ error: "Acción no válida." }, 400);
  } catch (error) {
    console.error("registration-pass", error);
    return json({ error: "No pudimos preparar el pase." }, 500);
  }
});
