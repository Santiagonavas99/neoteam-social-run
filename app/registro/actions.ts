"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\d{10}$/, "El número debe tener exactamente 10 dígitos.");

const registrationSchema = z
  .object({
    firstName: z.string().trim().min(2, "Escribe tu nombre.").max(80),
    lastName: z.string().trim().min(2, "Escribe tu apellido.").max(80),
    documentType: z.enum(["CC", "CE", "TI", "PA", "PPT", "OTRO"]),
    documentNumber: z.string().trim().min(5, "Revisa el número de documento.").max(30),
    email: z.email("Escribe un correo válido.").max(160),
    phone: phoneSchema,
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Selecciona tu fecha de nacimiento."),
    runningGroup: z.enum(["neoteam", "independiente", "otro"]),
    otherRunningGroup: z.string().trim().max(120).optional(),
    emergencyName: z.string().trim().min(2, "Escribe el contacto de emergencia.").max(120),
    emergencyPhone: phoneSchema,
    termsAccepted: z.literal("on", { error: "Debes aceptar los términos." }),
    privacyAccepted: z.literal("on", { error: "Debes aceptar el tratamiento de datos." }),
    marketingAccepted: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.runningGroup === "otro" && !data.otherRunningGroup?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["otherRunningGroup"],
        message: "Escribe el nombre de tu grupo.",
      });
    }
  });

export type RegistrationValues = {
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  email: string;
  phone: string;
  birthDate: string;
  runningGroup: string;
  otherRunningGroup: string;
  emergencyName: string;
  emergencyPhone: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  marketingAccepted: boolean;
};

export type RegistrationState = {
  ok: boolean;
  message: string;
  code?: string;
  checkinToken?: string;
  participantName?: string;
  errors?: Record<string, string[] | undefined>;
  values?: RegistrationValues;
};

function submittedValues(formData: FormData): RegistrationValues {
  const value = (name: string) => String(formData.get(name) ?? "");
  return {
    firstName: value("firstName"),
    lastName: value("lastName"),
    documentType: value("documentType") || "CC",
    documentNumber: value("documentNumber"),
    email: value("email"),
    phone: value("phone"),
    birthDate: value("birthDate"),
    runningGroup: value("runningGroup") || "neoteam",
    otherRunningGroup: value("otherRunningGroup"),
    emergencyName: value("emergencyName"),
    emergencyPhone: value("emergencyPhone"),
    termsAccepted: formData.get("termsAccepted") === "on",
    privacyAccepted: formData.get("privacyAccepted") === "on",
    marketingAccepted: formData.get("marketingAccepted") === "on",
  };
}

export async function registerParticipant(
  _previousState: RegistrationState,
  formData: FormData,
): Promise<RegistrationState> {
  const values = submittedValues(formData);
  const raw = Object.fromEntries(formData.entries());
  const parsed = registrationSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Hay algunos datos por revisar.",
      errors: parsed.error.flatten().fieldErrors,
      values,
    };
  }

  try {
    const supabase = createServerSupabaseClient();
    const normalizedEmail = parsed.data.email.toLowerCase();
    const { data, error } = await supabase.rpc("register_social_run_participant", {
      p_first_name: parsed.data.firstName,
      p_last_name: parsed.data.lastName,
      p_document_type: parsed.data.documentType,
      p_document_number: parsed.data.documentNumber,
      p_email: normalizedEmail,
      p_phone: parsed.data.phone,
      p_birth_date: parsed.data.birthDate,
      p_running_group_slug: parsed.data.runningGroup,
      p_other_running_group:
        parsed.data.runningGroup === "otro" ? parsed.data.otherRunningGroup ?? null : null,
      p_emergency_name: parsed.data.emergencyName,
      p_emergency_phone: parsed.data.emergencyPhone,
      p_terms_accepted: true,
      p_privacy_accepted: true,
      p_marketing_accepted: parsed.data.marketingAccepted === "on",
    });

    if (error) {
      if (error.message.includes("Ya existe una inscripción")) {
        return {
          ok: false,
          message: "Ya existe una inscripción con ese documento o correo.",
          values,
        };
      }
      throw error;
    }

    const code = data as string;
    const { data: passData, error: passError } = await supabase.functions.invoke("registration-pass", {
      body: {
        action: "claim",
        code,
        documentNumber: parsed.data.documentNumber,
        email: normalizedEmail,
      },
    });

    if (passError) console.error("Registration pass token error", passError);

    return {
      ok: true,
      message: "¡Registro completado!",
      code,
      checkinToken: typeof passData?.checkinToken === "string" ? passData.checkinToken : undefined,
      participantName: `${parsed.data.firstName} ${parsed.data.lastName}`,
    };
  } catch (error) {
    const isMissingConfig = error instanceof Error && error.message.includes("no está configurado");
    console.error("Registration error", error);
    return {
      ok: false,
      message: isMissingConfig
        ? "La interfaz ya está lista. Falta conectar el proyecto de Supabase para guardar registros reales."
        : "No pudimos guardar el registro. Intenta nuevamente.",
      values,
    };
  }
}
