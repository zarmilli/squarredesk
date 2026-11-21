import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  useUserSiteDetails,
  type UserSiteDetails,
} from "@/hooks/useUserSiteDetails";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import squeakImage from "/images/speaking.png";

export default function Tables() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    isLoading: isAppDataLoading,
    error: appDataError,
    sitesQuery: accessibleSitesQuery,
    siteDetailsQuery,
  } = useUserSiteDetails();
  const sites = siteDetailsQuery.data ?? [];
  const sitesError =
    appDataError ?? accessibleSitesQuery.error ?? siteDetailsQuery.error;
  const [deleteTarget, setDeleteTarget] = useState<UserSiteDetails | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!sitesError) return;
    toast({
      title: "Unable to load websites",
      description: sitesError.message,
      variant: "destructive",
    });
  }, [sitesError, toast]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);

    const { error } = await supabase
      .from("user_sites")
      .delete()
      .eq("id", deleteTarget.id);

    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Website deleted" });
      await accessibleSitesQuery.refetch();
    }

    setDeleting(false);
    setDeleteTarget(null);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function LinkCell({ url }: { url: string | null }) {
    if (!url) return <span className="text-stone-400">—</span>;
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline truncate block max-w-[200px]"
      >
        {url}
      </a>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar">
      <div className="space-y-6">

        {/* WEBSITES TABLE */}
        <Card className="border-border">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-lg font-semibold text-foreground">
              Websites
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr>
                    {["WEBSITE", "LINK", "STATUS", "CREATED", "ACTION"].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-normal text-muted-foreground uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isAppDataLoading ||
                  (accessibleSitesQuery.isPending &&
                    accessibleSitesQuery.fetchStatus !== "idle") ||
                  (accessibleSitesQuery.isSuccess &&
                    siteDetailsQuery.isPending) ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-muted-foreground">
                        Loading websites...
                      </td>
                    </tr>
                  ) : sitesError ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-destructive">
                        Unable to load websites.
                      </td>
                    </tr>
                  ) : sites.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-sm text-muted-foreground"
                      >
                        No websites yet.
                      </td>
                    </tr>
                  ) : (
                    sites.map((site) => (
                      <tr key={site.id} className="transition-colors duration-200 hover:bg-muted/50">

                        {/* WEBSITE */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-semibold shrink-0">
                              {site.site_name?.charAt(0).toUpperCase() ?? "?"}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-foreground">
                                {site.site_name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Made from {site.template_name}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* LINK */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <LinkCell url={site.live_url} />
                        </td>

                        {/* STATUS */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            className={cn(
                              site.is_published
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : "bg-stone-100 text-stone-600 hover:bg-stone-100"
                            )}
                          >
                            {site.is_published ? "Live" : "Draft"}
                          </Badge>
                        </td>

                        {/* CREATED */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          {formatDate(site.created_at)}
                        </td>

                        {/* SITE TRAFFIC */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/stats/${site.id}`)}
                          >
                            View traffic
                          </Button>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white dark:bg-stone-800 p-8 rounded-lg w-[420px] flex flex-col items-center text-center space-y-6 relative">
            <img src={squeakImage} className="w-24" alt="Squeak the parrot" />
            <div>
              <h2 className="text-lg font-semibold text-stone-900">
                Delete website?
              </h2>
              <p className="text-sm text-stone-500 mt-1">
                Ola!, Squeak wants to make sure — are you sure you want to delete{" "}
                <span className="font-medium text-stone-800">
                  {deleteTarget.site_name}
                </span>
                ? This cannot be undone.
              </p>
            </div>
            <div className="flex gap-4">
              <Button
                variant="secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}