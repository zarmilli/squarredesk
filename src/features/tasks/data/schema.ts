export const taskStatuses = [
  'backlogged',
  'todo',
  'in_progress',
  'done',
  'canceled',
] as const

export const taskPriorities = ['low', 'medium', 'high', 'critical'] as const

export type TaskStatus = (typeof taskStatuses)[number]
export type TaskPriority = (typeof taskPriorities)[number]

export type TaskValues = {
  title: string
  status: TaskStatus
  priority: TaskPriority
  assigneeId: string
  dueDate: string
}

export type Task = TaskValues & {
  id: string
  taskNumber: number
  createdByFirstName: string
  assigneeFirstName: string
}
