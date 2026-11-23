import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUserSites } from "@/hooks/useUserSites";
import type { Task } from "@/features/tasks/data/schema";
import {
  businessTasksQueryKey,
  fetchBusinessId,
  fetchBusinessTasks,
} from "@/features/tasks/data/queries";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type OverviewSite = {
  id: string;
  site_name: string;
  live_url: string | null;
  template_id: string;
  template_slug: string;
  content: unknown;
  blocks: Record<string, string> | null;
};

type PreviewPage = {
  label: string;
  file: string;
  editables: string;
};

type ContentMap = Record<string, any>;

function formatTaskDueDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function parseStoredContent(content: unknown): ContentMap {
  if (!content) return {};
  if (typeof content === "string") {
    try {
      return JSON.parse(content);
    } catch {
      return {};
    }
  }
  return content as ContentMap;
}

async function applyPreviewBlocks(
  shellHtml: string,
  blocks: Record<string, string>,
  templateSlug: string
) {
  let html = shellHtml;

  for (const match of Array.from(html.matchAll(/<!-- block:(\w+) -->/g))) {
    const slot = match[1];
    const variant = blocks[slot] ?? "default";
    const response = await fetch(
      `/templates/${templateSlug}/blocks/${slot}/${variant}.html`
    );
    if (!response.ok) continue;

    const blockHtml = await response.text();
    const parsed = new DOMParser().parseFromString(
      `<body>${blockHtml}</body>`,
      "text/html"
    );
    const blockRoot = Array.from(parsed.body.children).find(
      (element) => !["STYLE", "SCRIPT"].includes(element.tagName)
    );
    blockRoot?.setAttribute("data-editor-block", slot);
    html = html.replace(match[0], parsed.body.innerHTML);
  }

  return html;
}

function getPreviewValues(
  content: ContentMap,
  pageFile: string,
  editables: ContentMap
) {
  const storedPages = content.pages;
  const pageContent = storedPages
    ? {
        ...(storedPages["index.html"] ?? {}),
        ...(storedPages[pageFile] ?? {}),
      }
    : content;
  const groupedSections = ["editor", "seo", "inventory", "blog"].filter(
    (section) =>
      editables[section] &&
      typeof editables[section] === "object" &&
      !editables[section].type
  );
  const fields = groupedSections.length
    ? Object.entries(editables).flatMap(([section, sectionFields]) =>
        sectionFields && typeof sectionFields === "object"
          ? Object.keys(sectionFields as ContentMap).map((field) => ({
              field,
              section,
            }))
          : []
      )
    : Object.entries(editables).map(([field, definition]) => ({
        field,
        section: (definition as ContentMap)?.section ?? "editor",
      }));

  return fields.reduce<ContentMap>((values, { field, section }) => {
    if (section !== "editor") return values;
    const value = pageContent[field] ?? pageContent.editor?.[field];
    if (value !== undefined) values[field] = value;
    return values;
  }, {});
}

function applyPreviewContent(
  doc: Document,
  values: ContentMap,
  pageFile: string
) {
  Object.entries(values).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      const container = doc.querySelector<HTMLElement>(
        `[data-repeat="${key}"]`
      );
      const template = container?.firstElementChild?.cloneNode(true) as
        | HTMLElement
        | undefined;
      if (!container || !template) return;

      container.innerHTML = "";
      value.forEach((item) => {
        const clone = template.cloneNode(true) as HTMLElement;
        Object.entries(item).forEach(([subKey, subValue]) => {
          if (subValue == null) return;
          clone
            .querySelectorAll<HTMLElement>(`[data-edit="${subKey}"]`)
            .forEach((element) => applyPreviewField(element, subValue));
        });
        container.appendChild(clone);
      });
      return;
    }

    if (value == null) return;
    doc
      .querySelectorAll<HTMLElement>(`[data-edit="${key}"]`)
      .forEach((element) => applyPreviewField(element, value));
  });

  doc.documentElement.dataset.previewPage = pageFile;
}

function applyPreviewField(element: HTMLElement, value: any) {
  const role = element.dataset.editRole;
  const tag = element.tagName.toUpperCase();

  if (role === "logo") {
    const imageUrl =
      typeof value === "object" ? value?.imageUrl || value?.image : undefined;
    if (imageUrl) {
      const image = document.createElement("img");
      image.src = imageUrl;
      image.alt = value.text || "Logo";
      image.className = "logo-image";
      element.replaceChildren(image);
    } else {
      element.textContent =
        typeof value === "object" ? value?.text ?? "" : value ?? "";
    }
    return;
  }
  if (role === "background") {
    element.style.backgroundImage = `url("${value}")`;
    element.style.backgroundSize = "cover";
    element.style.backgroundPosition = "center";
    element.style.backgroundRepeat = "no-repeat";
    return;
  }
  if (role === "href") {
    element.setAttribute("href", value);
    return;
  }
  if (tag === "SOURCE") {
    element.setAttribute("srcset", value);
    return;
  }
  if (role === "img" || tag === "IMG") {
    element.setAttribute("src", value);
    element.removeAttribute("srcset");
    return;
  }
  element.textContent = value;
}

