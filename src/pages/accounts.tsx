import UserSettings from "@/components/user-settings";
import { useAppData } from "@/context/AppDataContext";

export default function Accounts() {
  const { user, profile, membership, isLoading, refreshAppData } = useAppData();

  const profileRole = profile?.role?.toLowerCase();
  const membershipRole = membership?.role?.toLowerCase();
  const canManageWorkspace =
    profileRole === "owner" ||
    profileRole === "hr" ||
    membershipRole === "owner" ||
    membershipRole === "hr";

  return (
    <div className="h-0 min-h-0 flex-1 overflow-y-auto p-6">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading account...</p>
      ) : !user || !profile ? (
        <p className="text-sm text-muted-foreground">Profile not found.</p>
      ) : (
        <UserSettings
          profile={profile}
          user={user}
          canManageWorkspace={canManageWorkspace}
          refreshAppData={refreshAppData}
        />
      )}
    </div>
  );
}
