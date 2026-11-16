
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, ChevronDown } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useAppData } from "@/context/AppDataContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BadgeWithDot } from "@/components/base/badges/badges";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Site = {
  id: string;
  site_name: string;
  updated_at: string;
  is_published: boolean;
};

type SiteStatus = "published" | "draft";

export default function Dashboard() {
  const navigate = useNavigate();

  const { user, profile, isLoading: isAppDataLoading, error: appDataError } = useAppData();

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilters, setStatusFilters] = useState<SiteStatus[]>([]);

  useEffect(() => {
    if (isAppDataLoading || !user || !profile) return;

    if (profile.onboarding_complete !== true) {
      navigate("/onboarding", { replace: true });
    }
  }, [isAppDataLoading, user, profile, navigate]);

  // Fetch sites using TanStack Query
  const {
    data: sites = [],
    isPending: isSitesLoading,
    isError: isSitesError,
    error: sitesError,
    refetch: refetchSites,
  } = useQuery<Site[]>({
    queryKey: ["user-sites", user?.id],
    enabled: !!user?.id && !isAppDataLoading && profile?.onboarding_complete === true,
    queryFn: async () => {
      if (!user?.id) throw new Error("User session not found.");

      const { data, error } = await supabase
        .from("user_sites")
        .select("id, site_name, updated_at, is_published")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      return (data ?? []) as Site[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Debounce search by 1.5 seconds
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim().toLowerCase());
    }, 1500);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  // Toggle published/draft filters
  function toggleStatus(status: SiteStatus) {
    setStatusFilters((current) =>
      current.includes(status)
        ? current.filter((item) => item !== status)
        : [...current, status]
    );
  }

  // Navigate to the selected site's overview
  function openSite(siteId: string) {
    navigate(`/overview?site=${encodeURIComponent(siteId)}`);
  }

  // Apply search and status filters together
  const filteredSites = useMemo(() => {
    return sites.filter((site) => {
      const matchesSearch = site.site_name
        .toLowerCase()
        .includes(debouncedSearch);

      const siteStatus: SiteStatus = site.is_published
        ? "published"
        : "draft";

      const matchesStatus =
        statusFilters.length === 0 || statusFilters.includes(siteStatus);

      return matchesSearch && matchesStatus;
    });
  }, [sites, debouncedSearch, statusFilters]);

  function formatDate(dateString: string) {
    if (!dateString) return "—";

    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  const isLoading = isAppDataLoading || isSitesLoading;

  if (isLoading) {
    return (
      <div className="min-h-full w-full px-6 pb-16 pt-20 sm:px-10 sm:pt-24 lg:px-16 lg:pt-28 xl:px-28">
        <div className="mx-auto w-full max-w-6xl space-y-10">
          <h1 className="text-2xl font-semibold tracking-tight">Sites</h1>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-[220px] animate-pulse rounded-xl border bg-muted/30"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (appDataError || isSitesError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-base font-medium">Unable to load your dashboard.</p>
        <p className="text-sm text-muted-foreground">
          {sitesError instanceof Error
            ? sitesError.message
            : "Something went wrong while retrieving your account data."}
        </p>
        <Button onClick={() => refetchSites()} variant="outline" size="sm">
          Try again
        </Button>
      </div>
    );
  }

  // The onboarding redirect is handled by the effect above.
  if (!user || !profile || profile.onboarding_complete !== true) return null;

  return (
    <div className="min-h-full w-full px-6 pb-16 pt-20 custom-scrollbar sm:px-10 sm:pt-24 lg:px-16 lg:pb-20 lg:pt-28 xl:px-28">
      <div className="mx-auto w-full max-w-6xl space-y-10">

        {/* PAGE TITLE */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sites</h1>
        </div>

        {/* TOOLBAR */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

          {/* SEARCH */}
          <div className="relative w-full sm:max-w-[360px]">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search for a site"
              className="h-9 rounded-md pl-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 justify-between gap-2 rounded-md px-3 text-sm font-normal"
                >
                  Status
                  {statusFilters.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({statusFilters.length})
                    </span>
                  )}
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuCheckboxItem
                  checked={statusFilters.includes("published")}
                  onCheckedChange={() => toggleStatus("published")}
                >
                  Published
                </DropdownMenuCheckboxItem>

                <DropdownMenuCheckboxItem
                  checked={statusFilters.includes("draft")}
                  onCheckedChange={() => toggleStatus("draft")}
                >
                  Draft
                </DropdownMenuCheckboxItem>

                {statusFilters.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-full justify-start px-2 font-normal"
                      onClick={() => setStatusFilters([])}
                    >
                      Clear filters
                    </Button>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              onClick={() => navigate("/create-site")}
              className="h-9 gap-2 rounded-md bg-emerald-700 px-3 text-sm text-white hover:bg-emerald-800"
            >
              <Plus className="h-3.5 w-3.5" />
              New site
            </Button>
          </div>
        </div>

        {/* SITES GRID */}
        {filteredSites.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-2 text-center">
            {sites.length === 0 && (
              <img
                src="/images/squeakImage.png"
                alt="Squeak mascot"
                className="mb-3 h-36 w-36 object-contain"
              />
            )}

            <p className="text-base font-medium">
              {sites.length === 0
                ? "You haven't created any sites yet."
                : "Eii saarn! No sites match your filters."}
            </p>

            <p className="text-sm text-muted-foreground">
              {sites.length === 0
                ? "Create your first site to get started."
                : "Try changing your search or status filters."}
            </p>

            {sites.length === 0 && (
              <Button
                onClick={() => navigate("/create-site")}
                className="mt-3 h-9 gap-2 rounded-md px-3 text-sm"
              >
                <Plus className="h-4 w-4" />
                Create a site
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredSites.map((site) => (
              <Card
                key={site.id}
                role="link"
                tabIndex={0}
                aria-label={`Open ${site.site_name} overview`}
                onClick={() => openSite(site.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openSite(site.id);
                  }
                }}
                className="flex h-[220px] cursor-pointer flex-col justify-between rounded-xl border bg-card p-6 text-left shadow-none transition-all hover:border-foreground/20 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {/* SITE DETAILS */}
                <div>
                  <h3 className="text-base font-medium tracking-tight">
                    {site.site_name}
                  </h3>

                  <p className="mt-2 text-sm text-muted-foreground">
                    Last edited {formatDate(site.updated_at)}
                  </p>
                </div>

                {/* CARD FOOTER */}
                <div className="flex items-center justify-between">
                  <div />

                  <BadgeWithDot
                    type="pill-color"
                    color={site.is_published ? "success" : "warning"}
                    size="md"
                  >
                    {site.is_published ? "Published" : "Draft"}
                  </BadgeWithDot>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
