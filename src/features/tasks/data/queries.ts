import { supabase } from '@/lib/supabase'
import type { Task, TaskPriority, TaskStatus } from './schema'
import { taskPriorities, taskStatuses } from './schema'

type TaskRow = {
  id: string
  task_number: number
  title: string
  status: string
  priority: string
  created_by: string
  assignee_id: string
  due_date: string
}

function isTaskStatus(value: string): value is TaskStatus {
  return taskStatuses.includes(value as TaskStatus)
}

function isTaskPriority(value: string): value is TaskPriority {
  return taskPriorities.includes(value as TaskPriority)
}

export function businessTasksQueryKey(
  userId: string | undefined,
  businessId: string | null,
  siteId: string | null
) {
  return ['business-tasks', userId, businessId, siteId] as const
}

export async function fetchBusinessId(
  userId: string,
  currentBusinessId: string | null
) {
  if (currentBusinessId) return currentBusinessId

  const { data: business, error } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_user_id', userId)
    .maybeSingle()
  if (error) throw error

  return business?.id ?? null
}

export async function fetchBusinessTasks(
  businessId: string,
  siteId: string
): Promise<Task[]> {
  const { data: rows, error: tasksError } = await supabase
    .from('business_tasks')
    .select(
      'id, task_number, title, status, priority, created_by, assignee_id, due_date'
    )
    .eq('business_id', businessId)
    .eq('site_id', siteId)
    .order('task_number', { ascending: false })
  if (tasksError) throw tasksError

  const taskRows = (rows ?? []) as TaskRow[]
  const profileIds = Array.from(
    new Set(taskRows.flatMap((task) => [task.created_by, task.assignee_id]))
  )
  const { data: profiles, error: profilesError } =
    profileIds.length > 0
      ? await supabase
          .from('profiles')
          .select('user_id, first_name')
          .in('user_id', profileIds)
      : { data: [], error: null }
  if (profilesError) throw profilesError

  const namesById = new Map(
    (profiles ?? []).map((person) => [
      person.user_id,
      person.first_name || 'Unknown',
    ])
  )
  return taskRows.map((task) => {
    if (!isTaskStatus(task.status)) {
      throw new Error(`Task ${task.task_number} has an invalid status.`)
    }
    if (!isTaskPriority(task.priority)) {
      throw new Error(`Task ${task.task_number} has an invalid priority.`)
    }

    return {
      id: task.id,
      taskNumber: task.task_number,
      title: task.title,
      status: task.status,
      priority: task.priority,
      createdByFirstName: namesById.get(task.created_by) ?? 'Unknown',
      assigneeId: task.assignee_id,
      assigneeFirstName: namesById.get(task.assignee_id) ?? 'Unknown',
      dueDate: task.due_date,
    }
  })
}
