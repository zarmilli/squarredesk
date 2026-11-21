import { useQuery } from "@tanstack/react-query";

import { useAppData } from "@/context/AppDataContext";
import { supabase } from "@/lib/supabase";

export type Site = {
  id: string;
  site_name: string;
  updated_at: string;
  is_published: boolean;
};

export function useUserSites() {
  const appData = useAppData();
  const { user, profile, organisation, isLoading: isAppDataLoading } = appData;

  const sitesQuery = useQuery<Site[]>({
    queryKey: ["user-sites", user?.id, organisation?.id],
    enabled: !!user?.id && !isAppDataLoading && profile?.onboarding_complete === true,
    queryFn: async () => {
      if (!user?.id) throw new Error("User session not found.");

      const { data, error } = await supabase
        .from("user_sites")
        .select("id, site_name, updated_at, is_published")
        .order("updated_at", { ascending: false });

      if (error) throw error;

      return (data ?? []) as Site[];
    },
    staleTime: 5 * 60 * 1000,
  });

  return { ...appData, sitesQuery };
}
