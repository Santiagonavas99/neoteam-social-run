"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

const passSchema = z.object({
  documentNumber: z.string().trim().min(5, "Revisa el número de documento.").max(40),
  email: z.email("Escribe un correo válido.").max(180),
});

export type PassClaimState = {
  ok: boolean;
  message: string;
  code?: string;
  checkinToken?: string;
  participantName?: string;
  errors?: { documentNumber?: string[]; email?: string[] };
};

export async function claimPass(_previous: PassClaimState, formData: FormData): Promise<PassClaimState> {
  const parsed = passSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revisa los datos e intenta de nuevo.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.functions.invoke("registration-pass", {
      body: {
        action: "claim",
        documentNumber: parsed.data.documentNumber,
        email: parsed.data.email.toLowerCase(),
      },
    });

    if (error || !data?.ok || !data?.checkinToken || !data?.code) {
      return { ok: false, message: "No encontramos un registro con ese documento y correo." };
    }

    return {
      ok: true,
      message: "Pase recuperado.",
      code: String(data.code),
      checkinToken: String(data.checkinToken),
      participantName: `${String(data.firstName ?? "")} ${String(data.lastName ?? "")}`.trim(),
    };
  } catch (error) {
    console.error("Pass recovery error", error);
    return { ok: false, message: "No pudimos recuperar el pase. Intenta nuevamente." };
  }
}
