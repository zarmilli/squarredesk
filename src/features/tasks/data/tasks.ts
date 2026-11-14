import type { Task } from './schema'

export const initialTasks: Task[] = [
  {
    id: 'TASK-1001',
    title: 'Review the new onboarding flow',
    status: 'in progress',
    label: 'feature',
    priority: 'high',
  },
  {
    id: 'TASK-1002',
    title: 'Fix the image upload error message',
    status: 'todo',
    label: 'bug',
    priority: 'critical',
  },
  {
    id: 'TASK-1003',
    title: 'Update the getting started guide',
    status: 'backlog',
    label: 'documentation',
    priority: 'low',
  },
  {
    id: 'TASK-1004',
    title: 'Add keyboard navigation to the menu',
    status: 'todo',
    label: 'feature',
    priority: 'medium',
  },
  {
    id: 'TASK-1005',
    title: 'Correct spacing on the profile page',
    status: 'done',
    label: 'bug',
    priority: 'low',
  },
  {
    id: 'TASK-1006',
    title: 'Document site publishing settings',
    status: 'in progress',
    label: 'documentation',
    priority: 'medium',
  },
]
