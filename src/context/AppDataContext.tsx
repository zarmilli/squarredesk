
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

export interface Profile {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  account_type: string;
  membership_tier: string;
  avatar_url: string | null;
  personal_bio: string | null;
  company_name: string | null;
  company_size: string | null;
  business_field: string | null;
  business_location: string | null;
  company_bio: string | null;
  onboarding_complete: boolean;
}

export interface Membership {
  id: string;
  business_id: string;
  user_id: string;
  role: "owner" | "hr" | "staff";
  department: string | null;
  job_title: string | null;
  status: "pending" | "active" | "declined" | "revoked";
}

export interface Organisation {
  id: string;
  owner_user_id: string;
  company_name: string;
  company_size: string | null;
  business_field: string | null;
  business_location: string | null;
  company_bio: string | null;
  services_offered: string[] | null;
}

export interface AppData {
  user: User;
  profile: Profile;
  membership: Membership | null;
  organisation: Organisation | null;
}

interface AppDataContextType {
  session: Session | null;
  appData: AppData | undefined;
  user: User | null;
  profile: Profile | undefined;
  membership: Membership | null;
  organisation: Organisation | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  refreshAppData: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(
  undefined
);

async function fetchAppData(user: User): Promise<AppData> {
  // Fetch the user's profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(`
      user_id,
      email,
      first_name,
      last_name,
      account_type,
      membership_tier,
      avatar_url,
      personal_bio,
      company_name,
      company_size,
      business_field,
      business_location,
      company_bio,
      onboarding_complete
    `)
    .eq("user_id", user.id)
    .single();

  if (profileError) throw profileError;

  // Fetch the user's active business membership
  const { data: membership, error: membershipError } = await supabase
    .from("business_members")
    .select(`
      id,
      business_id,
      user_id,
      role,
      department,
      job_title,
      status
    `)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (membershipError) throw membershipError;

  // Fetch organisation details when the user belongs to a business
  let organisation: Organisation | null = null;

  if (membership?.business_id) {
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select(`
        id,
        owner_user_id,
        company_name,
        company_size,
        business_field,
        business_location,
        company_bio,
        services_offered
      `)
      .eq("id", membership.business_id)
      .single();

    if (businessError) throw businessError;

    organisation = business as Organisation;
  }

  return {
    user,
    profile: profile as Profile,
    membership: membership as Membership | null,
    organisation,
  };
}

export function AppDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();

  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  // Initialise session and listen for authentication changes
  useEffect(() => {
    let mounted = true;

    async function initialiseSession() {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Session initialisation error:", error);
      }

      if (mounted) {
        setSession(data.session);
        setSessionLoading(false);
      }
    }

    initialiseSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setSession(newSession);
        setSessionLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const user = session?.user ?? null;

  // Remove account-specific cached data when the user signs out
  useEffect(() => {
    if (!sessionLoading && !user) {
      queryClient.removeQueries({
        queryKey: ["app-data"],
      });
    }
  }, [sessionLoading, user, queryClient]);

  // Load shared application data once per authenticated user
  const {
    data: appData,
    isPending,
    error,
    refetch,
  } = useQuery({
    queryKey: ["app-data", user?.id],
    queryFn: () => fetchAppData(user!),
    enabled: !!user && !sessionLoading,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const refreshAppData = async () => {
    await refetch();
  };

  const value = useMemo<AppDataContextType>(
    () => ({
      session,
      appData,
      user,
      profile: appData?.profile,
      membership: appData?.membership ?? null,
      organisation: appData?.organisation ?? null,
      isLoading: sessionLoading || (!!user && isPending),
      isAuthenticated: !!user,
      error: error as Error | null,
      refreshAppData,
    }),
    [session, appData, user, sessionLoading, isPending, error]
  );

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider");
  }

  return context;
}
