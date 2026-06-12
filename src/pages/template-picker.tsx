import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { Badge } from "@/components/base/badges/badges";
import { ArrowLeft } from "lucide-react";
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

const categoryColors: Record<Category, any> = {
  personal: "blue",
  portfolio: "purple",
  ecommerce: "orange",
  business: "brand",
};

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
    <div className="min-h-screen bg-stone-50 p-6">

      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1">
          <Progress value={progress} />
          <div className="text-xs text-stone-500 mt-1">Step 2 / 2</div>
        </div>
      </div>

      <div className="flex justify-center gap-2 mb-6 flex-wrap">
        {(["all","personal","portfolio","ecommerce","business"] as const).map(cat => (
          <Button
            key={cat}
            size="sm"
            variant="ghost"
            className={cx("capitalize", activeCategory === cat && "ring-2")}
            onClick={() => setActiveCategory(cat)}
          >
            {cat === "all" ? (
              <Badge type="pill-color" color="gray">all</Badge>
            ) : (
              <Badge type="pill-color" color={categoryColors[cat]}>
                {cat}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4 animate-pulse space-y-3">
              <div className="h-40 bg-stone-200 rounded" />
              <div className="h-4 bg-stone-200 rounded w-2/3" />
            </Card>
          ))}
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map(t => (
            <Card key={t.id} className="p-4 space-y-3">

              <div className="relative">
                <img src={t.thumbnail_url} className="rounded" />

                {t.availability !== "free" && (
                  <div className="absolute top-2 right-2">
                    <BadgeWithDot type="pill-color" color="success">
                      {t.availability}
                    </BadgeWithDot>
                  </div>
                )}
              </div>

              <h3 className="font-medium">{t.name}</h3>

              <div className="flex gap-2">
                <Button className="w-full" onClick={() => chooseTemplate(t)}>
                  Choose
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(t.preview_url)}
                >
                  Demo
                </Button>
              </div>

            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
