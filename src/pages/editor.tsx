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

type EditableField = {
  label: string;
  type: FieldType;
  max?: number;
  fields?: Record<string, EditableField>;
};

type Editables = Record<string, EditableField>;
type ContentMap = Record<string, any>;

// ─── Component ────────────────────────────────────────────────────────────────

export default function Editor() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatTemplates = useRef<Record<string, HTMLElement>>({});

  const navigate = useNavigate();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const siteId = params.get("site");

  const [siteName, setSiteName] = useState("");
  const [templateSlug, setTemplateSlug] = useState("");
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
    setContent(site.content || {});
    setLastSaved(site.updated_at);

    const { data: template } = await supabase
      .from("templates")
      .select("template_slug")
      .eq("id", site.template_id)
      .single();
    if (!template) return;

    setTemplateSlug(template.template_slug);

    const res = await fetch(`/templates/${template.template_slug}/editables.json`);
    const fields: Editables = await res.json();
    setEditables(fields);
  }

  // ─── Iframe load ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!iframeRef.current || !templateSlug) return;
    iframeRef.current.src = `/templates/${templateSlug}/index.html`;
    iframeRef.current.onload = () => {
      captureRepeatTemplates();
      applyContent(content);
    };
  }, [templateSlug]);

  function captureRepeatTemplates() {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    doc.querySelectorAll<HTMLElement>("[data-repeat]").forEach((container) => {
      const key = container.dataset.repeat!;
      const firstChild = container.firstElementChild as HTMLElement | null;
      if (firstChild) {
        repeatTemplates.current[key] = firstChild.cloneNode(true) as HTMLElement;
      }
    });
  }

  // ─── Apply content to iframe ───────────────────────────────────────────────

  function applyContent(values: ContentMap) {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    Object.entries(values).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        applyRepeatGroup(doc, key, value);
        return;
      }

      if (value == null) return;

      const el = doc.querySelector<HTMLElement>(`[data-edit="${key}"]`);
      if (!el) return;

      applyScalarField(el, value);
    });
  }

  function applyRepeatGroup(doc: Document, key: string, values: Record<string, any>[]) {
    const container = doc.querySelector<HTMLElement>(`[data-repeat="${key}"]`);
    if (!container) return;

    const tmpl = repeatTemplates.current[key];
    if (!tmpl) return;

    container.innerHTML = "";

    values.forEach((item) => {
      const clone = tmpl.cloneNode(true) as HTMLElement;

      Object.entries(item).forEach(([subKey, subValue]) => {
        const el = clone.querySelector<HTMLElement>(`[data-edit="${subKey}"]`);
        if (!el || subValue == null) return;
        applyScalarField(el, subValue as string);
      });

      container.appendChild(clone);
    });
  }

  function applyScalarField(el: HTMLElement, value: string) {
    const role = el.dataset.editRole;

    if (role === "background") {
      el.style.backgroundImage = `url("${value}")`;
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
      el.style.backgroundRepeat = "no-repeat";
      return;
    }

    if (role === "href") {
      (el as HTMLAnchorElement).href = value;
      return;
    }

    if (role === "img" || el instanceof HTMLImageElement) {
      (el as HTMLImageElement).src = value;
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

  async function uploadImage(file: File, key: string, repeatKey?: string, repeatIndex?: number, subKey?: string) {
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
    if (!siteId) return;

    const { data } = await supabase
      .from("user_sites")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", siteId)
      .select("updated_at")
      .single();

    if (data) {
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

      // Save live URL back to the site row
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
      {/* HEADER */}
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
          <div className="p-4 border-b">
            <h2 className="font-semibold text-sm">{siteName}</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {Object.entries(editables).map(([key, field]) => (
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
            ))}
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