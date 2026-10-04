import { createServerSupabaseClient } from "@/lib/supabase/server";

export type HomeFeatureCard = {
  id?: string;
  event_code: string;
  slot: string;
  title: string;
  description: string;
  enabled: boolean;
  sort_order: number;
};

export const defaultHomeFeatureCards: HomeFeatureCard[] = [
  {
    event_code: "SR26",
    slot: "social_run",
    title: "Social Run",
    description: "Una salida pensada para compartir kilómetros, no para perseguir cronómetro.",
    enabled: true,
    sort_order: 1,
  },
  {
    event_code: "SR26",
    slot: "crews",
    title: "Crews invitados",
    description: "Grupos de running invitados para juntar comunidades en una misma mañana.",
    enabled: true,
    sort_order: 2,
  },
  {
    event_code: "SR26",
    slot: "brands",
    title: "Marcas",
    description: "Aliados con experiencias, producto y activaciones para los asistentes.",
    enabled: true,
    sort_order: 3,
  },
  {
    event_code: "SR26",
    slot: "raffles",
    title: "Rifas",
    description: "Inscripciones a carreras y premios entre quienes hagan parte del encuentro.",
    enabled: true,
    sort_order: 4,
  },
];

export async function getHomeFeatureCards(): Promise<HomeFeatureCard[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("home_feature_cards")
      .select("id,event_code,slot,title,description,enabled,sort_order")
      .eq("event_code", "SR26")
      .eq("enabled", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return (data ?? []) as HomeFeatureCard[];
  } catch (error) {
    console.error("Home feature cards fallback", error);
    return defaultHomeFeatureCards;
  }
}

export type CommunityLogo = { id: string; name: string; logo_url: string | null; type?: string; instagram?: string | null; website?: string | null };

export async function getHomeCommunity() {
  try {
    const supabase = createServerSupabaseClient();
    const [groups, brands] = await Promise.all([
      supabase.from("running_groups").select("id,name,logo_url,instagram").eq("active", true).eq("show_on_home", true).order("sort_order", { ascending: true }),
      supabase.from("brands").select("id,name,logo_url,type,instagram,website").eq("active", true).eq("show_on_home", true).order("sort_order", { ascending: true }),
    ]);
    if (groups.error) throw groups.error;
    if (brands.error) throw brands.error;
    return { groups: (groups.data ?? []) as CommunityLogo[], brands: (brands.data ?? []) as CommunityLogo[] };
  } catch (error) {
    console.error("Home community fallback", error);
    return { groups: [] as CommunityLogo[], brands: [] as CommunityLogo[] };
  }
}
