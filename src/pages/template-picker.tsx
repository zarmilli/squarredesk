import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  BriefcaseBusiness,
  LayoutGrid,
  Palette,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { cx } from "@/lib/utils/cx";

type Plan = "free" | "basic" | "pro";
type Category = "personal" | "portfolio" | "ecommerce" | "business";

const planRank: Record<Plan, number> = {
  free: 1,
  basic: 2,
  pro: 3,
};

const siteLimits: Record<Plan, number> = {
  free: 1,
  basic: 3,
  pro: Infinity,
};

const categories = [
  { value: "all", label: "All", icon: LayoutGrid },
  { value: "personal", label: "Personal", icon: UserRound },
  { value: "portfolio", label: "Portfolio", icon: Palette },
  { value: "ecommerce", label: "Ecommerce", icon: ShoppingBag },
  { value: "business", label: "Business", icon: BriefcaseBusiness },
] as const;

export default function TemplatePicker() {
  const navigate = useNavigate();

  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<"all" | Category>("all");
  const [userPlan, setUserPlan] = useState<Plan>("free");
  const [userId, setUserId] = useState("");
  const [siteCount, setSiteCount] = useState(0);
  const [progress, setProgress] = useState(50);
  const progressTarget = 100;
  const progressAnimMs = 500;

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => setProgress(progressTarget));
    return () => cancelAnimationFrame(id);
  }, []);

  async function init() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return navigate("/auth/sign-in");

    setUserId(data.session.user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("membership_tier")
      .eq("user_id", data.session.user.id)
      .single();

    const tier = (profile?.membership_tier ?? "free") as Plan;
    setUserPlan(tier);

    const { count } = await supabase
      .from("user_sites")
      .select("*", { count: "exact", head: true })
      .eq("user_id", data.session.user.id);

    setSiteCount(count ?? 0);

    const { data: t } = await supabase.from("templates").select("*");
    setTemplates(t || []);
    setLoading(false);
  }

  async function chooseTemplate(t: any) {
    if (siteCount >= siteLimits[userPlan]) {
      return navigate("/subscriptions");
    }

    if (planRank[t.availability as Plan] > planRank[userPlan]) {
      return navigate("/subscriptions");
    }

    const siteName = localStorage.getItem("site_name_draft");
    if (!siteName) return navigate("/create-site");

    const { data: created } = await supabase
      .from("user_sites")
      .insert({
        user_id: userId,
        template_id: t.id,
        site_name: siteName,
        is_published: false,
      })
      .select()
      .single();

    localStorage.removeItem("site_name_draft");

    navigate(`/editor?site=${created.id}&template=${t.template_slug}`);
  }

  function handleBack() {
    setProgress(50);
    setTimeout(() => navigate(-1), progressAnimMs);
  }

  const filtered =
    activeCategory === "all"
      ? templates
      : templates.filter(t => t.category === activeCategory);

  return (
    <div className="min-h-screen bg-[--background] p-6">

      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1">
          <Progress value={progress} />
          <div className="text-xs text-stone-500 mt-1">Step 2 / 2</div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant="ghost"
              aria-pressed={activeCategory === value}
              className={cx(
                "gap-2 rounded-none text-muted-foreground hover:text-foreground",
                activeCategory === value && "font-semibold text-foreground"
              )}
              onClick={() => setActiveCategory(value)}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </Button>
          ))}
        </div>
        <Separator className="mt-2" />
      </div>

      {loading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="w-full animate-pulse overflow-hidden p-0">
              <div className="aspect-video bg-stone-200" />
              <div className="flex items-center justify-between gap-3 p-3">
                <div className="h-4 w-2/3 rounded bg-stone-200" />
                <div className="h-5 w-14 rounded-sm bg-stone-200" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(t => (
            <Card
              key={t.id}
              className="group w-full overflow-hidden border-border p-0"
            >
              <div className="relative aspect-video overflow-hidden bg-muted">
                <img
                  src={t.thumbnail_url}
                  alt={`${t.name} template preview`}
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-black/45 p-4 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100">
                  <div className="flex w-full max-w-sm gap-2">
                    <Button
                      className="min-w-0 flex-1"
                      onClick={() => chooseTemplate(t)}
                    >
                      Choose
                    </Button>
                    <Button
                      variant="outline"
                      className="min-w-0 flex-1"
                      onClick={() => window.open(t.preview_url)}
                    >
                      Demo
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex min-w-0 items-center justify-between gap-3 p-3">
                <h3 className="min-w-0 truncate font-medium">{t.name}</h3>
                <Badge
                  variant="secondary"
                  className={cx(
                    "shrink-0 rounded-sm px-2 py-0.5 capitalize",
                    t.availability === "basic" &&
                      "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-950",
                    t.availability === "pro" &&
                      "bg-violet-100 text-violet-800 hover:bg-violet-100 dark:bg-violet-950 dark:text-violet-300 dark:hover:bg-violet-950"
                  )}
                >
                  {t.availability ?? "free"}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
