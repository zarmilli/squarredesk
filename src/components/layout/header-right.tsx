import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { BadgeWithFlag, BadgeWithDot } from "@/components/base/badges/badges";
import { BadgeGroup } from "@/components/base/badges/badge-groups";
import type { Color } from "@/components/base/badges/badge-groups";

type Profile = {
  first_name: string;
  last_name: string;
  membership_tier: string;
};

export default function HeaderRight() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("first_name, last_name, membership_tier")
      .eq("user_id", session.user.id)
      .single();

    if (!error && data) {
      setProfile(data);
    }
  }

  if (!profile) return null;

  const initials = `${profile.first_name?.[0] ?? ""}${profile.last_name?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="flex items-center gap-3">
      {/* Membership tier */}
      <BadgeWithDot type="pill-color" color="success" size="md">
        {profile.membership_tier}
      </BadgeWithDot>

      {/* Country + name */}
      <BadgeWithFlag flag="ZA" type="pill-color" color="gray" size="md">
        {profile.first_name}
      </BadgeWithFlag>

      {/* Upgrade badge group */}
      <div
        onClick={() => navigate("/settings")}
        className="cursor-pointer hover:opacity-90 transition"
      >
        <BadgeGroup
          addonText={initials}
          color={"success" as Color}
          theme="light"
          align="leading"
          size="md"
        >
          Upgrade membership
        </BadgeGroup>
        </div>
    </div>
  );
}
