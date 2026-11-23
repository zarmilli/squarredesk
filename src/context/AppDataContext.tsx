
import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export interface Profile {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  account_type: string;
  membership_tier: string;
  avatar_url: string | null;
  role: string | null;
  personal_bio: string | null;
  company_name: string | null;
  company_size: string | null;
  business_field: string | null;
  business_location: string | null;
  company_bio: string | null;
  services_offered: string[] | null;
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

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

async function fetchAppData(user: User): Promise<AppData> {
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
      role,
      personal_bio,
      company_name,
      company_size,
      business_field,
      business_location,
      company_bio,
      services_offered,
      onboarding_complete
    `)
    .eq("user_id", user.id)
    .single();

  if (profileError) throw profileError;

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
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (membershipError) throw membershipError;

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
  const { session, user, loading: authLoading } = useAuth();

  const queryKey = ["app-data", user?.id];

  const {
    data: appData,
    isPending,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchAppData(user!),
    enabled: !!user && !authLoading,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      queryClient.removeQueries({
        queryKey: ["app-data"],
      });
    }
  }, [authLoading, user, queryClient]);

  const refreshAppData = useCallback(async () => {
    if (!user) return;

    await refetch({ throwOnError: true });
  }, [user, refetch]);

  const value = useMemo<AppDataContextType>(
    () => ({
      session,
      appData,
      user,
      profile: appData?.profile,
      membership: appData?.membership ?? null,
      organisation: appData?.organisation ?? null,
      isLoading: authLoading || (!!user && isPending),
      isAuthenticated: !!user,
      error: error as Error | null,
      refreshAppData,
    }),
    [
      session,
      appData,
      user,
      authLoading,
      isPending,
      error,
      refreshAppData,
    ]
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
