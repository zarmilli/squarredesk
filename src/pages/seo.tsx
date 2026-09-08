import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UploadFile from "@/components/ui/uploadfile";
import { useToast } from "@/hooks/use-toast";

type FieldType = "text" | "longtext" | "url" | "image" | "boolean" | "icon" | "logo" | "repeat";

type EditableField = {
  label: string;
  type: FieldType;
  section?: string;
};

type Editables = Record<string, EditableField>;
type ContentMap = Record<string, any>;

type PageMeta = {
  file: string;
  editables: string;
};

const legacySeoKeys = /^(meta_|seo_)/;

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

function normalizeSeoEditables(raw: ContentMap): Editables {
  if (raw.seo && typeof raw.seo === "object" && !raw.seo.type) {
    return Object.fromEntries(
      Object.entries(raw.seo).map(([key, field]) => [key, { ...(field as EditableField), section: "seo" }])
    );
  }

  return Object.fromEntries(
    Object.entries(raw)
      .filter(([key]) => legacySeoKeys.test(key))
      .map(([key, field]) => [key, { ...(field as EditableField), section: "seo" }])
  );
}

function getSeoValues(content: ContentMap, pageFile: string): ContentMap {
  if (content.pages) {
    const page = content.pages[pageFile] ?? {};
    return page._seo ?? page.seo ?? {};
  }

  return content._seo ?? content.seo ?? {};
}

function mergeSeoContent(
  storedContent: ContentMap,
  pageFile: string,
  values: ContentMap
): ContentMap {
  const result = storedContent.pages
    ? structuredClone(storedContent)
    : {
        pages: {
          [pageFile]: {
            ...structuredClone(storedContent),
          },
        },
      };

  result.pages ??= {};
  result.pages[pageFile] ??= {};
  result.pages[pageFile]._seo = {
    ...(result.pages[pageFile]._seo ?? result.pages[pageFile].seo ?? {}),
    ...values,
  };
  delete result.pages[pageFile].seo;

  return result;
}

export default function Seo() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [siteName, setSiteName] = useState("");
  const [pageFile, setPageFile] = useState("index.html");
  const [editables, setEditables] = useState<Editables>({});
  const [content, setContent] = useState<ContentMap>({});
  const [storedContent, setStoredContent] = useState<ContentMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    void loadSeo();
  }, [siteId]);

  async function loadSeo() {
    if (!siteId) return;

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      navigate("/auth/sign-in");
      return;
    }
    setUserId(sessionData.session.user.id);

    const { data: site } = await supabase
      .from("user_sites")
      .select("site_name, template_id, content")
      .eq("id", siteId)
      .single();
    if (!site) return;

    setSiteName(site.site_name);
    const currentContent = parseStoredContent(site.content);
    setStoredContent(currentContent);

    const { data: template } = await supabase
      .from("templates")
      .select("template_slug")
      .eq("id", site.template_id)
      .single();
    if (!template) return;

    let pages: PageMeta[] = [{ file: "index.html", editables: "editables.json" }];

    try {
      const pagesResponse = await fetch(`/templates/${template.template_slug}/pages.json`);
      if (pagesResponse.ok) {
        const pageData = await pagesResponse.json();
        if (Array.isArray(pageData) && pageData.length > 0) pages = pageData;
      }
    } catch {
      // Single-page templates use the fallback above.
    }

    const pageEditables = await Promise.all(
      pages.map(async (page) => {
        const response = await fetch(`/templates/${template.template_slug}/${page.editables}`);
        if (!response.ok) return { page, fields: {} as Editables };
        return { page, fields: normalizeSeoEditables(await response.json()) };
      })
    );
    const selected = pageEditables.find(({ fields }) => Object.keys(fields).length > 0) ?? pageEditables[0];
    if (!selected) return;

    setPageFile(selected.page.file);
    setEditables(selected.fields);
    setContent(getSeoValues(currentContent, selected.page.file));
    setLoading(false);
  }

  function updateField(key: string, value: any) {
    setContent((previous) => ({ ...previous, [key]: value }));
  }

  async function uploadImage(file: File, key: string) {
    if (!siteId || !userId) return;

    const path = `${userId}/${siteId}/seo/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("site-assets")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({
        title: "Image upload failed",
        description: uploadError.message,
        variant: "destructive",
      });
      return;
    }

    const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
    updateField(key, data.publicUrl);
  }

  async function publishInBackground() {
    try {
      const { data, error } = await supabase.functions.invoke("publish-site", {
        body: { siteId },
      });
      if (error) throw error;

      await supabase
        .from("user_sites")
        .update({
          live_url: data.url,
          is_published: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", siteId);
    } catch (error) {
      console.error(error);
      toast({
        title: "Publishing failed",
        description: "Please try saving again.",
        variant: "destructive",
      });
    }
  }

  async function save() {
    if (!siteId || saving) return;
    setSaving(true);

    const nextContent = mergeSeoContent(storedContent, pageFile, content);
    const { error } = await supabase
      .from("user_sites")
      .update({ content: nextContent, updated_at: new Date().toISOString() })
      .eq("id", siteId);

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    setStoredContent(nextContent);
    toast({ title: "Saved" });
    setSaving(false);
    void publishInBackground();
  }

  function renderInput(key: string, field: EditableField) {
    const value = content[key] ?? "";

    if (field.type === "longtext") {
      return (
        <textarea
          className="min-h-24 w-full rounded-md border border-border bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={value}
          onChange={(event) => updateField(key, event.target.value)}
        />
      );
    }

    if (field.type === "boolean") {
      return <input type="checkbox" checked={Boolean(value)} onChange={(event) => updateField(key, event.target.checked)} />;
    }

    if (field.type === "image") {
      return (
        <div className="space-y-2">
          {value && (
            <img
              src={value}
              alt={`${field.label} preview`}
              className="h-32 w-full rounded-md border border-border object-cover"
            />
          )}
          <UploadFile
            accept="image/*"
            label={`Upload ${field.label.toLowerCase()}`}
            description="PNG, JPG, GIF, WEBP"
            onFileSelect={(file) => {
              if (file) void uploadImage(file, key);
            }}
          />
        </div>
      );
    }

    return (
      <Input
        type={field.type === "url" ? "url" : "text"}
        value={value}
        onChange={(event) => updateField(key, event.target.value)}
      />
    );
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading SEO settings...</div>;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{siteName}</h2>
          <p className="text-sm text-muted-foreground">Search engine settings</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/tables")}>Back</Button>
      </div>

      <div className="max-w-3xl space-y-5">
        {Object.entries(editables).map(([key, field]) => (
          <div key={key} className="grid grid-cols-1 gap-2 md:grid-cols-2 md:items-center">
            <label className="text-sm font-medium text-foreground" htmlFor={`seo-${key}`}>
              {field.label}
            </label>
            <div id={`seo-${key}`}>{renderInput(key, field)}</div>
          </div>
        ))}

        {Object.keys(editables).length === 0 && (
          <p className="text-sm text-muted-foreground">This template has no SEO fields.</p>
        )}

        <div className="pt-3">
          <Button onClick={() => void save()} disabled={saving || Object.keys(editables).length === 0}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}