export const runtime = "nodejs";

export async function GET() {
  return Response.json(
    {
      error: "Apple Wallet está preparado para la siguiente fase de configuración. Falta conectar el Pass Type ID y los certificados de firma.",
    },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
