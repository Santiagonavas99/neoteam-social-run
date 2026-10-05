export type WalletPassData = {
  code: string;
  checkinToken: string;
  firstName: string;
  lastName: string;
  status: string;
};

export async function getWalletPassData(token: string): Promise<WalletPassData> {
  const url = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) throw new Error("Supabase no está configurado.");

  const response = await fetch(`${url.replace(/\/$/, "")}/functions/v1/registration-pass`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: key },
    body: JSON.stringify({ action: "pass", token }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) throw new Error(data?.error || "No pudimos validar el pase.");

  return {
    code: String(data.code),
    checkinToken: String(data.checkinToken),
    firstName: String(data.firstName),
    lastName: String(data.lastName),
    status: String(data.status),
  };
}
