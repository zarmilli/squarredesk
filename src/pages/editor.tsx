import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { useToast } from "@/hooks/use-toast";

import happyImage from "/images/happy.png";
import squeakImage from "/images/speaking.png";
import Confetti from "react-confetti";

// ─── Types ────────────────────────────────────────────────────────────────────

type FieldType = "text" | "longtext" | "url" | "image" | "boolean" | "repeat";

/**
 * section:
 *   "editor"    → (default) shown in the main editor panel
 *   "seo"       → filtered out; handled by the SEO settings page
 *   "inventory" → filtered out; handled by the inventory management page
 */
type FieldSection = "editor" | "seo" | "inventory" | "blog";

type EditableField = {
  label: string;
  type: FieldType;
  max?: number;
  section?: FieldSection;
  fields?: Record<string, EditableField>;
};

/**
 * A page entry inside pages.json (multi-page templates).
 * Single-page templates have no pages.json — the editor falls back to index.html
 * and editables.json at the template root.
 */
type PageMeta = {
  /** Shown in the dropdown, e.g. "Home", "About", "Services" */
  label: string;
  /** Path relative to the template folder, e.g. "index.html" or "about.html" */
  file: string;
  /** Path to the editables for this page, e.g. "editables.json" or "about-editables.json" */
  editables: string;
};

type Editables = Record<string, EditableField>;
type ContentMap = Record<string, any>;

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

function isPageBasedContent(content: ContentMap | null | undefined) {
  return !!content && typeof content === "object" && !!content.pages;
}

function getSectionContent(pageContent: ContentMap, section: FieldSection) {
  if (section === "editor") return pageContent;
  if (section === "seo") return pageContent._seo ?? pageContent.seo ?? {};
  return pageContent[section] ?? {};
}

function normalizeEditables(rawEditables: ContentMap): Editables {
  const groupedSections: FieldSection[] = ["editor", "seo", "inventory", "blog"];
  const hasGroupedSections = groupedSections.some(
    (section) =>
      rawEditables[section] &&
      typeof rawEditables[section] === "object" &&
      !rawEditables[section].type
  );

  if (!hasGroupedSections) return rawEditables as Editables;

  return groupedSections.reduce<Editables>((result, section) => {
    const sectionFields = rawEditables[section];
    if (!sectionFields || typeof sectionFields !== "object") return result;

    Object.entries(sectionFields).forEach(([fieldKey, field]) => {
      result[fieldKey] = {
        ...(field as EditableField),
        section,
      };
    });

    return result;
  }, {});
}

function getPageEditorContent(
  storedContent: ContentMap,
  pageFile: string,
  editables: Editables
) {
  if (!isPageBasedContent(storedContent)) return storedContent ?? {};

  const pageContent = storedContent.pages?.[pageFile] ?? {};
  const result: ContentMap = {};

  Object.entries(editables).forEach(([fieldKey, field]) => {
    const section = field.section ?? "editor";
    const sectionContent = getSectionContent(pageContent, section);
    const value =
      section === "editor"
        ? sectionContent[fieldKey] ?? pageContent.editor?.[fieldKey]
        : sectionContent[fieldKey];

    if (value !== undefined) {
      result[fieldKey] = value;
    }
  });

  return result;
}

function migrateContent(
  oldContent: ContentMap,
  pageFile: string,
  editables: Editables
) {
  const result: ContentMap = {
    pages: {
      [pageFile]: {
        _seo: {},
        inventory: {},
        blog: {},
      },
    },
  };

  Object.entries(editables).forEach(([fieldKey, field]) => {
    const section = field.section ?? "editor";
    const value = oldContent[fieldKey];

    if (value === undefined) return;

    const pageContent = result.pages[pageFile];

    if (section === "editor") {
      pageContent[fieldKey] = value;
      return;
    }

    const sectionKey = section === "seo" ? "_seo" : section;
    pageContent[sectionKey][fieldKey] = value;
  });

  return result;
}

