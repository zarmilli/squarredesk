import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, ImagePlus, Plus, Search, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import UploadFile from "@/components/ui/uploadfile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

type Tag = "in stock" | "out of stock";

type Product = {
  id?: string;
  site_id?: string;
  name: string;
  description: string;
  price: string;
  cover_image: string;
  secondary_image: string;
  sku: string;
  is_active: boolean;
  sort_order: number;
};

const emptyProduct: Product = {
  name: "",
  description: "",
  price: "0.00",
  cover_image: "",
  secondary_image: "",
  sku: "",
  is_active: true,
  sort_order: 0,
};

function toTag(is_active: boolean): Tag {
  return is_active ? "in stock" : "out of stock";
}

function fromTag(tag: Tag): boolean {
  return tag === "in stock";
}

export default function Inventory() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [siteName, setSiteName] = useState("");
  const [userId, setUserId] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [draft, setDraft] = useState<Product>({ ...emptyProduct });
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadInventory();
  }, [siteId]);

  // ── Load site name + all products from DB ──────────────────────
  async function loadInventory() {
    if (!siteId) return;

    const { data: session } = await supabase.auth.getSession();
    if (!session.session) { navigate("/auth/sign-in"); return; }
    setUserId(session.session.user.id);

    const { data: site } = await supabase
      .from("user_sites")
      .select("site_name")
      .eq("id", siteId)
      .single();

    if (site) setSiteName(site.site_name);

    const { data: productRows, error } = await supabase
      .from("products")
      .select("*")
      .eq("site_id", siteId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      toast({ title: "Failed to load products", description: error.message, variant: "destructive" });
    } else {
      setProducts(
        (productRows ?? []).map((p) => ({
          ...p,
          price: Number.parseFloat(String(p.price ?? "0")).toFixed(2),
        }))
      );
    }

    setLoading(false);
  }

  // ── Draft helpers ─────────────────────────────────────────────
  function updateDraft(key: keyof Product, value: any) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function uploadImage(file: File, key: "cover_image" | "secondary_image") {
    if (!siteId || !userId) return;
    const path = `${userId}/${siteId}/inventory/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from("site-assets")
      .upload(path, file, { upsert: true });

    if (error) {
      toast({ title: "Image upload failed", description: error.message, variant: "destructive" });
      return;
    }

    const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
    updateDraft(key, data.publicUrl);
  }

  // ── Save product — insert or update ───────────────────────────
  async function saveProduct() {
    if (!siteId) return;
    setSaving(true);

    const price = Number.parseFloat(draft.price || "0");
    const payload = {
      site_id: siteId,
      name: draft.name,
      description: draft.description,
      price: Number.isFinite(price) ? price : 0,
      cover_image: draft.cover_image,
      secondary_image: draft.secondary_image,
      sku: draft.sku,
      is_active: draft.is_active,
      sort_order: draft.sort_order,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      // UPDATE existing
      const { data, error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editingId)
        .select()
        .single();

      if (error) {
        toast({ title: "Save failed", description: error.message, variant: "destructive" });
      } else {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === editingId
              ? { ...data, price: Number.parseFloat(String(data.price)).toFixed(2) }
              : p
          )
        );
        toast({ title: "Product updated" });
        setDrawerOpen(false);
      }
    } else {
      // INSERT new
      const { data, error } = await supabase
        .from("products")
        .insert({ ...payload, created_at: new Date().toISOString() })
        .select()
        .single();

      if (error) {
        toast({ title: "Save failed", description: error.message, variant: "destructive" });
      } else {
        setProducts((prev) => [
          ...prev,
          { ...data, price: Number.parseFloat(String(data.price)).toFixed(2) },
        ]);
        toast({ title: "Product added" });
        setDrawerOpen(false);
      }
    }

    setSaving(false);
  }

  // ── Delete selected products ───────────────────────────────────
  async function deleteSelected() {
    if (!selected.length) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .in("id", selected);

    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      setProducts((prev) => prev.filter((p) => !selected.includes(p.id!)));
      setSelected([]);
      setDeleteMode(false);
      toast({ title: `${selected.length} product${selected.length > 1 ? "s" : ""} deleted` });
    }
  }

  // ── Toggle is_active inline from the tag dropdown ─────────────
  async function updateTag(productId: string, tag: Tag) {
    const is_active = fromTag(tag);

    await supabase
      .from("products")
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq("id", productId);

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, is_active } : p))
    );
  }

  const filteredProducts = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [products, search]
  );

  const allSelected =
    products.length > 0 && selected.length === products.length;

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading products...</div>;
  }

  return (
    <div className="relative min-h-full p-6">

      {/* HEADER */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Products</h1>
          <p className="text-sm text-muted-foreground">{siteName}</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/tables")}>Back</Button>
      </div>

      {/* TABLE */}
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <header className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <h2 className="text-base font-semibold">Products</h2>

          <label className="flex h-9 min-w-56 flex-1 items-center gap-2 rounded-md border border-input px-3">
            <Search className="size-4 text-muted-foreground" />
            <span className="sr-only">Search products by name</span>
            <input
              className="w-full bg-transparent text-sm outline-none"
              placeholder="Search by name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          <div className="ml-auto flex items-center gap-2">
            {deleteMode && (
              <Button variant="outline" onClick={() => { setDeleteMode(false); setSelected([]); }}>
                Cancel
              </Button>
            )}
            <Button
              variant={deleteMode ? "destructive" : "outline"}
              onClick={() => deleteMode ? deleteSelected() : setDeleteMode(true)}
              disabled={deleteMode && !selected.length}
            >
              <Trash2 className="mr-2 size-4" />
              {deleteMode ? `Delete (${selected.length})` : "Delete"}
            </Button>
            <Button
              onClick={() => {
                setEditingId(null);
                setDraft({ ...emptyProduct, sort_order: products.length });
                setDrawerOpen(true);
              }}
            >
              <Plus className="mr-2 size-4" />
              Add product
            </Button>
          </div>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                {deleteMode && (
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) =>
                        setSelected(e.target.checked ? products.map((p) => p.id!) : [])
                      }
                      aria-label="Select all products"
                    />
                  </th>
                )}
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-muted/30">
                  {deleteMode && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(product.id!)}
                        onChange={(e) =>
                          setSelected((prev) =>
                            e.target.checked
                              ? [...prev, product.id!]
                              : prev.filter((id) => id !== product.id)
                          )
                        }
                        aria-label={`Select ${product.name}`}
                      />
                    </td>
                  )}
                  <td
                    className="cursor-pointer px-4 py-3 font-medium"
                    onClick={() => {
                      setEditingId(product.id!);
                      setDraft({ ...product });
                      setDrawerOpen(true);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {product.cover_image && (
                        <img
                          src={product.cover_image}
                          alt={product.name}
                          className="h-8 w-8 rounded object-cover"
                        />
                      )}
                      {product.name || "Unnamed product"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    R {Number.parseFloat(product.price || "0").toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {product.sku || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                      value={toTag(product.is_active)}
                      onChange={(e) => updateTag(product.id!, e.target.value as Tag)}
                    >
                      <option value="in stock">In stock</option>
                      <option value="out of stock">Out of stock</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!filteredProducts.length && (
            <p className="p-10 text-center text-sm text-muted-foreground">
              {products.length === 0
                ? "No products yet. Add your first product to get started."
                : "No products match your search."}
            </p>
          )}
        </div>
      </section>

      {/* DRAWER BACKDROP */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* PRODUCT DRAWER */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-xl transition-transform ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="text-lg font-semibold">
              {editingId ? "Edit product" : "Add product"}
            </h2>
            <p className="text-sm text-muted-foreground">Product details</p>
          </div>
          <Button size="icon" variant="ghost" onClick={() => setDrawerOpen(false)} aria-label="Close">
            <X />
          </Button>
        </div>

        <div className="editor-scrollbar flex-1 space-y-5 overflow-y-auto p-5">

          {/* IMAGES */}
          <div className="grid grid-cols-2 gap-3">
            {(["cover_image", "secondary_image"] as const).map((key) => (
              <div key={key} className="space-y-2">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  {key === "cover_image" ? "Cover" : "Secondary"}
                </p>
                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-muted/30">
                  {draft[key] ? (
                    <img
                      src={draft[key]}
                      alt={`${key} preview`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImagePlus className="size-7 text-muted-foreground" />
                  )}
                </div>
                <UploadFile
                  accept="image/*"
                  label={`Upload ${key === "cover_image" ? "cover" : "secondary"}`}
                  description="PNG, JPG, WEBP"
                  onFileSelect={(file) => { if (file) void uploadImage(file, key); }}
                />
              </div>
            ))}
          </div>

          {/* NAME + PRICE */}
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-2 text-sm font-medium">
              Name
              <Input
                value={draft.name}
                onChange={(e) => updateDraft("name", e.target.value)}
              />
            </label>
            <label className="space-y-2 text-sm font-medium">
              Price
              <div className="flex items-center rounded-md border border-input px-3">
                <span className="text-muted-foreground">R</span>
                <Input
                  className="border-0 pl-2 focus-visible:ring-0"
                  inputMode="decimal"
                  value={draft.price}
                  onChange={(e) => updateDraft("price", e.target.value.replace(/[^0-9.]/g, ""))}
                  onBlur={() =>
                    updateDraft(
                      "price",
                      Number.parseFloat(draft.price || "0").toFixed(2)
                    )
                  }
                />
              </div>
            </label>
          </div>

          {/* SKU */}
          <label className="block space-y-2 text-sm font-medium">
            SKU
            <Input
              value={draft.sku}
              onChange={(e) => updateDraft("sku", e.target.value)}
            />
          </label>

          {/* DESCRIPTION */}
          <label className="block space-y-2 text-sm font-medium">
            Description
            <textarea
              className="min-h-28 w-full rounded-md border border-input bg-background p-2 text-sm"
              value={draft.description}
              onChange={(e) => updateDraft("description", e.target.value)}
            />
          </label>

          {/* STATUS */}
          <label className="block space-y-2 text-sm font-medium">
            Status
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={toTag(draft.is_active)}
              onChange={(e) => updateDraft("is_active", fromTag(e.target.value as Tag))}
            >
              <option value="in stock">In stock</option>
              <option value="out of stock">Out of stock</option>
            </select>
          </label>

          {/* SORT ORDER */}
          <label className="block space-y-2 text-sm font-medium">
            Sort order
            <Input
              type="number"
              value={draft.sort_order}
              onChange={(e) => updateDraft("sort_order", Number(e.target.value))}
            />
          </label>

        </div>

        <div className="flex justify-end gap-2 border-t border-border p-5">
          <Button variant="outline" onClick={() => setDrawerOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => void saveProduct()} disabled={saving}>
            <Check className="mr-2 size-4" />
            {saving ? "Saving..." : "Save product"}
          </Button>
        </div>
      </aside>

    </div>
  );
}