export default function Overview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedSiteId = searchParams.get("site");
  const { toast } = useToast();
  const {
    user,
    membership,
    organisation,
    isLoading: isAppDataLoading,
    error: appDataError,
    sitesQuery,
  } = useUserSites();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [site, setSite] = useState<OverviewSite | null>(null);
  const [siteLoading, setSiteLoading] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const sites = sitesQuery.data ?? [];
  const selectedSite = selectedSiteId
    ? sites.find((availableSite) => availableSite.id === selectedSiteId)
    : sites[0];
  const activeSiteId = selectedSite?.id ?? null;

  const currentBusinessId = membership?.business_id ?? organisation?.id ?? null;
  const businessQuery = useQuery<string | null>({
    queryKey: [
      "tasks-business",
      user?.id,
      membership?.business_id,
      organisation?.id,
    ],
    enabled: !!user?.id && !isAppDataLoading,
    queryFn: async () => {
      if (!user?.id) throw new Error("User session not found.");
      return fetchBusinessId(user.id, currentBusinessId);
    },
    staleTime: 5 * 60 * 1000,
  });
  const businessId = businessQuery.data ?? null;
  const tasksQueryKey = businessTasksQueryKey(user?.id, businessId, site?.id ?? null);
  const tasksQuery = useQuery<Task[]>({
    queryKey: tasksQueryKey,
    enabled: !!user?.id && !!businessId && !!site?.id && !isAppDataLoading,
    queryFn: async () => {
      if (!businessId || !site?.id) {
        throw new Error("Business or site not found.");
      }
      return fetchBusinessTasks(businessId, site.id);
    },
  });

  useEffect(() => {
    const error =
      appDataError ??
      sitesQuery.error ??
      businessQuery.error ??
      tasksQuery.error;
    if (!error) return;

    toast({
      title:
        appDataError || sitesQuery.error
          ? "Unable to load overview"
          : "Unable to load overview tasks",
      description: error.message,
      variant: "destructive",
    });
  }, [appDataError, businessQuery.error, sitesQuery.error, tasksQuery.error, toast]);

  useEffect(() => {
    let active = true;

    async function loadSitePreview() {
      if (
        isAppDataLoading ||
        (sitesQuery.isPending && sitesQuery.fetchStatus !== "idle")
      ) {
        setSiteLoading(true);
        return;
      }

      if (appDataError || sitesQuery.error) {
        setSite(null);
        setPreviewError(
          appDataError?.message ??
            sitesQuery.error?.message ??
            "Unable to load available sites."
        );
        setSiteLoading(false);
        return;
      }

      if (!user) {
        setSite(null);
        setSiteLoading(false);
        return;
      }

      if (!activeSiteId) {
        setSite(null);
        setPreviewError(
          selectedSiteId ? "The selected site could not be found." : null
        );
        setSiteLoading(false);
        return;
      }

      setSite(null);
      setSiteLoading(true);
      setPreviewError(null);
      try {
        const { data: siteRow, error: siteError } = await supabase
          .from("user_sites")
          .select("id, site_name, live_url, template_id, content, blocks")
          .eq("id", activeSiteId)
          .maybeSingle();
        if (siteError) throw siteError;
        if (!siteRow) {
          if (active) setSite(null);
          return;
        }

        const { data: template, error: templateError } = await supabase
          .from("templates")
          .select("template_slug")
          .eq("id", siteRow.template_id)
          .single();
        if (templateError) throw templateError;

        const nextSite: OverviewSite = {
          ...siteRow,
          template_slug: template.template_slug,
        };
        if (active) setSite(nextSite);

        let page: PreviewPage = {
          label: "Page",
          file: "index.html",
          editables: "editables.json",
        };
        try {
          const pagesResponse = await fetch(
            `/templates/${nextSite.template_slug}/pages.json`
          );
          if (pagesResponse.ok) {
            const pages = (await pagesResponse.json()) as PreviewPage[];
            if (pages.length > 0) page = pages[0];
          }
        } catch {
          // Single-page templates do not need a pages manifest.
        }

        const [shellResponse, editablesResponse] = await Promise.all([
          fetch(`/templates/${nextSite.template_slug}/${page.file}`),
          fetch(`/templates/${nextSite.template_slug}/${page.editables}`),
        ]);
        if (!shellResponse.ok || !editablesResponse.ok) {
          throw new Error("The website preview could not be loaded.");
        }

        const [shellHtml, editables] = await Promise.all([
          shellResponse.text(),
          editablesResponse.json(),
        ]);
        const assembledHtml = await applyPreviewBlocks(
          shellHtml,
          nextSite.blocks ?? {},
          nextSite.template_slug
        );
        const iframeDocument = iframeRef.current?.contentDocument;
        if (!iframeDocument) return;

        iframeDocument.open();
        iframeDocument.write(assembledHtml);
        iframeDocument.close();

        const values = getPreviewValues(
          parseStoredContent(nextSite.content),
          page.file,
          editables
        );
        applyPreviewContent(iframeDocument, values, page.file);
      } catch (error) {
        console.error("Failed to load overview website preview:", error);
        if (active) {
          const message =
            error instanceof Error ? error.message : "Please try again.";
          setPreviewError(message);
          toast({
            title: "Unable to load website preview",
            description: message,
            variant: "destructive",
          });
        }
      } finally {
        if (active) setSiteLoading(false);
      }
    }

    void loadSitePreview();
    return () => {
      active = false;
    };
  }, [
    activeSiteId,
    appDataError,
    isAppDataLoading,
    selectedSiteId,
    sitesQuery.error,
    sitesQuery.fetchStatus,
    sitesQuery.isPending,
    user?.id,
    toast,
  ]);

  const tasksLoading =
    isAppDataLoading ||
    (sitesQuery.isPending && sitesQuery.fetchStatus !== "idle") ||
    (businessQuery.isPending && businessQuery.fetchStatus !== "idle") ||
    (!site && siteLoading) ||
    (!!businessId && !!site?.id && tasksQuery.isPending);
  const tasks = tasksQuery.data ?? [];
  const tasksError =
    appDataError ?? sitesQuery.error ?? businessQuery.error ?? tasksQuery.error;
  const emptyTasksMessage = !businessId
    ? "No business workspace is available."
    : !site
      ? "No website is available for these tasks."
      : "No tasks found for this website.";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 p-4 sm:p-6 lg:grid lg:grid-cols-2 lg:overflow-hidden">
      <div className="flex flex-col gap-5 lg:min-h-0 lg:overflow-y-auto">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border px-5 py-4">
            <CardTitle className="text-base font-semibold">Tasks</CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                navigate(
                  site ? `/tasks?site=${encodeURIComponent(site.id)}` : "/tasks"
                )
              }
              className="text-muted-foreground"
            >
              View all
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table className="min-w-[360px]">
              <TableHeader>
                <TableRow className="h-9">
                  <TableHead>Title</TableHead>
                  <TableHead className="w-32">Due date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasksLoading ? (
                  Array.from({ length: 5 }, (_, index) => (
                    <TableRow key={index} className="h-10">
                      <TableCell className="px-3 py-2">
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : tasksError ? (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">
                      Unable to load tasks.
                    </TableCell>
                  </TableRow>
                ) : tasks.length ? (
                  tasks.slice(0, 7).map((task) => (
                    <TableRow key={task.id} className="h-10">
                      <TableCell className="px-3 py-2">
                        <span className="block max-w-[360px] truncate text-sm font-medium">
                          {task.title}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-3 py-2 text-sm">
                        {formatTaskDueDate(task.dueDate)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">
                      {emptyTasksMessage}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="flex min-h-[480px] flex-col overflow-hidden border-border lg:min-h-0">
        <div className="relative min-h-0 flex-1 overflow-hidden bg-muted/30">
          {site && (
            <iframe
              ref={iframeRef}
              title={`${site.site_name} website preview`}
              className={cn(
                "absolute inset-0 h-full w-full border-0 bg-white",
                (siteLoading || previewError) && "invisible"
              )}
            />
          )}
          {siteLoading && (
            <div
              aria-label="Loading website preview"
              role="status"
              className="absolute inset-0 space-y-5 overflow-hidden p-6"
            >
              <Skeleton className="h-8 w-2/5 rounded-sm" />
              <Skeleton className="h-4 w-4/5 rounded-sm" />
              <Skeleton className="h-4 w-3/5 rounded-sm" />
              <Skeleton className="mt-8 h-40 w-full rounded-lg" />
              <Skeleton className="h-4 w-2/3 rounded-sm" />
            </div>
          )}
          {!siteLoading && !site && (
            <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-muted-foreground">
              No website available to preview.
            </div>
          )}
          {previewError && (
            <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-muted-foreground">
              {previewError}
            </div>
          )}
          {site?.live_url && !siteLoading && (
            <a
              href={site.live_url}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-3 right-3 z-10 flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-md border border-border bg-background/95 px-3 py-2 text-xs font-medium text-foreground shadow-md backdrop-blur transition-colors hover:bg-background"
              aria-label={`Open live website: ${site.live_url}`}
            >
              <span className="truncate">{site.live_url}</span>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
            </a>
          )}
        </div>
        {siteLoading && (
          <div className="shrink-0 space-y-3 border-t border-border px-5 py-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-10 w-32" />
          </div>
        )}
        {site && !siteLoading && (
          <div className="shrink-0 border-t border-border px-5 py-4">
            <p className="truncate text-base font-semibold">{site.site_name}</p>
            <Button
              type="button"
              onClick={() =>
                navigate(
                  `/editor?site=${encodeURIComponent(site.id)}&template=${encodeURIComponent(site.template_slug)}`
                )
              }
              className="mt-3 gap-2"
            >
              Edit website
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