function mergePageContent(
  storedContent: ContentMap,
  pageFile: string,
  pageValues: ContentMap,
  editables: Editables
) {
  const result = isPageBasedContent(storedContent)
    ? structuredClone(storedContent)
    : migrateContent(storedContent ?? {}, pageFile, editables);

  result.pages ??= {};
  result.pages[pageFile] ??= {};

  Object.entries(editables).forEach(([fieldKey, field]) => {
    const section = field.section ?? "editor";
    const value = pageValues[fieldKey];

    if (value === undefined) return;

    const pageContent = result.pages[pageFile];

    if (section === "editor") {
      pageContent[fieldKey] = value;
      return;
    }

    const sectionKey = section === "seo" ? "_seo" : section;
    pageContent[sectionKey] ??= {};
    pageContent[sectionKey][fieldKey] = value;
  });

  return result;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Editor() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Stores a pristine clone of each repeat group's first child per page.
  // Keyed as `${pageFile}::${repeatKey}` so switching pages never cross-contaminates.
  const repeatTemplates = useRef<Record<string, HTMLElement>>({});
  const storedContent = useRef<ContentMap>({});
  const activePageFile = useRef("index.html");

  const navigate = useNavigate();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const siteId = params.get("site");

  const [siteName, setSiteName] = useState("");
  const [templateSlug, setTemplateSlug] = useState("");

  // Multi-page support
  const [pages, setPages] = useState<PageMeta[]>([]);
  const [activePage, setActivePage] = useState<PageMeta | null>(null);

  const [editables, setEditables] = useState<Editables>({});
  const [content, setContent] = useState<ContentMap>({});
  const [userId, setUserId] = useState("");
  const [dirty, setDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [deployStatus, setDeployStatus] = useState<"deploying" | "success" | "error">("deploying");
  const [deployUrl, setDeployUrl] = useState("");

  // ─── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return navigate("/auth/sign-in");
    setUserId(data.session.user.id);
    if (!siteId) return;

    const { data: site } = await supabase
      .from("user_sites")
      .select("site_name, template_id, content, updated_at")
      .eq("id", siteId)
      .single();
    if (!site) return;

    setSiteName(site.site_name);
    storedContent.current = parseStoredContent(site.content);
    setLastSaved(site.updated_at);

    const { data: template } = await supabase
      .from("templates")
      .select("template_slug")
      .eq("id", site.template_id)
      .single();
    if (!template) return;

    const slug = template.template_slug;
    setTemplateSlug(slug);

    // ── Try to load pages.json. If it 404s this is a single-page template. ──
    let resolvedPages: PageMeta[] = [];

    try {
      const pagesRes = await fetch(`/templates/${slug}/pages.json`);
      if (pagesRes.ok) {
        resolvedPages = await pagesRes.json();
      }
    } catch {
      // No pages.json — single-page template, handled below.
    }

    if (resolvedPages.length === 0) {
      // Single-page template: synthesise a single page entry.
      resolvedPages = [
        { label: "Page", file: "index.html", editables: "editables.json" },
      ];
    }

    setPages(resolvedPages);

    // Always start on the first page.
    await loadPage(resolvedPages[0], slug, storedContent.current);
  }

  // ─── Load a specific page ──────────────────────────────────────────────────

  /**
   * Fetches the editables for the given page, updates the iframe src,
   * and sets the activePage state. Content is shared across all pages in one
   * object so switching pages never loses edits made on another page.
   */
  async function loadPage(page: PageMeta, slug: string, currentContent: ContentMap) {
    activePageFile.current = page.file;
    setActivePage(page);

    const res = await fetch(`/templates/${slug}/${page.editables}`);
    const fields = normalizeEditables(await res.json());
    const pageContent = getPageEditorContent(currentContent, page.file, fields);
    setEditables(fields);
    setContent(pageContent);

    if (iframeRef.current) {
      iframeRef.current.onload = () => {
        captureRepeatTemplates(page.file);
        applyContent(pageContent, page.file);
      };
      iframeRef.current.src = `/templates/${slug}/${page.file}`;
    }
  }

  // ─── Handle page selection from dropdown ──────────────────────────────────

  async function handlePageChange(pageFile: string) {
    if (!templateSlug) return;
    await persist();
    const page = pages.find((p) => p.file === pageFile);
    if (!page) return;
    await loadPage(page, templateSlug, storedContent.current);
  }

  // ─── Capture repeat templates ──────────────────────────────────────────────

  function captureRepeatTemplates(pageFile: string) {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    doc.querySelectorAll<HTMLElement>("[data-repeat]").forEach((container) => {
      const key = container.dataset.repeat!;
      const firstChild = container.firstElementChild as HTMLElement | null;
      if (firstChild) {
        repeatTemplates.current[`${pageFile}::${key}`] = firstChild.cloneNode(true) as HTMLElement;
      }
    });
  }

  // ─── Apply content to iframe ───────────────────────────────────────────────

  function applyContent(values: ContentMap, pageFile?: string) {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    const file = pageFile ?? activePageFile.current;

    Object.entries(values).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        applyRepeatGroup(doc, key, value, file);
        return;
      }
      if (value == null) return;
      doc
        .querySelectorAll<HTMLElement>(`[data-edit="${key}"]`)
        .forEach((el) => applyScalarField(el, value));
    });
  }

  function applyRepeatGroup(
    doc: Document,
    key: string,
    values: Record<string, any>[],
    pageFile: string
  ) {
    const container = doc.querySelector<HTMLElement>(`[data-repeat="${key}"]`);
    if (!container) return;

    const tmplKey = `${pageFile}::${key}`;
    const tmpl = repeatTemplates.current[tmplKey];
    if (!tmpl) return;

    container.innerHTML = "";
    values.forEach((item) => {
      const clone = tmpl.cloneNode(true) as HTMLElement;
      Object.entries(item).forEach(([subKey, subValue]) => {
        if (subValue == null) return;
        clone
          .querySelectorAll<HTMLElement>(`[data-edit="${subKey}"]`)
          .forEach((el) => applyScalarField(el, subValue as string));
      });
      container.appendChild(clone);
    });
  }

  function applyScalarField(el: HTMLElement, value: string) {
    const role = el.dataset.editRole;
    // Use tagName — instanceof fails for elements inside the iframe (separate JS realm).
    const tag = el.tagName.toUpperCase();

    if (role === "background") {
      el.style.backgroundImage = `url("${value}")`;
      el.setAttribute("style", el.getAttribute("style") ?? "");
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
      el.style.backgroundRepeat = "no-repeat";
      return;
    }
    if (role === "href") {
      el.setAttribute("href", value);
      return;
    }
    if (tag === "SOURCE") {
      el.setAttribute("srcset", value);
      return;
    }
    if (role === "img" || tag === "IMG") {
      el.setAttribute("src", value);
      el.removeAttribute("srcset");
      return;
    }
    el.textContent = value;
  }

  // ─── Field update helpers ──────────────────────────────────────────────────

  function updateField(key: string, value: any) {
    setDirty(true);
    setContent((prev) => {
      const updated = { ...prev, [key]: value };
      applyContent(updated);
      return updated;
    });
  }

  // ─── Repeat group helpers ──────────────────────────────────────────────────

  function blankItem(fields: Record<string, EditableField>): Record<string, string> {
    return Object.fromEntries(Object.keys(fields).map((k) => [k, ""]));
  }

  function addRepeatItem(key: string, fields: Record<string, EditableField>) {
    setDirty(true);
    setContent((prev) => {
      const arr = [...(prev[key] ?? []), blankItem(fields)];
      const updated = { ...prev, [key]: arr };
      applyContent(updated);
      return updated;
    });
  }

  function removeRepeatItem(key: string, index: number) {
    setDirty(true);
    setContent((prev) => {
      const arr = (prev[key] ?? []).filter((_: any, i: number) => i !== index);
      const updated = { ...prev, [key]: arr };
      applyContent(updated);
      return updated;
    });
  }

  function updateRepeatField(key: string, index: number, subKey: string, value: any) {
    setDirty(true);
    setContent((prev) => {
      const arr = [...(prev[key] ?? [])];
      arr[index] = { ...arr[index], [subKey]: value };
      const updated = { ...prev, [key]: arr };
      applyContent(updated);
      return updated;
    });
  }

  // ─── Image upload ──────────────────────────────────────────────────────────

  async function uploadImage(
    file: File,
    key: string,
    repeatKey?: string,
    repeatIndex?: number,
    subKey?: string
  ) {
    const path = `${userId}/${siteId}/images/${Date.now()}-${file.name}`;
    await supabase.storage.from("site-assets").upload(path, file, { upsert: true });
    const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
    const url = data.publicUrl;

    if (repeatKey !== undefined && repeatIndex !== undefined && subKey !== undefined) {
      updateRepeatField(repeatKey, repeatIndex, subKey, url);
    } else {
      updateField(key, url);
    }
  }

  // ─── Autosave ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!dirty) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => persist(), 2000);
  }, [content]);

  async function persist(showToast = false) {
    if (!siteId || !activePage) return;

    const nextContent = mergePageContent(
      storedContent.current,
      activePage.file,
      content,
      editables
    );

    const { data } = await supabase
      .from("user_sites")
      .update({ content: nextContent, updated_at: new Date().toISOString() })
      .eq("id", siteId)
      .select("updated_at")
      .single();

    if (data) {
      storedContent.current = nextContent;
      setLastSaved(data.updated_at);
      setDirty(false);
    }
    if (showToast) toast({ title: "Saved" });
  }

  // ─── Publish ───────────────────────────────────────────────────────────────

  async function publishSite() {
    if (!siteId) return;
    await persist();
    setDeployModalOpen(true);
    setDeployStatus("deploying");

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

      setDeployUrl(data.url);
      setDeployStatus("success");
    } catch (err) {
      console.error(err);
      setDeployStatus("error");
    }
  }

  async function handleBack() {
    await persist();
    toast({ title: "Saved" });
    navigate("/");
  }

  function formatSaved() {
    if (!lastSaved) return "Unsaved";
    const d = new Date(lastSaved);
    return `Saved ${d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }

  // ─── Section filtering ─────────────────────────────────────────────────────

  /**
   * Only fields with no section tag, or section === "editor", are shown here.
   * "seo" fields are handled by the SEO settings page.
   * "inventory" fields are handled by the inventory management page.
   */
  const editorFields = Object.entries(editables).filter(
    ([, field]) => !field.section || field.section === "editor"
  );

  // ─── Field renderer ────────────────────────────────────────────────────────

  function renderScalarInput(
    key: string,
    field: EditableField,
    value: any,
    onChange: (v: any) => void,
    onImageChange: (file: File) => void
  ) {
    switch (field.type) {
      case "text":
      case "url":
        return (
          <Input
            value={value ?? ""}
            placeholder={field.label}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case "longtext":
        return (
          <textarea
            className="w-full border rounded-md p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            rows={3}
            value={value ?? ""}
            placeholder={field.label}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case "image":
        return (
          <div className="space-y-2">
            {value && (
              <img
                src={value}
                alt="preview"
                className="w-full h-24 object-cover rounded-md border"
              />
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files && onImageChange(e.target.files[0])}
            />
          </div>
        );

      case "boolean":
        return (
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
          />
        );

      default:
        return null;
    }
  }

  // ─── Repeat group renderer ─────────────────────────────────────────────────

  function renderRepeatGroup(key: string, field: EditableField) {
    const subFields = field.fields ?? {};
    const items: Record<string, any>[] = content[key] ?? [];
    const atMax = field.max !== undefined && items.length >= field.max;

    return (
      <div className="space-y-3">
        {items.map((item, index) => (
          <Card key={index} className="p-3 border bg-gray-50 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {field.label} {items.length > 1 ? `#${index + 1}` : ""}
              </p>
              <button
                onClick={() => removeRepeatItem(key, index)}
                className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                aria-label="Remove item"
              >
                ✕ Remove
              </button>
            </div>

            {Object.entries(subFields).map(([subKey, subField]) => (
              <div key={subKey}>
                <p className="text-xs font-medium text-gray-600 mb-1">{subField.label}</p>
                {renderScalarInput(
                  subKey,
                  subField,
                  item[subKey],
                  (v) => updateRepeatField(key, index, subKey, v),
                  (file) => uploadImage(file, subKey, key, index, subKey)
                )}
              </div>
            ))}
          </Card>
        ))}

        {!atMax && (
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => addRepeatItem(key, subFields)}
          >
            + Add {field.label}
          </Button>
        )}

        {atMax && (
          <p className="text-xs text-center text-gray-400">
            Maximum of {field.max} items reached
          </p>
        )}
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col">
      {/* TOP BAR */}
      <div className="border-b bg-white px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={handleBack}>
            ← Back
          </Button>
          <Button size="sm" onClick={() => persist(true)}>
            Save
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <BadgeWithDot
            type="pill-color"
            size="md"
            color={dirty ? "warning" : "success"}
          >
            {dirty ? "Unsaved changes" : formatSaved()}
          </BadgeWithDot>
          <Button size="sm" onClick={publishSite}>
            Publish
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL */}
        <div className="w-[360px] border-r bg-white flex flex-col shrink-0">

          {/* Site name + page selector */}
          <div className="p-4 border-b space-y-3">
            <h2 className="font-semibold text-sm">{siteName}</h2>

            {/* Page dropdown — only shown when the template has multiple pages */}
            {pages.length > 1 && (
              <div className="space-y-1">
                <p className="text-xs text-gray-500 font-medium">Editing page</p>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring"
                  value={activePage?.file ?? ""}
                  onChange={(e) => handlePageChange(e.target.value)}
                >
                  {pages.map((page) => (
                    <option key={page.file} value={page.file}>
                      {page.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Fields — section-filtered */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {editorFields.length === 0 ? (
              <p className="text-xs text-gray-400 text-center pt-8">
                All fields on this page are managed in SEO or Inventory settings.
              </p>
            ) : (
              editorFields.map(([key, field]) => (
                <Card key={key} className="p-3">
                  {field.type === "repeat" ? (
                    <>
                      <p className="text-sm font-semibold mb-3">{field.label}</p>
                      {renderRepeatGroup(key, field)}
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium mb-2">{field.label}</p>
                      {renderScalarInput(
                        key,
                        field,
                        content[key],
                        (v) => updateField(key, v),
                        (file) => uploadImage(file, key)
                      )}
                    </>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>

        {/* IFRAME PREVIEW */}
        <iframe ref={iframeRef} className="flex-1 border-0" title="Site preview" />
      </div>

      {/* DEPLOY MODAL */}
      {deployModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          {deployStatus === "success" && (
            <Confetti recycle={false} numberOfPieces={300} />
          )}

          <Card className="relative p-8 w-[420px] text-center space-y-4">
            <button
              onClick={() => deployStatus !== "deploying" && setDeployModalOpen(false)}
              disabled={deployStatus === "deploying"}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl disabled:opacity-40"
            >
              ✕
            </button>

            <img
              src={deployStatus === "error" ? squeakImage : happyImage}
              className="w-28 mx-auto"
              alt=""
            />

            {deployStatus === "deploying" && (
              <>
                <h2 className="text-lg font-semibold">
                  Squeak is deploying your site...
                </h2>
                <div className="h-10 bg-gray-200 rounded animate-pulse" />
              </>
            )}

            {deployStatus === "success" && (
              <>
                <h2 className="text-lg font-semibold">🎉 Your site is live!</h2>
                <p className="text-sm text-gray-500">
                  Squeak pushed your website to the internet.
                </p>
                <div className="bg-gray-100 p-3 rounded break-all text-sm">
                  {deployUrl}
                </div>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(deployUrl)}
                  >
                    Copy URL
                  </Button>
                  <Button onClick={() => window.open(deployUrl, "_blank")}>
                    View Site
                  </Button>
                </div>
              </>
            )}

            {deployStatus === "error" && (
              <>
                <h2 className="text-lg font-semibold">
                  Oh oh! Squeak couldn't deploy that
                </h2>
                <Button onClick={publishSite}>Try again</Button>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
