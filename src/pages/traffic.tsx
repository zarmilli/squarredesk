import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { Analytics } from "@/components/dashboard/analytics";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useUserSites } from "@/hooks/useUserSites";
import { getStartDate, type Timeframe, type Visit } from "@/lib/site-analytics";
import { supabase } from "@/lib/supabase";

async function fetchTrafficVisits(
  siteId: string,
  timeframe: Timeframe
): Promise<Visit[]> {
  let query = supabase
    .from("site_visits")
    .select("created_at, device, visitor_hash")
    .eq("site_id", siteId)
    .order("created_at", { ascending: true });

  const startDate = getStartDate(timeframe);
  if (startDate) query = query.gte("created_at", startDate.toISOString());

  const { data, error } = await query;
  if (error) throw error;
  return (data as Visit[] | null) ?? [];
}

export default function Traffic() {
  const [searchParams] = useSearchParams();
  const selectedSiteId = searchParams.get("site");
  const [timeframe, setTimeframe] = useState<Timeframe>("today");
  const {
    user,
    organisation,
    isLoading: isAppDataLoading,
    error: appDataError,
    sitesQuery,
  } = useUserSites();
  const { toast } = useToast();
  const sites = sitesQuery.data ?? [];
  const selectedSite = selectedSiteId
    ? sites.find((site) => site.id === selectedSiteId)
    : sites[0];
  const siteSelectionError = useMemo(
    () =>
      sitesQuery.isSuccess && selectedSiteId && !selectedSite
        ? new Error("The selected site could not be found.")
        : null,
    [selectedSite, selectedSiteId, sitesQuery.isSuccess]
  );

  const visitsQuery = useQuery({
    queryKey: [
      "traffic-page-visits",
      user?.id,
      organisation?.id,
      selectedSite?.id,
      timeframe,
    ],
    enabled: !!user?.id && !!selectedSite && !isAppDataLoading,
    queryFn: () => {
      if (!selectedSite) throw new Error("The selected site could not be found.");
      return fetchTrafficVisits(selectedSite.id, timeframe);
    },
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    const error =
      appDataError ??
      sitesQuery.error ??
      siteSelectionError ??
      visitsQuery.error;
    if (!error) return;
    toast({
      title: "Unable to load traffic",
      description: error instanceof Error ? error.message : "Please try again.",
      variant: "destructive",
    });
  }, [
    appDataError,
    siteSelectionError,
    sitesQuery.error,
    toast,
    visitsQuery.error,
  ]);

  const isSitesLoading =
    isAppDataLoading ||
    (sitesQuery.isPending && sitesQuery.fetchStatus !== "idle");
  const visits = visitsQuery.data ?? [];

  return (
    <div className="min-h-0 min-w-0 flex-1 space-y-6 overflow-y-auto p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Traffic</h1>
        <p className="text-sm text-muted-foreground">
          {selectedSite
            ? `Traffic performance for ${selectedSite.site_name}.`
            : isSitesLoading
              ? "Loading your websites..."
              : "No website is available to show traffic for."}
        </p>
      </div>

      {selectedSite ? (
        <>
          {visitsQuery.isLoading && (
            <p role="status" className="text-sm text-muted-foreground">
              Loading traffic...
            </p>
          )}
          <Analytics
            visits={visits}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
          />
        </>
      ) : (
        <Card className="border border-border p-6 text-sm text-muted-foreground">
          {siteSelectionError
            ? "The selected website could not be found."
            : "Create or select a website to view its traffic."}
        </Card>
      )}
    </div>
  );
}
