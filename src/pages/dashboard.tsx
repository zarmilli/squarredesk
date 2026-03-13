import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/base/badges/badges";
import { BadgeWithDot } from "@/components/base/badges/badges";

import peopleBackground from "/images/header.png";
import squeakImage from "/images/squeakImage.png";

type Site = {
  id: string;
  site_name: string;
  updated_at: string;
  is_published: boolean;
};

export default function Dashboard() {
  const [sites, setSites] = useState<Site[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/#/auth/sign-in");
      return;
    }

    // ✅ ONBOARDING CHECK (FIXED)
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (error) {
      console.error(error);
    }

    // Not onboarded → onboarding page
    if (!profile || profile.onboarding_complete !== true) {
      navigate("/onboarding");
      return;
    }
    // ✅ END ONBOARDING CHECK

    const { data } = await supabase
      .from("user_sites")
      .select("id, site_name, updated_at, is_published")
      .eq("user_id", session.user.id)
      .order("updated_at", { ascending: false });

    if (data) setSites(data);
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 custom-scrollbar">
      {/* HERO */}
      <Card className="relative border border-stone-200 bg-white overflow-hidden">
        <div
          className="relative h-64 bg-cover bg-top bg-no-repeat"
          style={{ backgroundImage: `url(${peopleBackground})` }}
        >
          <div className="absolute inset-0 bg-black/40" />

          <div className="relative z-10 p-8 flex items-center h-full">
            <div className="max-w-lg">
              <h2 className="text-3xl font-bold text-white mb-4">
                Create & Deploy A New Site
              </h2>

              <p className="text-stone-200 text-lg mb-6 leading-relaxed">
                Browse from our range of stunning templates and launch your next
                website in minutes.
              </p>

              <Button size="lg" onClick={() => navigate("/create-site")}>
                Create Site
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* SECTION TITLE */}
      <h2 className="mt-8 mb-4 text-xl font-semibold tracking-tight">
        My websites
      </h2>

      {/* SITES GRID */}
      {sites.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <img src={squeakImage} className="w-32" alt="Squeak the parrot" />
          <p className="text-lg font-medium">Squeak sees no websites yet</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {sites.map((site) => {
            const date = site.updated_at
              ? new Date(site.updated_at).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—";

            return (
              <Card
                key={site.id}
                className="flex h-44 flex-col justify-between p-4 transition-shadow hover:shadow-md"
              >
                {/* Top */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold">{site.site_name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Last edited {date}
                    </div>
                  </div>

                  <BadgeWithDot
                    type="pill-color"
                    color={site.is_published ? "success" : "warning"}
                    size="md"
                  >
                    {site.is_published ? "Published" : "Draft"}
                  </BadgeWithDot>
                </div>

                {/* Bottom */}
                <Button
                  size="sm"
                  variant="outline"
                  className="self-start"
                  onClick={() => navigate(`/editor?site=${site.id}`)}
                >
                  Edit
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}