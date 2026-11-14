import { useEffect, useState, type FormEvent } from 'react'
import type { Task, TaskLabel, TaskPriority, TaskStatus } from '../data/schema'
import {
  taskLabels,
  taskPriorities,
  taskStatuses,
} from '../data/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PopoverSelect } from './popover-select'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

type TaskValues = Omit<Task, 'id'>

type TasksMutateDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentTask: Task | null
  onSave: (values: TaskValues) => void
}

const statusLabels: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  'in progress': 'In Progress',
  done: 'Done',
  canceled: 'Canceled',
}

export function TasksMutateDrawer({
  open,
  onOpenChange,
  currentTask,
  onSave,
}: TasksMutateDrawerProps) {
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [label, setLabel] = useState<TaskLabel>('feature')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [error, setError] = useState('')

  useEffect(() => {
    setTitle(currentTask?.title ?? '')
    setStatus(currentTask?.status ?? 'todo')
    setLabel(currentTask?.label ?? 'feature')
    setPriority(currentTask?.priority ?? 'medium')
    setError('')
  }, [currentTask, open])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim()) {
      setError('Title is required.')
      return
    }

    onSave({ title: title.trim(), status, label, priority })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader className="text-left">
          <SheetTitle>{currentTask ? 'Update' : 'Create'} Task</SheetTitle>
          <SheetDescription>
            {currentTask
              ? 'Update the task details below.'
              : 'Add a task to your workspace.'}
          </SheetDescription>
        </SheetHeader>
        <form
          id="tasks-form"
          onSubmit={handleSubmit}
          className="flex-1 space-y-5 overflow-y-auto px-1"
        >
          <div className="space-y-2">
            <label htmlFor="task-title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="task-title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value)
                setError('')
              }}
              placeholder="Enter a title"
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <div className="space-y-2">
            <label htmlFor="task-status" className="text-sm font-medium">
              Status
            </label>
            <PopoverSelect
              id="task-status"
              aria-label="Status"
              value={status}
              onChange={(value) => setStatus(value as TaskStatus)}
              options={taskStatuses.map((value) => ({
                value,
                label: statusLabels[value],
              }))}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="task-label" className="text-sm font-medium">
              Label
            </label>
            <PopoverSelect
              id="task-label"
              aria-label="Label"
              value={label}
              onChange={(value) => setLabel(value as TaskLabel)}
              options={taskLabels.map((value) => ({
                value,
                label: value,
              }))}
              className="w-full capitalize"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="task-priority" className="text-sm font-medium">
              Priority
            </label>
            <PopoverSelect
              id="task-priority"
              aria-label="Priority"
              value={priority}
              onChange={(value) => setPriority(value as TaskPriority)}
              options={taskPriorities.map((value) => ({
                value,
                label: value,
              }))}
              className="w-full capitalize"
            />
          </div>
        </form>
        <SheetFooter className="gap-2">
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
          <Button form="tasks-form" type="submit">
            Save task
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
