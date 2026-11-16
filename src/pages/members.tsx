
import { useMemo, useState } from "react";
import { MoreHorizontal, Users } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAppData } from "@/context/AppDataContext";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MemberStatus = "active" | "pending" | "declined" | "revoked";

type Member = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string;
  status: MemberStatus;
  department: string | null;
  job_title: string | null;
  approved_at: string | null;
};

const memberStatuses: { value: Exclude<MemberStatus, "pending">; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "declined", label: "Declined" },
  { value: "revoked", label: "Revoked" },
];

const statusClassNames: Record<MemberStatus, string> = {
  active: "bg-green-100 text-green-700 hover:bg-green-100",
  pending: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  declined: "bg-red-100 text-red-700 hover:bg-red-100",
  revoked: "bg-stone-100 text-stone-600 hover:bg-stone-100",
};

const statusLabels: Record<MemberStatus, string> = {
  active: "Active",
  pending: "Pending",
  declined: "Declined",
  revoked: "Revoked",
};

const statusOrder: Record<MemberStatus, number> = {
  pending: 0,
  active: 1,
  declined: 2,
  revoked: 3,
};

function getFullName(member: Member) {
  return [member.first_name, member.last_name]
    .filter(Boolean)
    .join(" ")
    .trim() || "Unnamed member";
}

function getInitials(member: Member) {
  const name = getFullName(member);
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Members() {
  const queryClient = useQueryClient();
  const { user, membership, organisation, isLoading: appDataLoading, isAuthenticated } = useAppData();

  const businessId = organisation?.id ?? membership?.business_id ?? null;

  const canManageMembers =
    membership?.status === "active" &&
    (membership.role === "owner" || membership.role === "hr");

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedStatus, setSelectedStatus] =
    useState<Exclude<MemberStatus, "pending">>("active");
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  const membersQuery = useQuery({
    queryKey: ["business-members", businessId],
    enabled: Boolean(isAuthenticated && businessId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_business_members", {
        p_business_id: businessId!,
      });

      if (error) throw error;

      return (data ?? []) as Member[];
    },
    staleTime: 30_000,
  });

  const members = useMemo(() => {
    return [...(membersQuery.data ?? [])].sort((a, b) => {
      const statusDifference = statusOrder[a.status] - statusOrder[b.status];

      if (statusDifference !== 0) return statusDifference;

      return getFullName(a).localeCompare(getFullName(b));
    });
  }, [membersQuery.data]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      membershipId,
      status,
    }: {
      membershipId: string;
      status: Exclude<MemberStatus, "pending">;
    }) => {
      const { error } = await supabase.rpc("update_business_member_status", {
        p_membership_id: membershipId,
        p_status: status,
      });

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["business-members", businessId],
      });

      setSelectedMember(null);
    },
  });

  function openStatusDialog(member: Member) {
    setSelectedMember(member);
    setSelectedStatus(
      member.status === "pending" ? "active" : member.status
    );
    setOpenPopoverId(null);
  }

  function confirmStatusChange() {
    if (!selectedMember || !canManageMembers) return;

    updateStatusMutation.mutate({
      membershipId: selectedMember.id,
      status: selectedStatus,
    });
  }

  const isLoading = appDataLoading || membersQuery.isLoading;
  const error = membersQuery.error || updateStatusMutation.error;

  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar">
      <div className="mx-auto max-w-4xl">
        <Card className="border-stone-200">
          <CardHeader className="border-b border-stone-200">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-semibold text-stone-900">
                  Members
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {members.length} {members.length === 1 ? "person" : "people"} in your business workspace
                </p>
              </div>

              <Users className="h-5 w-5 text-stone-400" />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Loading members...
              </div>
            ) : !businessId ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No organisation is currently associated with your account.
              </div>
            ) : membersQuery.isError ? (
              <div className="space-y-3 p-8 text-center">
                <p className="text-sm text-red-600">
                  Unable to load organisation members.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => membersQuery.refetch()}
                >
                  Try again
                </Button>
              </div>
            ) : members.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No members have been found in this organisation.
              </div>
            ) : (
              <div className="divide-y divide-stone-200">
                {members.map((member) => {
                  const fullName = getFullName(member);
                  const canChangeMemberStatus =
                    canManageMembers && member.role === "staff";

                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-4 sm:gap-4 sm:p-6"
                    >
                      <Avatar className="h-11 w-11 shrink-0">
                        <AvatarImage
                          src={member.avatar_url ?? undefined}
                          alt={fullName}
                        />
                        <AvatarFallback className="bg-stone-900 text-xs font-medium text-white">
                          {getInitials(member)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-stone-900">
                          {fullName}
                        </p>

                        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span className="capitalize">{member.role}</span>
                          {member.email && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="truncate">{member.email}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Badge className={statusClassNames[member.status]}>
                          {statusLabels[member.status]}
                        </Badge>

                        {member.job_title && (
                          <span className="max-w-24 truncate text-xs text-muted-foreground sm:max-w-32">
                            {member.job_title}
                          </span>
                        )}

                        {canChangeMemberStatus && (
                          <Popover
                            open={openPopoverId === member.id}
                            onOpenChange={(open) =>
                              setOpenPopoverId(open ? member.id : null)
                            }
                          >
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label={`Actions for ${fullName}`}
                                className="h-9 w-9 shrink-0"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>

                            <PopoverContent align="end" className="w-40 p-1">
                              <Button
                                type="button"
                                variant="ghost"
                                className="w-full justify-start"
                                onClick={() => openStatusDialog(member)}
                              >
                                Change status
                              </Button>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {error && !membersQuery.isError && (
          <p className="mt-3 text-sm text-red-600">
            {error instanceof Error ? error.message : "Unable to update member status."}
          </p>
        )}
      </div>

      <AlertDialog
        open={selectedMember !== null}
        onOpenChange={(open) => {
          if (!open && !updateStatusMutation.isPending) {
            setSelectedMember(null);
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Change member status</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedMember
                ? `Update the status for ${getFullName(selectedMember)}.`
                : "Choose the member's new status."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <label htmlFor="member-status" className="text-sm font-medium">
              Status
            </label>

            <Select
              value={selectedStatus}
              onValueChange={(value) => {
                if (
                  value === "active" ||
                  value === "declined" ||
                  value === "revoked"
                ) {
                  setSelectedStatus(value);
                }
              }}
              disabled={updateStatusMutation.isPending}
            >
              <SelectTrigger id="member-status">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {memberStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {updateStatusMutation.isError && (
            <p className="text-sm text-red-600">
              {updateStatusMutation.error instanceof Error
                ? updateStatusMutation.error.message
                : "Unable to update member status."}
            </p>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateStatusMutation.isPending}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                confirmStatusChange();
              }}
              disabled={
                !selectedMember ||
                selectedStatus === selectedMember.status ||
                updateStatusMutation.isPending
              }
            >
              {updateStatusMutation.isPending
                ? "Updating..."
                : "Confirm status change"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
