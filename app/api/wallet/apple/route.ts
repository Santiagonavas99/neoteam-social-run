export const runtime = "nodejs";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
  if (!token) return Response.json({ error: "Pase no válido." }, { status: 400 });

  const url = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) return Response.json({ error: "Apple Wallet todavía no está disponible." }, { status: 503 });

  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/functions/v1/apple-wallet-pass`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: key },
      body: JSON.stringify({ token }),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "No pudimos preparar Apple Wallet." }));
      return Response.json(error, { status: response.status, headers: { "Cache-Control": "no-store" } });
    }

    const body = await response.arrayBuffer();
    return new Response(body, {
      status: response.status,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": response.headers.get("content-disposition") || "attachment; filename=neoteam-social-run.pkpass",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Apple Wallet proxy", error);
    return Response.json({ error: "No pudimos conectar con Apple Wallet." }, { status: 502 });
  }
}
