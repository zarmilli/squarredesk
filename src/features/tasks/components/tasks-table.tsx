import { useMemo, useState } from 'react'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import type { Task, TaskPriority, TaskStatus } from '../data/schema'
import { taskPriorities, taskStatuses } from '../data/schema'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PopoverSelect } from './popover-select'

type TasksTableProps = {
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onDeleteMany: (ids: string[]) => void
  onUpdateMany: (ids: string[], update: Partial<Task>) => void
}

const statusLabels: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  'in progress': 'In Progress',
  done: 'Done',
  canceled: 'Canceled',
}

const priorityLabels: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

function TaskActions({
  task,
  onEdit,
  onDelete,
}: {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Actions for ${task.id}`}
          className="h-8 w-8"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-32 p-1">
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            onEdit(task)
          }}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            onDelete(task)
          }}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-accent hover:text-destructive"
        >
          Delete
        </button>
      </PopoverContent>
    </Popover>
  )
}

function FilterSelect({
  value,
  onChange,
  label,
  options,
}: {
  value: string
  onChange: (value: string) => void
  label: string
  options: Array<{ value: string; label: string }>
}) {
  return (
    <PopoverSelect
      aria-label={label}
      value={value}
      onChange={onChange}
      options={[
        {
          value: '',
          label: `All ${label === 'Status' ? 'statuses' : `${label.toLowerCase()}s`}`,
        },
        ...options,
      ]}
    />
  )
}

export function TasksTable({
  tasks,
  onEdit,
  onDelete,
  onDeleteMany,
  onUpdateMany,
}: TasksTableProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase()
    return tasks.filter((task) => {
      const matchesSearch =
        !query ||
        task.id.toLowerCase().includes(query) ||
        task.title.toLowerCase().includes(query)
      return (
        matchesSearch &&
        (!statusFilter || task.status === statusFilter) &&
        (!priorityFilter || task.priority === priorityFilter)
      )
    })
  }, [tasks, search, statusFilter, priorityFilter])

  const visibleIds = filteredTasks.map((task) => task.id)
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id))

  function toggleAllVisible(checked: boolean) {
    setSelectedIds((current) =>
      checked
        ? Array.from(new Set([...current, ...visibleIds]))
        : current.filter((id) => !visibleIds.includes(id))
    )
  }

  function toggleTask(id: string, checked: boolean) {
    setSelectedIds((current) =>
      checked ? [...current, id] : current.filter((item) => item !== id)
    )
  }

  function applyBulkUpdate(update: Partial<Task>) {
    onUpdateMany(selectedIds, update)
    setSelectedIds([])
  }

  function deleteSelected() {
    onDeleteMany(selectedIds)
    setSelectedIds([])
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Filter by title or ID..."
          className="w-full sm:max-w-sm"
        />
        <FilterSelect
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={taskStatuses.map((value) => ({
            value,
            label: statusLabels[value],
          }))}
        />
        <FilterSelect
          label="Priority"
          value={priorityFilter}
          onChange={setPriorityFilter}
          options={taskPriorities.map((value) => ({
            value,
            label: priorityLabels[value],
          }))}
        />
      </div>

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 p-3">
          <span className="mr-auto text-sm text-muted-foreground">
            {selectedIds.length} selected
          </span>
          <PopoverSelect
            aria-label="Set selected task status"
            value=""
            onChange={(value) => {
              if (value) {
                applyBulkUpdate({ status: value as TaskStatus })
              }
            }}
            options={[
              { value: '', label: 'Set status' },
              ...taskStatuses.map((status) => ({
                value: status,
                label: statusLabels[status],
              })),
            ]}
            className="h-8 px-2"
          />
          <Button
            variant="outline"
            onClick={deleteSelected}
            className="h-9 gap-2 rounded-md px-3 text-sm font-normal"
          >
            <Trash2 className="h-4 w-4" />
            Delete selected
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="h-9">
              <TableHead className="w-10">
                <Checkbox
                  aria-label="Select all visible tasks"
                  checked={allVisibleSelected}
                  onCheckedChange={(checked) => toggleAllVisible(checked === true)}
                />
              </TableHead>
              <TableHead className="w-28">Task</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length ? (
              filteredTasks.map((task) => (
                <TableRow key={task.id} className="h-10">
                  <TableCell className="px-3 py-1">
                    <Checkbox
                      aria-label={`Select ${task.id}`}
                      checked={selectedIds.includes(task.id)}
                      onCheckedChange={(checked) =>
                        toggleTask(task.id, checked === true)
                      }
                    />
                  </TableCell>
                  <TableCell className="px-3 py-1 font-mono text-xs text-muted-foreground">
                    {task.id}
                  </TableCell>
                  <TableCell className="px-3 py-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <Badge variant="outline" className="shrink-0 capitalize">
                        {task.label}
                      </Badge>
                      <span className="truncate font-medium">{task.title}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-1">
                    <span className="whitespace-nowrap">
                      {statusLabels[task.status]}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-1">
                    {priorityLabels[task.priority]}
                  </TableCell>
                  <TableCell className="px-3 py-1">
                    <TaskActions
                      task={task}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No tasks match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
