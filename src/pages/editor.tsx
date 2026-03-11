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
import Confetti from "react-confetti"

type EditableField = {
  label: string;
  type: "text" | "longtext" | "url" | "boolean" | "image" | "repeatable";
  fields?: Record<string, EditableField>;
};

export default function Editor() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const autosaveTimer = useRef<any>(null);

  const navigate = useNavigate();
  const { toast } = useToast();
  const [params] = useSearchParams();

  const siteId = params.get("site");

  const [siteName, setSiteName] = useState("");
  const [templateSlug, setTemplateSlug] = useState("");
  const [editables, setEditables] = useState<Record<string, EditableField>>({});
  const [content, setContent] = useState<Record<string, any>>({});
  const [userId, setUserId] = useState("");
  const [dirty, setDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [deployStatus, setDeployStatus] = useState<"deploying" | "success" | "error">("deploying");
  const [deployUrl, setDeployUrl] = useState("");

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
    const fields = await res.json();

    setEditables(fields);
  }

  /* ───────── IFRAME ───────── */

  useEffect(() => {
    if (!iframeRef.current || !templateSlug) return;

    iframeRef.current.src = `/templates/${templateSlug}/index.html`;

    iframeRef.current.onload = () => {
      applyContent(content);
    };
  }, [templateSlug]);

  /* ───────── APPLY CONTENT ───────── */

  function applyContent(values: Record<string, any>) {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    Object.entries(values).forEach(([key, value]) => {

      if (Array.isArray(value)) {

        const repeatContainer = doc.querySelector(`[data-repeat="${key}"]`);
        if (!repeatContainer) return;

        const template = repeatContainer.querySelector("[data-repeat-item]");
        if (!template) return;

        repeatContainer.innerHTML = "";

        value.forEach((item: any) => {

          const clone = template.cloneNode(true) as HTMLElement;

          Object.entries(item).forEach(([subKey, subValue]) => {
            const el = clone.querySelector(`[data-edit="${subKey}"]`);
            if (el) el.textContent = subValue as string;
          });

          repeatContainer.appendChild(clone);
        });

        return;
      }

      if (value == null) return;

      const el = doc.querySelector(`[data-edit="${key}"]`) as HTMLElement | null;
      if (!el) return;

      const role = el.dataset.editRole;

      if (role === "img") {
        if (el instanceof HTMLImageElement) el.src = value;
        return;
      }

      if (role === "background") {
        el.style.backgroundImage = `url("${value}")`;
        el.style.backgroundSize = "cover";
        el.style.backgroundPosition = "center";
        el.style.backgroundRepeat = "no-repeat";
        return;
      }

      el.textContent = value;
    });
  }

  function updateField(key: string, value: any, type: string) {
    setDirty(true);

    setContent(prev => {
      const updated = { ...prev, [key]: value };
      applyContent(updated);
      return updated;
    });

    const el =
      iframeRef.current?.contentDocument?.querySelector(
        `[data-edit="${key}"]`
      ) as any;

    if (!el) return;

    if (type === "boolean") {
      el.style.display = value ? "" : "none";
    }
  }

  /* ───────── REPEATABLE HELPERS ───────── */

  function addRepeatableItem(key: string) {
    setContent(prev => {
      const arr = [...(prev[key] || [])];
      arr.push({});
      const updated = { ...prev, [key]: arr };
      applyContent(updated);
      return updated;
    });
  }

  function removeRepeatableItem(key: string, index: number) {
    setContent(prev => {
      const arr = [...(prev[key] || [])];
      arr.splice(index, 1);
      const updated = { ...prev, [key]: arr };
      applyContent(updated);
      return updated;
    });
  }

  function updateRepeatableField(parentKey: string, index: number, field: string, value: any) {
    setContent(prev => {
      const arr = [...(prev[parentKey] || [])];
      arr[index] = { ...arr[index], [field]: value };
      const updated = { ...prev, [parentKey]: arr };
      applyContent(updated);
      return updated;
    });
  }

  /* ───────── AUTOSAVE ───────── */

  useEffect(() => {
    if (!dirty) return;

    clearTimeout(autosaveTimer.current);

    autosaveTimer.current = setTimeout(() => {
      persist();
    }, 2000);
  }, [content]);

  async function persist(showToast = false) {
    if (!siteId) return;

    const { data } = await supabase
      .from("user_sites")
      .update({
        content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", siteId)
      .select("updated_at")
      .single();

    if (data) {
      setLastSaved(data.updated_at);
      setDirty(false);
    }

    if (showToast) toast({ title: "Saved" });
  }

  async function publishSite() {

    if (!siteId) return;

    await persist();

    setDeployModalOpen(true);
    setDeployStatus("deploying");

    try {

      const { data, error } = await supabase.functions.invoke(
        "publish-site",
        { body: { siteId } }
      );

      if (error) throw error;

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

  async function uploadImage(file: File, key: string) {
    const path = `${userId}/${siteId}/images/${Date.now()}-${file.name}`;

    await supabase.storage.from("site-assets").upload(path, file, {
      upsert: true,
    });

    const { data } = supabase.storage
      .from("site-assets")
      .getPublicUrl(path);

    updateField(key, data.publicUrl, "image");
  }

  function formatSaved() {
    if (!lastSaved) return "Unsaved";

    const d = new Date(lastSaved);

    return `Saved ${d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}, ${d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* HEADER */}
      <div className="border-b bg-white px-4 py-2 flex items-center justify-between">
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
        <div className="w-[360px] border-r bg-white flex flex-col">

          <div className="p-4 border-b">
            <h2 className="font-semibold">{siteName}</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {Object.entries(editables).map(([key, field]) => (
              <Card key={key} className="p-3 mb-3">
                <p className="text-sm font-medium mb-2">{field.label}</p>

                {field.type === "repeatable" && (
                  <div>
                    {(content[key] || []).map((item: any, index: number) => (
                      <Card key={index} className="p-3 mb-3 border">

                        {Object.entries(field.fields || {}).map(([subKey, subField]) => (
                          <div key={subKey} className="mb-2">
                            <p className="text-xs mb-1">{subField.label}</p>

                            <Input
                              value={item?.[subKey] || ""}
                              onChange={(e) =>
                                updateRepeatableField(
                                  key,
                                  index,
                                  subKey,
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        ))}

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeRepeatableItem(key, index)}
                        >
                          Delete
                        </Button>

                      </Card>
                    ))}

                    <Button size="sm" onClick={() => addRepeatableItem(key)}>
                      Add Item
                    </Button>
                  </div>
                )}

                {field.type === "image" && (
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      e.target.files && uploadImage(e.target.files[0], key)
                    }
                  />
                )}

                {(field.type === "text" || field.type === "url") && (
                  <Input
                    value={content[key] || ""}
                    onChange={(e) =>
                      updateField(key, e.target.value, field.type)
                    }
                  />
                )}

                {field.type === "longtext" && (
                  <textarea
                    className="w-full border rounded p-2"
                    rows={4}
                    value={content[key] || ""}
                    onChange={(e) =>
                      updateField(key, e.target.value, field.type)
                    }
                  />
                )}

                {field.type === "boolean" && (
                  <input
                    type="checkbox"
                    checked={!!content[key]}
                    onChange={(e) =>
                      updateField(key, e.target.checked, field.type)
                    }
                  />
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* IFRAME */}
        <iframe ref={iframeRef} className="flex-1 border-0" />
      </div>

      {/* DEPLOY MODAL */}

      {deployModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          {deployStatus === "success" && <Confetti recycle={false} numberOfPieces={300} />}

          <Card className="relative p-8 w-[420px] text-center space-y-4">

            {/* Close button */}
            <button
              onClick={() => deployStatus !== "deploying" && setDeployModalOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl disabled:opacity-40"
              disabled={deployStatus === "deploying"}
            >
              ✕
            </button>

            <img
              src={deployStatus === "error" ? squeakImage : happyImage}
              className="w-28 mx-auto"
            />

            {/* DEPLOYING */}
            {deployStatus === "deploying" && (
              <>
                <h2 className="text-lg font-semibold">
                  Squeak is deploying your site...
                </h2>

                <div className="h-10 bg-gray-200 rounded animate-pulse" />
              </>
            )}

            {/* SUCCESS */}
            {deployStatus === "success" && (
              <>
                <h2 className="text-lg font-semibold">
                  🎉 Your site is live!
                </h2>

                <p className="text-sm text-gray-500">
                  Squeak pushed your website to the internet.
                </p>

                <div className="bg-gray-100 p-3 rounded break-all text-sm">
                  {deployUrl}
                </div>

                <div className="flex gap-2 justify-center">

                  <Button
                    onClick={() => navigator.clipboard.writeText(deployUrl)}
                    variant="outline"
                  >
                    Copy URL
                  </Button>

                  <Button
                    onClick={() => window.open(deployUrl, "_blank")}
                  >
                    View Site
                  </Button>

                </div>
              </>
            )}

            {/* ERROR */}
            {deployStatus === "error" && (
              <>
                <h2 className="text-lg font-semibold">
                  Oh oh! Squeak couldn't deploy that
                </h2>

                <Button onClick={publishSite}>
                  Try again
                </Button>
              </>
            )}

          </Card>

        </div>
      )}
    </div>
  );
}