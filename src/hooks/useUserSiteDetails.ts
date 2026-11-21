import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useUserSites } from "@/hooks/useUserSites";
import { supabase } from "@/lib/supabase";

export type UserSiteDetails = {
  id: string;
  site_name: string;
  is_published: boolean;
  live_url: string | null;
  created_at: string;
  template_name: string;
  has_inventory: boolean;
};

export function useUserSiteDetails() {
  const appData = useUserSites();
  const {
    user,
    organisation,
    isLoading: isAppDataLoading,
    sitesQuery: accessibleSitesQuery,
  } = appData;
  const accessibleSiteIds = useMemo(
    () => (accessibleSitesQuery.data ?? []).map((site) => site.id),
    [accessibleSitesQuery.data]
  );

  const siteDetailsQuery = useQuery<UserSiteDetails[]>({
    queryKey: [
      "user-sites-details",
      user?.id,
      organisation?.id,
      accessibleSiteIds,
    ],
    enabled:
      !!user?.id && !isAppDataLoading && accessibleSitesQuery.isSuccess,
    queryFn: async () => {
      if (!user?.id) throw new Error("User session not found.");
      if (accessibleSiteIds.length === 0) return [];

      const { data, error } = await supabase
        .from("user_sites")
        .select(`
          id,
          site_name,
          is_published,
          live_url,
          created_at,
          templates (
            name,
            has_inventory
          )
        `)
        .in("id", accessibleSiteIds)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data ?? []).map((site) => ({
        id: site.id,
        site_name: site.site_name,
        is_published: site.is_published,
        live_url: site.live_url,
        created_at: site.created_at,
        template_name: site.templates?.name ?? "Unknown",
        has_inventory: site.templates?.has_inventory ?? false,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  return { ...appData, siteDetailsQuery };
}
