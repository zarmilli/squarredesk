import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Download, Plus } from 'lucide-react'

import { useUserSites } from '@/hooks/useUserSites'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { TasksMutateDrawer } from './components/tasks-mutate-drawer'
import { TasksImportDialog } from './components/tasks-import-dialog'
import { TasksTable } from './components/tasks-table'
import type { Task, TaskValues } from './data/schema'
import { businessTasksQueryKey, fetchBusinessId, fetchBusinessTasks } from './data/queries'

type Assignee = {
  userId: string
  firstName: string | null
  email: string
}

const EMPTY_ASSIGNEES: Assignee[] = []
const EMPTY_TASKS: Task[] = []
const HEADER_SKELETON_WIDTHS = [
  'w-16',
  'w-20',
  'w-32',
  'w-20',
  'w-24',
  'w-16',
  'w-24',
  'w-8',
]
const ROW_SKELETON_WIDTHS = [
  'w-4',
  'w-20',
  'w-32',
  'w-20',
  'w-24',
  'w-16',
  'w-24',
  'w-8',
]

function TasksSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading tasks"
      className="flex flex-1 flex-col gap-5 p-4 sm:gap-6 sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-5 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex gap-3">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="overflow-hidden rounded-md border">
          <div className="flex h-10 items-center gap-5 border-b px-4">
            {HEADER_SKELETON_WIDTHS.map((width, index) => (
              <Skeleton key={index} className={`h-4 ${width}`} />
            ))}
          </div>
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className="flex h-12 items-center gap-5 border-b px-4 last:border-b-0"
            >
              {ROW_SKELETON_WIDTHS.map((width, cellIndex) => (
                <Skeleton
                  key={cellIndex}
                  className={`h-4 ${width}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function Tasks() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const {
    user,
    profile,
    membership,
    organisation,
    isLoading: isAppDataLoading,
    error: appDataError,
    refreshAppData,
    sitesQuery,
  } = useUserSites()
  const [searchParams] = useSearchParams()
  const requestedSiteId = searchParams.get('site')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [currentTask, setCurrentTask] = useState<Task | null>(null)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const [tasksToDelete, setTasksToDelete] = useState<string[] | null>(null)
  const [isImportOpen, setIsImportOpen] = useState(false)

  const businessQuery = useQuery<string | null>({
    queryKey: ['tasks-business', user?.id, membership?.business_id, organisation?.id],
    enabled: !!user?.id && !isAppDataLoading,
    queryFn: async () => {
      if (!user?.id) throw new Error('User session not found.')
      return fetchBusinessId(
        user.id,
        membership?.business_id ?? organisation?.id ?? null
      )
    },
    staleTime: 5 * 60 * 1000,
  })
  const businessId = businessQuery.data ?? null

  const sites = sitesQuery.data ?? []
  const selectedSite = requestedSiteId
    ? sites.find((site) => site.id === requestedSiteId)
    : sites[0]
  const siteId = selectedSite?.id ?? null
  const siteSelectionError =
    sitesQuery.isSuccess && requestedSiteId && !selectedSite
      ? new Error('The selected site could not be found.')
      : null

  const assigneesQuery = useQuery<Assignee[]>({
    queryKey: ['tasks-assignees', businessId],
    enabled: !!businessId && !isAppDataLoading,
    queryFn: async () => {
      if (!businessId) throw new Error('Business not found.')

      const { data: members, error: membersError } = await supabase
        .from('business_members')
        .select('user_id')
        .eq('business_id', businessId)
        .eq('status', 'active')
      if (membersError) throw membersError

      const memberIds = (members ?? []).map((member) => member.user_id)
      if (memberIds.length === 0) return []

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, email')
        .in('user_id', memberIds)
      if (profilesError) throw profilesError

      const profilesById = new Map(
        (profiles ?? []).map((member) => [member.user_id, member])
      )
      return memberIds.flatMap((userId) => {
        const member = profilesById.get(userId)
        return member
          ? [{ userId, firstName: member.first_name, email: member.email }]
          : []
      })
    },
    staleTime: 5 * 60 * 1000,
  })
  const assignees = assigneesQuery.data ?? EMPTY_ASSIGNEES

  const tasksQueryKey = businessTasksQueryKey(user?.id, businessId, siteId)
  const tasksQuery = useQuery<Task[]>({
    queryKey: tasksQueryKey,
    enabled: !!user?.id && !!businessId && !!siteId && !isAppDataLoading,
    queryFn: async () => {
      if (!businessId || !siteId) throw new Error('Business or site not found.')
      return fetchBusinessTasks(businessId, siteId)
    },
  })

  function openCreateDrawer() {
    setCurrentTask(null)
    setIsDrawerOpen(true)
  }

  function openEditDrawer(task: Task) {
    setCurrentTask(task)
    setIsDrawerOpen(true)
  }

  async function saveTask(values: TaskValues) {
    if (!user?.id || !businessId || !siteId) {
      throw new Error('A user, business, and site are required to save tasks.')
    }

    if (!assignees.some((assignee) => assignee.userId === values.assigneeId)) {
      throw new Error('Choose an active member of this business as assignee.')
    }

    if (currentTask) {
      // Existing tasks can currently only have their status updated.
      const { error } = await supabase
        .from('business_tasks')
        .update({ status: values.status })
        .eq('id', currentTask.id)
        .eq('business_id', businessId)
        .eq('site_id', siteId)

      if (error) throw error
    } else {
      // New tasks receive their default status ('todo') from PostgreSQL.
      const { error } = await supabase
        .from('business_tasks')
        .insert({
          title: values.title,
          priority: values.priority,
          assignee_id: values.assigneeId,
          due_date: values.dueDate,
          business_id: businessId,
          site_id: siteId,
        })

      if (error) throw error
    }

    await queryClient.invalidateQueries({ queryKey: tasksQueryKey })
  }

  async function deleteTasks(ids: string[]) {
    if (!businessId || !siteId || ids.length === 0) return false
    const { error } = await supabase
      .from('business_tasks')
      .delete()
      .in('id', ids)
      .eq('business_id', businessId)
      .eq('site_id', siteId)
    if (error) {
      toast({
        title: 'Unable to delete task',
        description: error.message,
        variant: 'destructive',
      })
      return false
    }

    await queryClient.invalidateQueries({ queryKey: tasksQueryKey })
    return true
  }

  async function updateMany(
    ids: string[],
    update: Partial<Task>
  ): Promise<boolean> {
    if (!businessId || !siteId || ids.length === 0 || !update.status) {
      return false
    }
    const { error } = await supabase
      .from('business_tasks')
      .update({ status: update.status })
      .in('id', ids)
      .eq('business_id', businessId)
      .eq('site_id', siteId)
    if (error) {
      toast({
        title: 'Unable to update tasks',
        description: error.message,
        variant: 'destructive',
      })
      return false
    }

    await queryClient.invalidateQueries({ queryKey: tasksQueryKey })
    return true
  }

  async function importTasks(values: TaskValues[]) {
    if (!businessId || !siteId) {
      throw new Error('A business and site are required to import tasks.')
    }
    const memberIds = new Set(assignees.map((assignee) => assignee.userId))
    if (values.some((task) => !memberIds.has(task.assigneeId))) {
      throw new Error('Every assignee_id must belong to an active business member.')
    }

    const { error } = await supabase.from('business_tasks').insert(
      values.map((task) => ({
        title: task.title,
        status: task.status,
        priority: task.priority,
        assignee_id: task.assigneeId,
        due_date: task.dueDate,
        business_id: businessId,
        site_id: siteId,
      }))
    )
    if (error) throw error

    await queryClient.invalidateQueries({ queryKey: tasksQueryKey })
  }

  async function confirmDelete() {
    const ids = taskToDelete
      ? [taskToDelete.id]
      : tasksToDelete ?? []
    if (await deleteTasks(ids)) {
      setTaskToDelete(null)
      setTasksToDelete(null)
    }
  }

  async function retryLoading() {
    try {
      await Promise.all([
        refreshAppData(),
        businessQuery.refetch(),
        sitesQuery.refetch(),
        tasksQuery.refetch(),
      ])
    } catch (error) {
      toast({
        title: 'Unable to reload tasks',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    }
  }

  const isLoading =
    isAppDataLoading ||
    (businessQuery.isPending && businessQuery.fetchStatus !== 'idle') ||
    (sitesQuery.isPending && sitesQuery.fetchStatus !== 'idle') ||
    (!!businessId && !!siteId && tasksQuery.isPending)
  const pageError =
    appDataError ??
    businessQuery.error ??
    sitesQuery.error ??
    siteSelectionError ??
    (businessId && siteId ? tasksQuery.error : null)

  if (isLoading) return <TasksSkeleton />

  if (pageError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-base font-medium">Unable to load tasks.</p>
        <p className="text-sm text-muted-foreground">
          {pageError.message || 'Something went wrong while retrieving tasks.'}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void retryLoading()}
        >
          Try again
        </Button>
      </div>
    )
  }

  const tasks = tasksQuery.data ?? EMPTY_TASKS
  const canCreateTask = !!businessId && !!siteId

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      {!businessId && (
        <p className="text-sm text-muted-foreground">
          No business workspace is available for this account.
        </p>
      )}
      {!siteId && (
        <p className="text-sm text-muted-foreground">
          No site is available. Open a site from the dashboard to view its tasks.
        </p>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Organize and track tasks across your workspace.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsImportOpen(true)}
            disabled={!canCreateTask || assigneesQuery.isPending || assigneesQuery.isError}
            className="h-9 gap-2 rounded-md px-3 text-sm"
          >
            <Download className="h-4 w-4" />
            Import
          </Button>
          <Button
            onClick={openCreateDrawer}
            disabled={!canCreateTask || assigneesQuery.isPending || assignees.length === 0}
            className="h-9 gap-2 rounded-md px-3 text-sm"
          >
            <Plus className="h-4 w-4" />
            Create task
          </Button>
        </div>
      </div>

      {assigneesQuery.isError && (
        <p role="alert" className="text-sm text-destructive">
          Unable to load business members for task assignment.
        </p>
      )}

      <TasksTable
        tasks={tasks}
        onEdit={openEditDrawer}
        onDelete={setTaskToDelete}
        onDeleteMany={setTasksToDelete}
        onUpdateMany={updateMany}
      />

      <TasksMutateDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        currentTask={currentTask}
        createdByFirstName={profile?.first_name ?? ''}
        assignees={assignees}
        assigneesLoading={assigneesQuery.isPending}
        assigneesError={assigneesQuery.isError}
        onSave={saveTask}
      />
      <TasksImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImport={importTasks}
      />

      <AlertDialog
        open={taskToDelete !== null || tasksToDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setTaskToDelete(null)
            setTasksToDelete(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete task{tasksToDelete?.length === 1 ? '' : 's'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected task
              {tasksToDelete && tasksToDelete.length !== 1 ? 's' : ''} will be
              removed from this list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDelete()}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
