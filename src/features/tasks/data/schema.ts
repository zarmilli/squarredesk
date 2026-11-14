export const taskStatuses = [
  'backlog',
  'todo',
  'in progress',
  'done',
  'canceled',
] as const

export const taskPriorities = ['low', 'medium', 'high', 'critical'] as const

export const taskLabels = ['bug', 'feature', 'documentation'] as const

export type TaskStatus = (typeof taskStatuses)[number]
export type TaskPriority = (typeof taskPriorities)[number]
export type TaskLabel = (typeof taskLabels)[number]

export type Task = {
  id: string
  title: string
  status: TaskStatus
  label: TaskLabel
  priority: TaskPriority
}
