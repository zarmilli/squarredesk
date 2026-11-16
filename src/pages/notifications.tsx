
import { useState } from "react";
import {
  Bell,
  CheckCircle,
  ClipboardList,
  FolderKanban,
  Info,
  ShoppingBag,
  UserPlus,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppData } from "@/context/AppDataContext";
import { useNotifications } from "@/hooks/useNotifications";
import { useToast } from "@/hooks/use-toast";
import type { NotificationRecord } from "@/hooks/useNotifications";

const notificationIcons: Record<
  string,
  { icon: LucideIcon; className: string }
> = {
  tasks: {
    icon: ClipboardList,
    className: "bg-blue-100 text-blue-600",
  },
  task: {
    icon: ClipboardList,
    className: "bg-blue-100 text-blue-600",
  },
  orders: {
    icon: ShoppingBag,
    className: "bg-green-100 text-green-600",
  },
  order: {
    icon: ShoppingBag,
    className: "bg-green-100 text-green-600",
  },
  requests: {
    icon: UserPlus,
    className: "bg-amber-100 text-amber-600",
  },
  request: {
    icon: UserPlus,
    className: "bg-amber-100 text-amber-600",
  },
  projects: {
    icon: FolderKanban,
    className: "bg-purple-100 text-purple-600",
  },
  project: {
    icon: FolderKanban,
    className: "bg-purple-100 text-purple-600",
  },
  account: {
    icon: Info,
    className: "bg-stone-100 text-stone-600",
  },
};

const defaultIcon = {
  icon: Bell,
  className: "bg-stone-100 text-stone-600",
};

function formatNotificationDate(date: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Johannesburg",
  }).format(new Date(date));
}

export default function Notifications() {
  const { toast } = useToast();
  const {
    user,
    profile,
    isLoading: appDataLoading,
    error: appDataError,
    refreshAppData,
  } = useAppData();

  const {
    notifications,
    unreadCount,
    isLoading: notificationsLoading,
    error: notificationsError,
    markAsRead,
    markAllAsRead,
    isMarkingAllAsRead,
    refreshNotifications,
  } = useNotifications();

  const [selectedNotification, setSelectedNotification] =
    useState<NotificationRecord | null>(null);

  async function handleOpenNotification(
    notification: NotificationRecord
  ) {
    setSelectedNotification(notification);

    if (notification.read_at) return;

    try {
      await markAsRead(notification.id);
    } catch (reason) {
      toast({
        title: "Unable to update notification",
        description:
          reason instanceof Error ? reason.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllAsRead();

      toast({
        title: "Notifications updated",
        description: "All notifications have been marked as read.",
      });
    } catch (reason) {
      toast({
        title: "Unable to update notifications",
        description:
          reason instanceof Error ? reason.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  async function retryLoading() {
    try {
      if (appDataError) {
        await refreshAppData();
      } else {
        await refreshNotifications();
      }
    } catch (reason) {
      toast({
        title: "Unable to reload notifications",
        description:
          reason instanceof Error ? reason.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  if (appDataLoading || notificationsLoading) {
    return (
      <div
        role="status"
        aria-label="Loading notifications"
        className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground"
      >
        Loading notifications...
      </div>
    );
  }

  if (appDataError || notificationsError) {
    const currentError = appDataError ?? notificationsError;

    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-base font-medium">
          Unable to load your notifications.
        </p>
        <p className="text-sm text-muted-foreground">
          {currentError instanceof Error
            ? currentError.message
            : "An unexpected error occurred."}
        </p>
        <Button
          onClick={() => void retryLoading()}
          variant="outline"
          size="sm"
        >
          Try again
        </Button>
      </div>
    );
  }

  if (!user || !profile) return null;

  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar">
      <div className="mx-auto max-w-4xl">
        <Card className="border-stone-200">
          <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-stone-200">
            <div>
              <CardTitle className="text-lg font-semibold text-stone-900">
                Recent Notifications
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                  : "You're all caught up."}
              </p>
            </div>

            {unreadCount > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isMarkingAllAsRead}
                onClick={() => void handleMarkAllAsRead()}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {isMarkingAllAsRead ? "Updating..." : "Mark all as read"}
              </Button>
            )}
          </CardHeader>

          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
                  <Bell className="h-5 w-5 text-stone-500" />
                </div>
                <p className="font-medium text-stone-900">
                  No notifications yet
                </p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Updates about tasks, orders and requests will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-stone-200">
                {notifications.map((notification) => {
                  const categoryStyle =
                    notificationIcons[notification.category.toLowerCase()] ??
                    defaultIcon;

                  const Icon = categoryStyle.icon;
                  const isRead = !!notification.read_at;

                  return (
                    <Button
                      key={notification.id}
                      type="button"
                      variant="ghost"
                      onClick={() => void handleOpenNotification(notification)}
                      className="h-auto w-full justify-start rounded-none p-6 text-left hover:bg-stone-50"
                      aria-label={`Open notification: ${notification.event_name}${isRead ? "" : ", unread"}`}
                    >
                      <span
                        className={`mr-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${categoryStyle.className}`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-xs font-medium text-stone-500">
                            {notification.category}
                          </span>

                          {!isRead && (
                            <Badge className="h-5 bg-green-100 px-2 text-[10px] text-green-700 hover:bg-green-100">
                              New
                            </Badge>
                          )}
                        </span>

                        <span className="mt-1 block truncate text-sm font-medium text-stone-900">
                          {notification.event_name}
                        </span>

                        <span className="mt-1 block text-xs text-muted-foreground">
                          {formatNotificationDate(notification.created_at)}
                        </span>
                      </span>

                      {!isRead && (
                        <span className="ml-3 mt-2 h-2 w-2 shrink-0 rounded-full bg-green-500" />
                      )}
                    </Button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedNotification && (
        <Alert className="fixed right-6 top-6 z-50 w-[calc(100%-3rem)] max-w-sm border-blue-200 bg-blue-50 text-blue-950 shadow-lg">
          <Info className="h-4 w-4" />

          <div className="pr-6">
            <div className="mb-2 flex items-center justify-between gap-2">
              <Badge variant="secondary">
                {selectedNotification.category}
              </Badge>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close notification alert"
                onClick={() => setSelectedNotification(null)}
                className="absolute right-2 top-2 h-7 w-7 text-blue-900 hover:bg-blue-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <AlertTitle>{selectedNotification.event_name}</AlertTitle>

            <AlertDescription className="mt-2 text-blue-800">
              {selectedNotification.description}
            </AlertDescription>

            <p className="mt-3 text-xs text-blue-700">
              {formatNotificationDate(selectedNotification.created_at)}
            </p>
          </div>
        </Alert>
      )}
    </div>
  );
}
