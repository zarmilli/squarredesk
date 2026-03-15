import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MoreVertical } from "lucide-react";
import { projectsData } from "@/lib/data";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import squeakImage from "/images/speaking.png";

type SiteRow = {
  id: string;
  site_name: string;
  is_published: boolean;
  live_url: string | null;
  created_at: string;
  template_name: string;
};

export default function Tables() {
  const { toast } = useToast();
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<SiteRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadSites();
  }, []);

  async function loadSites() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("user_sites")
      .select(`
        id,
        site_name,
        is_published,
        live_url,
        created_at,
        templates ( name )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    const rows: SiteRow[] = (data || []).map((s: any) => ({
      id: s.id,
      site_name: s.site_name,
      is_published: s.is_published,
      live_url: s.live_url,
      created_at: s.created_at,
      template_name: s.templates?.name ?? "Unknown",
    }));

    setSites(rows);
  }

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
      setSites((prev) => prev.filter((s) => s.id !== deleteTarget!.id));
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
        <Card className="border-stone-200">
          <CardHeader className="border-b border-stone-200">
            <CardTitle className="text-lg font-semibold text-stone-900">
              My Websites
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50">
                  <tr>
                    {["WEBSITE", "LINK", "STATUS", "CREATED", "ACTION"].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-stone-200">
                  {sites.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-sm text-stone-400"
                      >
                        No websites yet.
                      </td>
                    </tr>
                  ) : (
                    sites.map((site) => (
                      <tr key={site.id} className="hover:bg-stone-50">

                        {/* WEBSITE */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-stone-800 text-white flex items-center justify-center text-sm font-semibold shrink-0">
                              {site.site_name?.charAt(0).toUpperCase() ?? "?"}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-stone-900">
                                {site.site_name}
                              </div>
                              <div className="text-sm text-stone-500">
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-500">
                          {formatDate(site.created_at)}
                        </td>

                        {/* ACTION */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteTarget(site)}
                          >
                            Delete
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

        {/* PROJECTS TABLE with enterprise overlay */}
        <div className="relative">

          {/* Blurred table */}
          <div className="pointer-events-none select-none">
            <Card className="border-stone-200 blur-sm">
              <CardHeader className="border-b border-stone-200">
                <CardTitle className="text-lg font-semibold text-stone-900">
                  Projects table
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-stone-50">
                      <tr>
                        {["PROJECT", "BUDGET", "STATUS", "COMPLETION", "ACTION"].map((h) => (
                          <th
                            key={h}
                            className="px-6 py-3 text-left text-xs font-normal text-stone-500 uppercase tracking-wider"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-stone-200">
                      {projectsData.map((project) => (
                        <tr key={project.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div
                                className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm font-bold",
                                  project.iconColor
                                )}
                              >
                                {project.icon.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-normal text-stone-900">
                                {project.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900">
                            {project.budget}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="secondary">{project.status}</Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-sm text-stone-600 mr-2">
                                {project.completion}%
                              </span>
                              <Progress value={project.completion} className="w-32 h-2" />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Button variant="secondary" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enterprise overlay */}
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/60 backdrop-blur-sm">
            <div className="flex flex-col items-center text-center gap-3 px-6 max-w-sm">
              <img src={squeakImage} className="w-24" alt="Squeak the parrot" />
              <h3 className="text-lg font-semibold text-stone-900">
                Hade boss, projects are coming soon
              </h3>
              <p className="text-sm text-stone-500 leading-relaxed">
                Squeak is working hard on this one. Projects are currently available
                on Enterprise plans and will be rolling out to everyone soon.
              </p>
              <Badge className="bg-stone-800 text-white hover:bg-stone-800">
                Enterprise
              </Badge>
            </div>
          </div>

        </div>
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