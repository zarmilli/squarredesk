import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import GenerateButton from "@/components/ui/generateButton";
import { Badge } from "@/components/base/badges/badges";
import { BadgeWithDot } from "@/components/base/badges/badges";

import peopleBackground from "/images/header.png";
import squeakImage from "/images/squeakImage.png";
import showcase from "/images/showcase.gif";
import EditButton from "@/components/ui/EditButton";

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
      <Card className="relative overflow-hidden rounded-md border border-white/10 bg-zinc-950">
        <div className="relative h-72 overflow-hidden">
          <div
            className="absolute inset-0 scale-105 bg-cover bg-center blur-[0px]"
            style={{ backgroundImage: `url(${peopleBackground})` }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.86)_0%,rgba(0,0,0,0.5)_48%,rgba(0,0,0,0.22)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_58%)]" />

          <div className="absolute top-1/2 right-6 h-[78%] w-[34%] max-w-[320px] -translate-y-1/2 overflow-hidden rounded-[0.5rem] border border-white/15 shadow-2xl">
            <img
              src={showcase}
              alt="Featured preview"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="relative z-10 flex h-full items-center p-8">
            <div className="max-w-lg">
              <h2 className="mb-4 text-3xl font-bold text-white">
                Create & Deploy A New Site
              </h2>

              <p className="mb-6 text-lg leading-relaxed text-stone-200">
                Browse from our range of stunning templates and launch your next
                website in minutes.
              </p>

              <GenerateButton onClick={() => navigate("/create-site")}>
                Generate New Site
              </GenerateButton>
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
                className="flex h-44 flex-col justify-between p-4 border border-white/10 transition-shadow hover:shadow-md"
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
                <EditButton onClick={() => navigate(`/editor?site=${site.id}`)} />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}