
import { useCallback, useEffect, useMemo } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useAppData } from "@/context/AppDataContext";
import { supabase } from "@/lib/supabase";

export interface NotificationRecord {
  id: string;
  business_id: string;
  recipient_user_id: string;
  actor_user_id: string | null;
  category: string;
  event_name: string;
  description: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export function useNotifications() {
  const queryClient = useQueryClient();

  const {
    user,
    membership,
    organisation,
  } = useAppData();

  const businessId = organisation?.id ?? membership?.business_id ?? null;

  const queryKey = useMemo(
    () => ["notifications", user?.id, businessId] as const,
    [user?.id, businessId]
  );

  // Fetch the current user's notifications.
  const {
    data: notifications = [],
    isPending,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey,
    enabled: !!user?.id && !!businessId,
    queryFn: async (): Promise<NotificationRecord[]> => {
      if (!user?.id || !businessId) return [];

      const { data, error } = await supabase
        .from("notifications")
        .select(`
          id,
          business_id,
          recipient_user_id,
          actor_user_id,
          category,
          event_name,
          description,
          entity_type,
          entity_id,
          metadata,
          read_at,
          created_at
        `)
        .eq("business_id", businessId)
        .eq("recipient_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      return (data ?? []) as NotificationRecord[];
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Keep the notification cache synchronised with database changes.
  useEffect(() => {
    if (!user?.id || !businessId) return;

    const channel = supabase
      .channel(`notifications-${user.id}-${businessId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_user_id=eq.${user.id}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, businessId, queryClient, queryKey]);

  // Mark one notification as read.
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user?.id || !businessId) {
        throw new Error("No active organisation found.");
      }

      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", notificationId)
        .eq("business_id", businessId)
        .eq("recipient_user_id", user.id)
        .is("read_at", null);

      if (error) throw error;
    },
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey });

      const previousNotifications =
        queryClient.getQueryData<NotificationRecord[]>(queryKey);

      queryClient.setQueryData<NotificationRecord[]>(
        queryKey,
        (current = []) =>
          current.map((notification) =>
            notification.id === notificationId
              ? {
                  ...notification,
                  read_at: new Date().toISOString(),
                }
              : notification
          )
      );

      return { previousNotifications };
    },
    onError: (_error, _notificationId, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          queryKey,
          context.previousNotifications
        );
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  // Mark all current user's unread notifications as read.
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !businessId) {
        throw new Error("No active organisation found.");
      }

      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("business_id", businessId)
        .eq("recipient_user_id", user.id)
        .is("read_at", null);

      if (error) throw error;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });

      const previousNotifications =
        queryClient.getQueryData<NotificationRecord[]>(queryKey);

      const readAt = new Date().toISOString();

      queryClient.setQueryData<NotificationRecord[]>(
        queryKey,
        (current = []) =>
          current.map((notification) => ({
            ...notification,
            read_at: notification.read_at ?? readAt,
          }))
      );

      return { previousNotifications };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          queryKey,
          context.previousNotifications
        );
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read_at).length,
    [notifications]
  );

  const markAsRead = useCallback(
    async (notificationId: string) => {
      await markAsReadMutation.mutateAsync(notificationId);
    },
    [markAsReadMutation.mutateAsync]
  );

  const markAllAsRead = useCallback(async () => {
    await markAllAsReadMutation.mutateAsync();
  }, [markAllAsReadMutation.mutateAsync]);

  return {
    notifications,
    unreadCount,
    isLoading: isPending,
    isFetching,
    error,
    markAsRead,
    markAllAsRead,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    refreshNotifications: refetch,
  };
}
