import type { HomeFeatureCard } from "@/lib/home-features";

export type AdminSection = "metrics" | "home" | "logos" | "participants" | "groups" | "brands" | "raffles" | "dynamics" | "security";
export type Resource = "participants" | "groups" | "brands" | "raffles";
export type AdminRow = {
  id: string; name?: string; slug?: string; logo_url?: string | null; instagram?: string | null;
  website?: string | null; type?: string; active?: boolean; show_on_home?: boolean; sort_order?: number; invited?: boolean;
  first_name?: string; last_name?: string; email?: string; phone?: string; document_type?: string; document_number?: string;
  registration_code?: string; registration_number?: number; running_groups?: { name: string } | null;
  other_running_group?: string | null; shirt_size?: string | null; status?: string; checked_in_at?: string | null;
  prize?: string; description?: string; winner_count?: number; requires_checkin?: boolean;
  sponsor_brand_id?: string | null; draw_at?: string | null;
};

export type DynamicType = "raffle" | "qr" | "checkpoint" | "challenge" | "trivia" | "mission" | "voting" | "instant_win" | "points";
export type DynamicStatus = "draft" | "open" | "closed" | "completed" | "cancelled";
export type DynamicRow = {
  id: string;
  event_id?: string;
  name: string;
  description?: string | null;
  type: DynamicType;
  status: DynamicStatus;
  sponsor_brand_id?: string | null;
  points: number;
  requires_checkin: boolean;
  prize?: string | null;
  winner_count: number;
  eligibility_dynamic_id?: string | null;
  legacy_raffle_id?: string | null;
  draw_at?: string | null;
  config?: Record<string, unknown>;
  created_at?: string;
  participations_count?: number;
  winners_count?: number;
};

export type DynamicParticipant = {
  id: string;
  code?: string | null;
  firstName: string;
  lastName: string;
  status: string;
  group?: string | null;
};

export type Metrics = { registered: number; checkedIn: number; groups: number; brands: number; raffles?: number; dynamics?: number };
export type AdminResponse = {
  ok?: boolean; configured?: boolean; setupSecretReady?: boolean; valid?: boolean; token?: string; expiresAt?: string;
  cards?: HomeFeatureCard[]; rows?: AdminRow[]; dynamicRows?: DynamicRow[]; metrics?: Metrics; url?: string; error?: string; winners?: number;
  winnerDetails?: DynamicParticipant[]; participant?: DynamicParticipant; alreadyCompleted?: boolean; won?: boolean; prize?: string | null;
};
export type AdminApi = (action: string, payload?: Record<string, unknown>) => Promise<AdminResponse>;
export type FeedbackValue = { kind: "success" | "error"; text: string } | null;
export const participantStates: Record<string, string> = { registered: "Inscrito", checked_in: "Check-in", no_show: "No asistió", cancelled: "Cancelado" };
export const raffleStates: Record<string, string> = { draft: "Borrador", open: "Abierta", drawn: "Sorteada", cancelled: "Cancelada" };
export const dynamicStates: Record<DynamicStatus, string> = { draft: "Borrador", open: "Activa", closed: "Cerrada", completed: "Completada", cancelled: "Cancelada" };
export const dynamicTypes: Record<DynamicType, string> = {
  raffle: "Sorteo",
  qr: "QR / Stand",
  checkpoint: "Checkpoint",
  challenge: "Challenge",
  trivia: "Trivia",
  mission: "Misión",
  voting: "Votación",
  instant_win: "Instant Win",
  points: "Puntos",
};
export const brandTypes: Record<string, string> = { organizer: "Organizador", main_partner: "Aliado principal", sponsor: "Patrocinador", invited: "Invitado" };
