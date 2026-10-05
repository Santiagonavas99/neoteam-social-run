export const runtime = "nodejs";

export async function GET() {
  const google = Boolean(
    process.env.GOOGLE_WALLET_ISSUER_ID?.trim() &&
    process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL?.trim() &&
    process.env.GOOGLE_WALLET_PRIVATE_KEY_BASE64?.trim()
  );

  let apple = false;
  const url = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (url && key) {
    try {
      const response = await fetch(`${url.replace(/\/$/, "")}/functions/v1/apple-wallet-pass`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: key },
        body: JSON.stringify({ action: "status" }),
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
      });
      const data = await response.json().catch(() => null);
      apple = Boolean(response.ok && data?.configured);
    } catch {
      apple = false;
    }
  }

  return Response.json({ google, apple }, { headers: { "Cache-Control": "no-store" } });
}
