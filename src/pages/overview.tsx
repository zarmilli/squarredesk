import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, MessageCircle } from "lucide-react";

import { UserProfile1 } from "@/components/user-profile1";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAppData } from "@/context/AppDataContext";
import { initialTasks } from "@/features/tasks/data/tasks";
import { getOrCreateConversation } from "@/lib/messaging";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type OverviewMember = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  avatar_url: string | null;
  personal_bio: string | null;
  business_location: string | null;
  job_title: string | null;
  role: string;
};

type OverviewSite = {
  id: string;
  site_name: string;
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

const latestTasks = initialTasks.slice(0, 5);

function getName(member: OverviewMember) {
  return [member.first_name, member.last_name].filter(Boolean).join(" ") || "Unnamed user";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
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
  const { toast } = useToast();
  const { user, membership, organisation } = useAppData();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [members, setMembers] = useState<OverviewMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [site, setSite] = useState<OverviewSite | null>(null);
  const [siteLoading, setSiteLoading] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [messagingUserId, setMessagingUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadMembers() {
      if (!user) {
        setMembers([]);
        setMembersLoading(false);
        return;
      }

      setMembersLoading(true);
      try {
        let businessId = membership?.business_id ?? organisation?.id;
        if (!businessId) {
          const { data: business, error: businessError } = await supabase
            .from("businesses")
            .select("id")
            .eq("owner_user_id", user.id)
            .maybeSingle();
          if (businessError) throw businessError;
          businessId = business?.id;
        }

        if (!businessId) {
          if (active) setMembers([]);
          return;
        }

        const { data: memberships, error: membershipsError } = await supabase
          .from("business_members")
          .select("user_id, role, job_title")
          .eq("business_id", businessId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(5);
        if (membershipsError) throw membershipsError;

        const memberIds = (memberships ?? []).map((row) => row.user_id);
        if (memberIds.length === 0) {
          if (active) setMembers([]);
          return;
        }

        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select(
            "user_id, first_name, last_name, email, avatar_url, personal_bio, business_location"
          )
          .in("user_id", memberIds);
        if (profilesError) throw profilesError;

        const profilesById = new Map(
          (profiles ?? []).map((profile) => [profile.user_id, profile])
        );
        const rows = (memberships ?? []).flatMap((member) => {
          const profile = profilesById.get(member.user_id);
          return profile
            ? [
                {
                  ...profile,
                  job_title: member.job_title,
                  role: member.role,
                } as OverviewMember,
              ]
            : [];
        });
        if (active) setMembers(rows);
      } catch (error) {
        console.error("Failed to load overview members:", error);
        if (active) {
          setMembers([]);
          toast({
            title: "Unable to load members",
            description: "Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        if (active) setMembersLoading(false);
      }
    }

    void loadMembers();
    return () => {
      active = false;
    };
  }, [user?.id, membership?.business_id, organisation?.id, toast]);

  useEffect(() => {
    let active = true;

    async function loadSitePreview() {
      if (!user) {
        setSite(null);
        setSiteLoading(false);
        return;
      }

      setSiteLoading(true);
      setPreviewError(null);
      try {
        const { data: siteRow, error: siteError } = await supabase
          .from("user_sites")
          .select("id, site_name, template_id, content, blocks")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
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
  }, [user?.id, toast]);

  async function messageMember(member: OverviewMember) {
    if (!user) return;
    setMessagingUserId(member.user_id);
    try {
      const conversationId = await getOrCreateConversation(
        user.id,
        member.user_id
      );
      navigate(`/messages?conversation=${conversationId}`);
    } catch (error) {
      console.error("Failed to open member conversation:", error);
      toast({
        title: "Unable to open conversation",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setMessagingUserId(null);
    }
  }

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
              onClick={() => navigate("/tasks")}
              className="text-muted-foreground"
            >
              View all
            </Button>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {latestTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between gap-4 px-5 py-3"
              >
                <p className="min-w-0 truncate text-sm font-medium">
                  {task.title}
                </p>
                <Badge
                  variant="secondary"
                  className="shrink-0 capitalize"
                >
                  {task.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border px-5 py-4">
            <CardTitle className="text-base font-semibold">Members</CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled
              className="text-muted-foreground"
            >
              View all
            </Button>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {membersLoading ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">
                Loading members…
              </p>
            ) : members.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">
                No members found.
              </p>
            ) : (
              members.map((member) => {
                const name = getName(member);
                return (
                  <div
                    key={member.user_id}
                    className="flex items-center gap-3 px-5 py-3"
                  >
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.avatar_url ?? undefined} alt={name} />
                            <AvatarFallback>{getInitials(name)}</AvatarFallback>
                          </Avatar>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">
                              {name}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {member.email}
                            </span>
                          </span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="start"
                        side="left"
                        className="w-80 p-0"
                      >
                        <UserProfile1
                          user={{
                            name,
                            avatar: member.avatar_url ?? undefined,
                            role: member.job_title ?? member.role,
                            bio: member.personal_bio ?? undefined,
                            location: member.business_location ?? undefined,
                            email: member.email,
                          }}
                          className="py-0"
                        />
                      </PopoverContent>
                    </Popover>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-label={`Message ${name}`}
                      disabled={messagingUserId === member.user_id}
                      onClick={() => void messageMember(member)}
                      className="h-9 shrink-0 px-2.5"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Message</span>
                    </Button>
                  </div>
                );
              })
            )}
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
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              Loading website preview…
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
        </div>
        {site && (
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
