import { useEffect, useState, type FormEvent } from 'react'
import type { Task, TaskPriority, TaskStatus, TaskValues } from '../data/schema'
import { taskPriorities, taskStatuses } from '../data/schema'
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

type Assignee = {
  userId: string
  firstName: string | null
  email: string
}

type TasksMutateDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentTask: Task | null
  createdByFirstName: string
  assignees: Assignee[]
  assigneesLoading: boolean
  assigneesError: boolean
  onSave: (values: TaskValues) => Promise<void>
}

const statusLabels: Record<TaskStatus, string> = {
  backlogged: 'Backlogged',
  todo: 'Todo',
  in_progress: 'In Progress',
  done: 'Done',
  canceled: 'Canceled',
}

function getTodayDate() {
  const date = new Date()
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 10)
}

export function TasksMutateDrawer({
  open,
  onOpenChange,
  currentTask,
  createdByFirstName,
  assignees,
  assigneesLoading,
  assigneesError,
  onSave,
}: TasksMutateDrawerProps) {
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [assigneeId, setAssigneeId] = useState('')
  const [dueDate, setDueDate] = useState(getTodayDate)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setTitle(currentTask?.title ?? '')
    setStatus(currentTask?.status ?? 'todo')
    setPriority(currentTask?.priority ?? 'medium')
    setAssigneeId(currentTask?.assigneeId ?? assignees[0]?.userId ?? '')
    setDueDate(currentTask?.dueDate ?? getTodayDate())
    setError('')
  }, [currentTask, open])

  useEffect(() => {
    if (!currentTask && !assigneeId && assignees.length > 0) {
      setAssigneeId(assignees[0].userId)
    }
  }, [currentTask, assigneeId, assignees])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim()) {
      setError('Title is required.')
      return
    }
    if (!assigneeId) {
      setError('Choose an assignee.')
      return
    }
    if (!dueDate) {
      setError('Due date is required.')
      return
    }

    setIsSaving(true)
    setError('')
    try {
      await onSave({
        title: title.trim(),
        status,
        priority,
        assigneeId,
        dueDate,
      })
      onOpenChange(false)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save task.')
    } finally {
      setIsSaving(false)
    }
  }

  const assigneeOptions = assignees.map((assignee) => ({
    value: assignee.userId,
    label:
      assignee.firstName ||
      assignee.email ||
      'Unnamed member',
  }))

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
            <label className="text-sm font-medium">Created by</label>
            <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              {currentTask?.createdByFirstName || createdByFirstName || 'You'}
            </p>
          </div>
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
              maxLength={200}
              autoFocus
            />
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
            <label htmlFor="task-assignee" className="text-sm font-medium">
              Assignee
            </label>
            {assigneesError ? (
              <p className="text-sm text-destructive">
                Unable to load business members.
              </p>
            ) : (
              <PopoverSelect
                id="task-assignee"
                aria-label="Assignee"
                value={assigneeId}
                onChange={setAssigneeId}
                options={
                  assigneesLoading
                    ? [{ value: '', label: 'Loading members...' }]
                    : assigneeOptions.length
                      ? assigneeOptions
                      : [{ value: '', label: 'No active members' }]
                }
                className="w-full"
              />
            )}
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
          <div className="space-y-2">
            <label htmlFor="task-due-date" className="text-sm font-medium">
              Due date
            </label>
            <Input
              id="task-due-date"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
        <SheetFooter className="gap-2">
          <SheetClose asChild>
            <Button variant="outline" disabled={isSaving}>
              Close
            </Button>
          </SheetClose>
          <Button
            form="tasks-form"
            type="submit"
            disabled={
              isSaving ||
              assigneesLoading ||
              assigneesError ||
              assignees.length === 0
            }
          >
            {isSaving ? 'Saving...' : 'Save task'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
