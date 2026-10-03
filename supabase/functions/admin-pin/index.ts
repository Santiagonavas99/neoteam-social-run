// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SESSION_DAYS = 30;
const PBKDF2_ITERATIONS = 180_000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function base64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashPin(pin: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  return `pbkdf2$${PBKDF2_ITERATIONS}$${base64(salt)}$${base64(new Uint8Array(bits))}`;
}

async function verifyPin(pin: string, encoded: string) {
  const [kind, iterationText, saltText, expectedText] = encoded.split("$");
  if (kind !== "pbkdf2" || !iterationText || !saltText || !expectedText) return false;
  const iterations = Number(iterationText);
  if (!Number.isFinite(iterations) || iterations < 100_000) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: fromBase64(saltText), iterations, hash: "SHA-256" },
    key,
    256,
  );
  const actual = new Uint8Array(bits);
  const expected = fromBase64(expectedText);
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}

function validPin(pin: unknown): pin is string {
  return typeof pin === "string" && /^\d{6}$/.test(pin);
}

function getClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("cf-connecting-ip") || "unknown";
}

async function createSession() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  const tokenHash = await sha256(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from("admin_pin_sessions").insert({
    token_hash: tokenHash,
    expires_at: expiresAt,
  });
  if (error) throw error;
  return { token, expiresAt };
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

async function checkRateLimit(ip: string) {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("admin_pin_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .eq("success", false)
    .gte("created_at", tenMinutesAgo);
  return (count ?? 0) < 8;
}

async function recordAttempt(ip: string, success: boolean) {
  await supabase.from("admin_pin_attempts").insert({ ip, success });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action;
    const ip = getClientIp(req);

    if (action === "status") {
      const { data, error } = await supabase
        .from("admin_pin_settings")
        .select("id")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return json({ configured: Boolean(data) });
    }

    if (action === "setup") {
      const pin = body?.pin;
      if (!validPin(pin)) return json({ error: "El PIN debe tener exactamente 6 dígitos." }, 400);

      const { data: existing, error: existingError } = await supabase
        .from("admin_pin_settings")
        .select("id")
        .eq("id", 1)
        .maybeSingle();
      if (existingError) throw existingError;
      if (existing) return json({ error: "El PIN ya fue configurado." }, 409);

      const pinHash = await hashPin(pin);
      const { error } = await supabase.from("admin_pin_settings").insert({ id: 1, pin_hash: pinHash });
      if (error) {
        if ((error as { code?: string }).code === "23505") return json({ error: "El PIN ya fue configurado." }, 409);
        throw error;
      }

      const session = await createSession();
      return json({ ok: true, ...session });
    }

    if (action === "login") {
      const pin = body?.pin;
      if (!validPin(pin)) return json({ error: "Escribe un PIN de 6 dígitos." }, 400);
      if (!(await checkRateLimit(ip))) {
        return json({ error: "Demasiados intentos. Espera unos minutos antes de volver a intentar." }, 429);
      }

      const { data, error } = await supabase
        .from("admin_pin_settings")
        .select("pin_hash")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return json({ error: "El PIN todavía no ha sido configurado." }, 409);

      const ok = await verifyPin(pin, data.pin_hash);
      await recordAttempt(ip, ok);
      if (!ok) return json({ error: "PIN incorrecto." }, 401);

      const session = await createSession();
      return json({ ok: true, ...session });
    }

    if (action === "validate") {
      const session = await requireSession(body?.token);
      return json({ valid: Boolean(session) });
    }

    if (action === "logout") {
      if (typeof body?.token === "string") {
        const tokenHash = await sha256(body.token);
        await supabase.from("admin_pin_sessions").delete().eq("token_hash", tokenHash);
      }
      return json({ ok: true });
    }

    if (action === "listCards") {
      const session = await requireSession(body?.token);
      if (!session) return json({ error: "Sesión no válida." }, 401);
      const { data, error } = await supabase
        .from("home_feature_cards")
        .select("id,event_code,slot,title,description,enabled,sort_order")
        .eq("event_code", "SR26")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return json({ cards: data ?? [] });
    }

    if (action === "saveCards") {
      const session = await requireSession(body?.token);
      if (!session) return json({ error: "Sesión no válida." }, 401);
      const cards = Array.isArray(body?.cards) ? body.cards : [];
      for (const card of cards) {
        if (!card?.id) continue;
        const title = typeof card.title === "string" ? card.title.trim().slice(0, 120) : "";
        const description = typeof card.description === "string" ? card.description.trim().slice(0, 500) : "";
        const enabled = Boolean(card.enabled);
        const sortOrder = Number.isFinite(Number(card.sort_order)) ? Number(card.sort_order) : 0;
        const { error } = await supabase
          .from("home_feature_cards")
          .update({ title, description, enabled, sort_order: sortOrder })
          .eq("id", card.id)
          .eq("event_code", "SR26");
        if (error) throw error;
      }
      return json({ ok: true });
    }

    if (action === "changePin") {
      const session = await requireSession(body?.token);
      if (!session) return json({ error: "Sesión no válida." }, 401);
      const newPin = body?.newPin;
      if (!validPin(newPin)) return json({ error: "El nuevo PIN debe tener exactamente 6 dígitos." }, 400);
      const pinHash = await hashPin(newPin);
      const { error } = await supabase
        .from("admin_pin_settings")
        .update({ pin_hash: pinHash, updated_at: new Date().toISOString() })
        .eq("id", 1);
      if (error) throw error;
      await supabase.from("admin_pin_sessions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      const freshSession = await createSession();
      return json({ ok: true, ...freshSession });
    }

    return json({ error: "Acción no válida." }, 400);
  } catch (error) {
    console.error(error);
    return json({ error: "Ocurrió un error inesperado." }, 500);
  }
});
